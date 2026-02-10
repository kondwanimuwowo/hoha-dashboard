import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useLegacyAttendance(date, sessionType) {
    return useQuery({
        queryKey: ['legacy-attendance', date, sessionType],
        queryFn: async () => {
            let query = supabase
                .from('legacy_program_attendance')
                .select(`
          *,
          woman:people(*)
        `)
                .eq('session_date', date)

            if (sessionType && sessionType !== 'all') {
                query = query.eq('session_type', sessionType)
            }

            const { data, error } = await query

            if (error) throw error
            return data
        },
        enabled: !!date,
    })
}

export function useLegacyAttendanceSummary(womanId, startDate, endDate) {
    return useQuery({
        queryKey: ['legacy-attendance-summary', womanId, startDate, endDate],
        queryFn: async () => {
            let query = supabase
                .from('legacy_program_attendance')
                .select('*')
                .eq('woman_id', womanId)

            if (startDate) {
                query = query.gte('session_date', startDate)
            }

            if (endDate) {
                query = query.lte('session_date', endDate)
            }

            const { data, error } = await query.order('session_date', { ascending: false })

            if (error) throw error

            // Calculate summary
            const total = data.length
            const present = data.filter(a => a.status === 'Present').length
            const absent = data.filter(a => a.status === 'Absent').length
            const excused = data.filter(a => a.status === 'Excused').length
            const percentage = total > 0 ? ((present / total) * 100).toFixed(1) : 0

            // Group by session type
            const bySessionType = data.reduce((acc, record) => {
                const type = record.session_type
                if (!acc[type]) {
                    acc[type] = { total: 0, present: 0 }
                }
                acc[type].total++
                if (record.status === 'Present') {
                    acc[type].present++
                }
                return acc
            }, {})

            return {
                data,
                summary: {
                    total,
                    present,
                    absent,
                    excused,
                    percentage,
                },
                bySessionType,
            }
        },
        enabled: !!womanId,
    })
}

export function useMarkLegacyAttendance() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (attendanceRecords) => {
            const results = []

            for (const record of attendanceRecords) {
                const { data: existing, error: findError } = await supabase
                    .from('legacy_program_attendance')
                    .select('id')
                    .eq('woman_id', record.woman_id)
                    .eq('session_date', record.session_date)
                    .eq('session_type', record.session_type)
                    .limit(1)
                    .maybeSingle()

                if (findError) throw findError

                if (existing?.id) {
                    const { data: updated, error: updateError } = await supabase
                        .from('legacy_program_attendance')
                        .update({
                            status: record.status,
                            notes: record.notes || null,
                        })
                        .eq('id', existing.id)
                        .select()
                        .single()

                    if (updateError) throw updateError
                    results.push(updated)
                } else {
                    const { data: inserted, error: insertError } = await supabase
                        .from('legacy_program_attendance')
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
            const date = variables[0]?.session_date
            queryClient.invalidateQueries({ queryKey: ['legacy-attendance', date] })
            queryClient.invalidateQueries({ queryKey: ['legacy-attendance-summary'] })
        },
    })
}

export function useMonthlyLegacyAttendanceReport(month, year, stage) {
    return useQuery({
        queryKey: ['monthly-legacy-attendance', month, year, stage],
        queryFn: async () => {
            // Calculate date range for the month
            const startDate = `${year}-${month}-01`
            const lastDay = new Date(year, parseInt(month), 0).getDate()
            const endDate = `${year}-${month}-${lastDay.toString().padStart(2, '0')}`

            // Get all women for the stage
            let womenQuery = supabase
                .from('legacy_women_enrollment')
                .select('*, person:people(id, first_name, last_name)')
                .eq('status', 'Active')

            if (stage && stage !== 'all') {
                womenQuery = womenQuery.eq('stage', stage)
            }

            const { data: women, error: womenError } = await womenQuery
            if (womenError) throw womenError

            // Get attendance records for the month
            const { data: attendance, error: attendanceError } = await supabase
                .from('legacy_program_attendance')
                .select('*')
                .gte('session_date', startDate)
                .lte('session_date', endDate)

            if (attendanceError) throw attendanceError

            // Calculate stats for each woman
            const womenStats = women.map(woman => {
                const womanAttendance = attendance.filter(a => a.woman_id === woman.person_id)
                const total = womanAttendance.length
                const present = womanAttendance.filter(a => a.status === 'Present').length
                const absent = womanAttendance.filter(a => a.status === 'Absent').length
                const excused = womanAttendance.filter(a => a.status === 'Excused').length
                const rate = total > 0 ? ((present / total) * 100).toFixed(1) : 0

                return {
                    woman_id: woman.person_id,
                    name: `${woman.person.first_name} ${woman.person.last_name}`,
                    stage: woman.stage,
                    total,
                    present,
                    absent,
                    excused,
                    rate: parseFloat(rate)
                }
            })

            // Calculate overall stats
            const totalRecords = attendance.length
            const totalPresent = attendance.filter(a => a.status === 'Present').length
            const totalAbsent = attendance.filter(a => a.status === 'Absent').length
            const overallRate = totalRecords > 0 ? ((totalPresent / totalRecords) * 100).toFixed(1) : 0

            return {
                women: womenStats,
                summary: {
                    totalWomen: women.length,
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

export function useTermlyLegacyAttendanceReport(term, year, stage) {
    return useQuery({
        queryKey: ['termly-legacy-attendance', term, year, stage],
        queryFn: async () => {
            // Define term date ranges
            const termRanges = {
                '1': { start: `${year}-01-01`, end: `${year}-04-30` },
                '2': { start: `${year}-05-01`, end: `${year}-08-31` },
                '3': { start: `${year}-09-01`, end: `${year}-12-31` }
            }

            const { start: startDate, end: endDate } = termRanges[term]

            // Get all women for the stage
            let womenQuery = supabase
                .from('legacy_women_enrollment')
                .select('*, person:people(id, first_name, last_name)')
                .eq('status', 'Active')

            if (stage && stage !== 'all') {
                womenQuery = womenQuery.eq('stage', stage)
            }

            const { data: women, error: womenError } = await womenQuery
            if (womenError) throw womenError

            // Get attendance records for the term
            const { data: attendance, error: attendanceError } = await supabase
                .from('legacy_program_attendance')
                .select('*')
                .gte('session_date', startDate)
                .lte('session_date', endDate)

            if (attendanceError) throw attendanceError

            // Calculate stats for each woman
            const womenStats = women.map(woman => {
                const womanAttendance = attendance.filter(a => a.woman_id === woman.person_id)
                const total = womanAttendance.length
                const present = womanAttendance.filter(a => a.status === 'Present').length
                const absent = womanAttendance.filter(a => a.status === 'Absent').length
                const excused = womanAttendance.filter(a => a.status === 'Excused').length
                const rate = total > 0 ? ((present / total) * 100).toFixed(1) : 0

                return {
                    woman_id: woman.person_id,
                    name: `${woman.person.first_name} ${woman.person.last_name}`,
                    stage: woman.stage,
                    total,
                    present,
                    absent,
                    excused,
                    rate: parseFloat(rate)
                }
            })

            // Calculate overall stats
            const totalRecords = attendance.length
            const totalPresent = attendance.filter(a => a.status === 'Present').length
            const totalAbsent = attendance.filter(a => a.status === 'Absent').length
            const overallRate = totalRecords > 0 ? ((totalPresent / totalRecords) * 100).toFixed(1) : 0

            return {
                women: womenStats,
                summary: {
                    totalWomen: women.length,
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
