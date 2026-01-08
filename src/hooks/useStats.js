import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useDashboardStats() {
    return useQuery({
        queryKey: ['dashboard-stats'],
        queryFn: async () => {
            // Get total active students
            const { count: studentsCount, error: studentsError } = await supabase
                .from('educare_enrollment')
                .select('*', { count: 'exact', head: true })
                .eq('current_status', 'Active')

            if (studentsError) throw studentsError

            // Get total women in Legacy
            const { count: womenCount, error: womenError } = await supabase
                .from('legacy_women_enrollment')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'Active')

            if (womenError) throw womenError

            // Get medical visits this month
            const startOfMonth = new Date()
            startOfMonth.setDate(1)
            startOfMonth.setHours(0, 0, 0, 0)

            const { count: visitsCount, error: visitsError } = await supabase
                .from('clinicare_visits')
                .select('*', { count: 'exact', head: true })
                .gte('visit_date', startOfMonth.toISOString())

            if (visitsError) throw visitsError

            // Get next food distribution
            const { data: nextDistribution, error: distributionError } = await supabase
                .from('food_distribution')
                .select('*')
                .gte('distribution_date', new Date().toISOString())
                .order('distribution_date')
                .limit(1)
                .limit(1)
                .maybeSingle()

            // Don't throw error if no upcoming distribution

            // Get recent activity counts
            const thirtyDaysAgo = new Date()
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

            const { count: recentStudents } = await supabase
                .from('educare_enrollment')
                .select('*', { count: 'exact', head: true })
                .gte('enrollment_date', thirtyDaysAgo.toISOString())

            const { count: recentWomen } = await supabase
                .from('legacy_women_enrollment')
                .select('*', { count: 'exact', head: true })
                .gte('enrollment_date', thirtyDaysAgo.toISOString())

            return {
                studentsCount: studentsCount || 0,
                womenCount: womenCount || 0,
                visitsCount: visitsCount || 0,
                nextDistribution: nextDistribution || null,
                recentActivity: {
                    students: recentStudents || 0,
                    women: recentWomen || 0,
                }
            }
        },
    })
}

// Stats for Educare Overview
export function useEducareStats() {
    return useQuery({
        queryKey: ['educare-stats'],
        queryFn: async () => {
            const { data: enrollments, error } = await supabase
                .from('educare_enrollment')
                .select('grade_level, current_status')

            if (error) throw error

            const total = enrollments.length
            const active = enrollments.filter(e => e.current_status === 'Active').length
            const earlyChildhood = enrollments.filter(e =>
                e.grade_level === 'Baby Class' || e.grade_level === 'Reception'
            ).length
            const graduated = enrollments.filter(e => e.current_status === 'Graduated').length

            return {
                total,
                active,
                earlyChildhood,
                primarySecondary: total - earlyChildhood,
                graduated,
            }
        },
    })
}

// Stats for Legacy Overview
export function useLegacyStats() {
    return useQuery({
        queryKey: ['legacy-stats'],
        queryFn: async () => {
            const { data: enrollments, error } = await supabase
                .from('legacy_women_enrollment')
                .select('status, stage')

            if (error) throw error

            const total = enrollments.length
            const active = enrollments.filter(e => e.status === 'Active').length
            const completed = enrollments.filter(e => e.status === 'Completed').length
            const completionRate = total > 0 ? ((completed / total) * 100).toFixed(0) : 0

            // Get women with children in Educare
            const { data: relationships } = await supabase
                .from('relationships')
                .select('person_id')
                .in('relationship_type', ['Mother', 'Parent', 'Guardian'])

            const womenWithChildren = new Set(relationships?.map(r => r.person_id) || []).size

            return {
                total,
                active,
                completed,
                completionRate,
                womenWithChildren,
            }
        },
    })
}