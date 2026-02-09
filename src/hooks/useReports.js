import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useReportStats() {
    return useQuery({
        queryKey: ['report-stats'],
        queryFn: async () => {
            // Get all distributions
            const { data: foodDist, error: foodDistError } = await supabase
                .from('food_distribution')
                .select('*, recipients:food_recipients(count)')
            if (foodDistError) throw foodDistError

            const { data: reliefDist, error: reliefDistError } = await supabase
                .from('emergency_relief_distributions')
                .select('*, recipients:emergency_relief_recipients(count)')
            if (reliefDistError) throw reliefDistError

            // Get people stats
            const { data: people, error: peopleError } = await supabase
                .from('people')
                .select('gender, date_of_birth')
            if (peopleError) throw peopleError

            // Get students
            const { data: students, error: studentsError } = await supabase
                .from('educare_enrollment')
                .select('id')
                .eq('current_status', 'Active')
            if (studentsError) throw studentsError

            // Get women
            const { data: women, error: womenError } = await supabase
                .from('legacy_women_enrollment')
                .select('id')
                .eq('status', 'Active')
            if (womenError) throw womenError

            // Get Educare attendance (last 30 days)
            const thirtyDaysAgo = new Date()
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

            const { data: educareAttendance, error: educareAttendanceError } = await supabase
                .from('tuition_attendance')
                .select('status, attendance_date')
                .gte('attendance_date', thirtyDaysAgo.toISOString().split('T')[0])
            if (educareAttendanceError) throw educareAttendanceError

            // Get Legacy attendance (last 30 days)
            const { data: legacyAttendance, error: legacyAttendanceError } = await supabase
                .from('legacy_program_attendance')
                .select('status, session_date')
                .gte('session_date', thirtyDaysAgo.toISOString().split('T')[0])
            if (legacyAttendanceError) throw legacyAttendanceError

            // Calculate attendance rates
            const educarePresent = educareAttendance?.filter(a => a.status === 'Present').length || 0
            const educareTotal = educareAttendance?.length || 0
            const educareRate = educareTotal > 0 ? ((educarePresent / educareTotal) * 100).toFixed(1) : 0

            const legacyPresent = legacyAttendance?.filter(a => a.status === 'Present').length || 0
            const legacyTotal = legacyAttendance?.length || 0
            const legacyRate = legacyTotal > 0 ? ((legacyPresent / legacyTotal) * 100).toFixed(1) : 0

            // Calculate stats
            const totalFoodRecipients = foodDist?.reduce((sum, d) =>
                sum + (d.recipients?.[0]?.count || 0), 0) || 0

            const totalReliefRecipients = reliefDist?.reduce((sum, d) =>
                sum + (d.recipients?.[0]?.count || 0), 0) || 0

            const totalBeneficiaries = people?.length || 0

            // Gender breakdown
            const genderStats = people?.reduce((acc, p) => {
                const gender = p.gender || 'Unknown'
                acc[gender] = (acc[gender] || 0) + 1
                return acc
            }, {})

            // Age groups
            const ageGroups = people?.reduce((acc, p) => {
                if (!p.date_of_birth) {
                    acc['Unknown'] = (acc['Unknown'] || 0) + 1
                    return acc
                }
                const age = new Date().getFullYear() - new Date(p.date_of_birth).getFullYear()
                if (age < 18) acc['0-17'] = (acc['0-17'] || 0) + 1
                else if (age < 35) acc['18-34'] = (acc['18-34'] || 0) + 1
                else if (age < 60) acc['35-59'] = (acc['35-59'] || 0) + 1
                else acc['60+'] = (acc['60+'] || 0) + 1
                return acc
            }, {})

            return {
                totalBeneficiaries,
                totalFoodRecipients,
                totalReliefRecipients,
                activeStudents: students?.length || 0,
                activeWomen: women?.length || 0,
                educareAttendanceRate: educareRate,
                legacyAttendanceRate: legacyRate,
                educareAttendanceData: educareAttendance || [],
                legacyAttendanceData: legacyAttendance || [],
                genderStats,
                ageGroups,
                foodDistributions: foodDist || [],
                reliefDistributions: reliefDist || []
            }
        }
    })
}

export function useDistributionTrends() {
    return useQuery({
        queryKey: ['distribution-trends'],
        queryFn: async () => {
            const { data: foodDist, error } = await supabase
                .from('food_distribution')
                .select('quarter, year, recipients:food_recipients(count)')
                .order('year', { ascending: true })
                .order('quarter', { ascending: true })
            if (error) throw error

            return foodDist?.map(d => ({
                period: `${d.quarter} ${d.year}`,
                quarter: d.quarter,
                year: d.year,
                recipients: d.recipients?.[0]?.count || 0
            })) || []
        }
    })
}

export function useAttendanceTrends() {
    return useQuery({
        queryKey: ['attendance-trends'],
        queryFn: async () => {
            // Get last 7 days of attendance
            const days = []
            for (let i = 6; i >= 0; i--) {
                const date = new Date()
                date.setDate(date.getDate() - i)
                days.push(date.toISOString().split('T')[0])
            }

            const { data: educareData, error: educareError } = await supabase
                .from('tuition_attendance')
                .select('status, attendance_date')
                .gte('attendance_date', days[0])
            if (educareError) throw educareError

            const { data: legacyData, error: legacyError } = await supabase
                .from('legacy_program_attendance')
                .select('status, session_date')
                .gte('session_date', days[0])
            if (legacyError) throw legacyError

            return days.map(day => {
                const educareDay = educareData?.filter(a => a.attendance_date === day) || []
                const legacyDay = legacyData?.filter(a => a.session_date === day) || []

                const educarePresent = educareDay.filter(a => a.status === 'Present').length
                const legacyPresent = legacyDay.filter(a => a.status === 'Present').length

                return {
                    date: new Date(day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                    educare: educarePresent,
                    legacy: legacyPresent
                }
            })
        }
    })
}
