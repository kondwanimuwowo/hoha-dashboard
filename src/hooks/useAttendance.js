import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useAttendance(date, gradeFilters) {
    return useQuery({
        queryKey: ['attendance', date, gradeFilters],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('tuition_attendance')
                .select(`
          *,
          child:people(
            id,
            first_name,
            last_name,
            photo_url,
            educare_enrollment(grade_level, current_status, deleted_at)
          ),
          schedule:tuition_schedule(*)
        `)
                .eq('attendance_date', date)

            if (error) throw error

            const selectedGrades = Array.isArray(gradeFilters)
                ? gradeFilters.filter(Boolean)
                : (gradeFilters && gradeFilters !== 'all' ? [gradeFilters] : [])

            if (selectedGrades.length > 0) {
                return (data || []).filter((record) => {
                    const enrollment = record.child?.educare_enrollment?.find((e) => !e.deleted_at)
                    return enrollment && selectedGrades.includes(enrollment.grade_level)
                })
            }

            return data
        },
        enabled: !!date,
    })
}

export function useAttendanceSummary(childId, startDate, endDate) {
    return useQuery({
        queryKey: ['attendance-summary', childId, startDate, endDate],
        queryFn: async () => {
            let query = supabase
                .from('tuition_attendance')
                .select('*')
                .eq('child_id', childId)

            if (startDate) {
                query = query.gte('attendance_date', startDate)
            }

            if (endDate) {
                query = query.lte('attendance_date', endDate)
            }

            const { data, error } = await query.order('attendance_date', { ascending: false })

            if (error) throw error

            // Calculate summary
            const total = data.length
            const present = data.filter(a => a.status === 'Present').length
            const absent = data.filter(a => a.status === 'Absent').length
            const excused = data.filter(a => a.status === 'Excused').length
            const late = data.filter(a => a.status === 'Late').length
            const percentage = total > 0 ? ((present + late) / total * 100).toFixed(1) : 0

            return {
                data,
                summary: {
                    total,
                    present,
                    absent,
                    excused,
                    late,
                    percentage,
                },
            }
        },
        enabled: !!childId,
    })
}

export function useMarkAttendance() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (attendanceRecords) => {
            const results = []

            for (const record of attendanceRecords) {
                let findQuery = supabase
                    .from('tuition_attendance')
                    .select('id')
                    .eq('child_id', record.child_id)
                    .eq('attendance_date', record.attendance_date)
                    .limit(1)

                if (record.schedule_id) {
                    findQuery = findQuery.eq('schedule_id', record.schedule_id)
                } else {
                    findQuery = findQuery.is('schedule_id', null)
                }

                const { data: existing, error: findError } = await findQuery.maybeSingle()
                if (findError) throw findError

                if (existing?.id) {
                    const { data: updated, error: updateError } = await supabase
                        .from('tuition_attendance')
                        .update({
                            status: record.status,
                            notes: record.notes || null,
                            schedule_id: record.schedule_id || null,
                        })
                        .eq('id', existing.id)
                        .select()
                        .single()

                    if (updateError) throw updateError
                    results.push(updated)
                } else {
                    const { data: inserted, error: insertError } = await supabase
                        .from('tuition_attendance')
                        .insert([record])
                        .select()
                        .single()

                    if (insertError) throw insertError
                    results.push(inserted)
                }
            }

            return results
        },
        onSuccess: (_, variables) => {
            const date = variables[0]?.attendance_date
            queryClient.invalidateQueries({ queryKey: ['attendance', date] })
            queryClient.invalidateQueries({ queryKey: ['attendance-summary'] })
        },
    })
}

