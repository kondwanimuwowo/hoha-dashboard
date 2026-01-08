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

            if (sessionType) {
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
            const { data, error } = await supabase
                .from('legacy_program_attendance')
                .upsert(attendanceRecords, {
                    onConflict: 'woman_id,session_date,session_type'
                })
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