import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, fetchAllRows } from '@/lib/supabase'

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
            // Records with an empty status mean "cleared" and must be deleted.
            for (const record of attendanceRecords.filter((r) => !r.status)) {
                const { error } = await supabase
                    .from('legacy_program_attendance')
                    .delete()
                    .eq('woman_id', record.woman_id)
                    .eq('session_date', record.session_date)
                    .eq('session_type', record.session_type)

                if (error) throw error
            }

            const toUpsert = attendanceRecords.filter((r) => r.status)
            if (toUpsert.length === 0) return []

            const { data, error } = await supabase
                .from('legacy_program_attendance')
                .upsert(toUpsert, { onConflict: 'woman_id,session_date,session_type' })
                .select()

            if (error) throw error
            return data
        },
        onSuccess: (_, variables) => {
            const date = variables[0]?.session_date
            queryClient.invalidateQueries({ queryKey: ['legacy-attendance', date] })
            queryClient.invalidateQueries({ queryKey: ['legacy-attendance-summary'] })
        },
    })
}

async function fetchActiveWomen(stage) {
    let womenQuery = supabase
        .from('legacy_women_enrollment')
        .select('*, person:people(id, first_name, last_name)')
        .eq('status', 'Active')

    if (stage && stage !== 'all') {
        womenQuery = womenQuery.eq('stage', stage)
    }

    const { data: women, error } = await womenQuery
    if (error) throw error
    return women
}

async function fetchLegacyAttendanceInRange(startDate, endDate) {
    return fetchAllRows((from, to) => {
        let query = supabase.from('legacy_program_attendance').select('*')
        if (startDate) query = query.gte('session_date', startDate)
        if (endDate) query = query.lte('session_date', endDate)
        return query
            .order('session_date', { ascending: true })
            .order('id', { ascending: true })
            .range(from, to)
    })
}

function buildLegacyAttendanceReport(women, attendance) {
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
}

export function useMonthlyLegacyAttendanceReport(month, year, stage) {
    return useQuery({
        queryKey: ['monthly-legacy-attendance', month, year, stage],
        queryFn: async () => {
            const startDate = `${year}-${month}-01`
            const lastDay = new Date(year, parseInt(month), 0).getDate()
            const endDate = `${year}-${month}-${lastDay.toString().padStart(2, '0')}`

            const women = await fetchActiveWomen(stage)
            const attendance = await fetchLegacyAttendanceInRange(startDate, endDate)

            return buildLegacyAttendanceReport(women, attendance)
        },
        enabled: !!month && !!year
    })
}

export function useTermlyLegacyAttendanceReport(term, year, stage) {
    return useQuery({
        queryKey: ['termly-legacy-attendance', term, year, stage],
        queryFn: async () => {
            const termRanges = {
                '1': { start: `${year}-01-01`, end: `${year}-04-30` },
                '2': { start: `${year}-05-01`, end: `${year}-08-31` },
                '3': { start: `${year}-09-01`, end: `${year}-12-31` }
            }

            const { start: startDate, end: endDate } = termRanges[term]

            const women = await fetchActiveWomen(stage)
            const attendance = await fetchLegacyAttendanceInRange(startDate, endDate)

            return buildLegacyAttendanceReport(women, attendance)
        },
        enabled: !!term && !!year
    })
}

export function useYearlyLegacyAttendanceReport(year, stage) {
    return useQuery({
        queryKey: ['yearly-legacy-attendance', year, stage],
        queryFn: async () => {
            const startDate = `${year}-01-01`
            const endDate = `${year}-12-31`

            const women = await fetchActiveWomen(stage)
            const attendance = await fetchLegacyAttendanceInRange(startDate, endDate)

            return buildLegacyAttendanceReport(women, attendance)
        },
        enabled: !!year
    })
}

export function useAllTimeLegacyAttendanceReport(stage) {
    return useQuery({
        queryKey: ['alltime-legacy-attendance', stage],
        queryFn: async () => {
            const women = await fetchActiveWomen(stage)
            const attendance = await fetchLegacyAttendanceInRange(null, null)

            return buildLegacyAttendanceReport(women, attendance)
        },
    })
}