export function useMonthlyAttendanceReport(month, year, gradeLevel) {
    return useQuery({
        queryKey: ['monthly-attendance', month, year, gradeLevel],
        queryFn: async () => {
            // Calculate date range for the month
            const startDate = `${year}-${month}-01`
            const lastDay = new Date(year, parseInt(month), 0).getDate()
            const endDate = `${year}-${month}-${lastDay.toString().padStart(2, '0')}`

            // Get all students for the grade
            let studentsQuery = supabase
                .from('educare_enrollment')
                .select('*, person:people(id, first_name, last_name)')
                .eq('current_status', 'Active')

            const selectedGrades = Array.isArray(gradeLevel)
                ? gradeLevel.filter(Boolean)
                : (gradeLevel && gradeLevel !== 'all' ? [gradeLevel] : [])

            if (selectedGrades.length > 0) {
                studentsQuery = studentsQuery.in('grade_level', selectedGrades)
            }

            const { data: students, error: studentsError } = await studentsQuery
            if (studentsError) throw studentsError

            // Get attendance records for the month
            const { data: attendance, error: attendanceError } = await supabase
                .from('tuition_attendance')
                .select('*')
                .gte('attendance_date', startDate)
                .lte('attendance_date', endDate)

            if (attendanceError) throw attendanceError

            // Calculate stats for each student
            const studentStats = students.map(student => {
                const studentAttendance = attendance.filter(a => a.child_id === student.person_id)
                const total = studentAttendance.length
                const present = studentAttendance.filter(a => a.status === 'Present').length
                const absent = studentAttendance.filter(a => a.status === 'Absent').length
                const excused = studentAttendance.filter(a => a.status === 'Excused').length
                const late = studentAttendance.filter(a => a.status === 'Late').length
                const rate = total > 0 ? ((present + late) / total * 100).toFixed(1) : 0

                return {
                    student_id: student.person_id,
                    name: `${student.person.first_name} ${student.person.last_name}`,
                    grade: student.grade_level,
                    total,
                    present,
                    absent,
                    excused,
                    late,
                    rate: parseFloat(rate)
                }
            })

            // Calculate overall stats
            const totalRecords = attendance.length
            const totalPresent = attendance.filter(a => a.status === 'Present').length
            const totalAbsent = attendance.filter(a => a.status === 'Absent').length
            const overallRate = totalRecords > 0 ? ((totalPresent / totalRecords) * 100).toFixed(1) : 0

            return {
                students: studentStats,
                summary: {
                    totalStudents: students.length,
                    totalRecords,
                    totalPresent,
                    totalAbsent,
                    overallRate: parseFloat(overallRate)
                }
            }
        },
        enabled: !!month && !!year
    })
}

export function useTermlyAttendanceReport(term, year, gradeLevel) {
    return useQuery({
        queryKey: ['termly-attendance', term, year, gradeLevel],
        queryFn: async () => {
            // Define term date ranges
            const termRanges = {
                '1': { start: `${year}-01-01`, end: `${year}-04-30` },
                '2': { start: `${year}-05-01`, end: `${year}-08-31` },
                '3': { start: `${year}-09-01`, end: `${year}-12-31` }
            }

            const { start: startDate, end: endDate } = termRanges[term]

            // Get all students for the grade
            let studentsQuery = supabase
                .from('educare_enrollment')
                .select('*, person:people(id, first_name, last_name)')
                .eq('current_status', 'Active')

            const selectedGrades = Array.isArray(gradeLevel)
                ? gradeLevel.filter(Boolean)
                : (gradeLevel && gradeLevel !== 'all' ? [gradeLevel] : [])

            if (selectedGrades.length > 0) {
                studentsQuery = studentsQuery.in('grade_level', selectedGrades)
            }

            const { data: students, error: studentsError } = await studentsQuery
            if (studentsError) throw studentsError

            // Get attendance records for the term
            const { data: attendance, error: attendanceError } = await supabase
                .from('tuition_attendance')
                .select('*')
                .gte('attendance_date', startDate)
                .lte('attendance_date', endDate)

            if (attendanceError) throw attendanceError

            // Calculate stats for each student
            const studentStats = students.map(student => {
                const studentAttendance = attendance.filter(a => a.child_id === student.person_id)
                const total = studentAttendance.length
                const present = studentAttendance.filter(a => a.status === 'Present').length
                const absent = studentAttendance.filter(a => a.status === 'Absent').length
                const excused = studentAttendance.filter(a => a.status === 'Excused').length
                const late = studentAttendance.filter(a => a.status === 'Late').length
                const rate = total > 0 ? ((present + late) / total * 100).toFixed(1) : 0

                return {
                    student_id: student.person_id,
                    name: `${student.person.first_name} ${student.person.last_name}`,
                    grade: student.grade_level,
                    total,
                    present,
                    absent,
                    excused,
                    late,
                    rate: parseFloat(rate)
                }
            })

            // Calculate overall stats
            const totalRecords = attendance.length
            const totalPresent = attendance.filter(a => a.status === 'Present').length
            const totalAbsent = attendance.filter(a => a.status === 'Absent').length
            const overallRate = totalRecords > 0 ? ((totalPresent / totalRecords) * 100).toFixed(1) : 0

            return {
                students: studentStats,
                summary: {
                    totalStudents: students.length,
                    totalRecords,
                    totalPresent,
                    totalAbsent,
                    overallRate: parseFloat(overallRate)
                }
            }
        },
        enabled: !!term && !!year
    })
}
