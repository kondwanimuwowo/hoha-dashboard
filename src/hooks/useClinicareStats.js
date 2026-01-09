import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useClinicareStats(startDate, endDate) {
    return useQuery({
        queryKey: ['clinicare-stats', startDate, endDate],
        queryFn: async () => {
            let query = supabase
                .from('clinicare_visits')
                .select('*')

            if (startDate) {
                query = query.gte('visit_date', startDate)
            }

            if (endDate) {
                query = query.lte('visit_date', endDate)
            }

            const { data: visits, error } = await query

            if (error) throw error

            // Calculate statistics
            const totalVisits = visits.length
            const emergencyVisits = visits.filter(v => v.is_emergency).length
            const programVisits = visits.filter(v => v.in_hoha_program).length
            const communityVisits = visits.filter(v => !v.in_hoha_program).length

            const totalCost = visits.reduce((sum, v) => sum + (parseFloat(v.cost_amount) || 0), 0)
            const totalMedicalFees = visits.reduce((sum, v) => sum + (parseFloat(v.medical_fees) || 0), 0)
            const totalTransportCosts = visits.reduce((sum, v) => sum + (parseFloat(v.transport_costs) || 0), 0)
            const totalOtherFees = visits.reduce((sum, v) => sum + (parseFloat(v.other_fees) || 0), 0)

            // Visits with transport
            const visitsWithTransport = visits.filter(v => v.transport_provided).length

            // Top facilities
            const facilityCount = visits.reduce((acc, v) => {
                const facility = v.facility_name || 'Unknown'
                acc[facility] = (acc[facility] || 0) + 1
                return acc
            }, {})

            const topFacilities = Object.entries(facilityCount)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([name, count]) => ({ name, count }))

            // Top diagnoses
            const diagnosisCount = visits.reduce((acc, v) => {
                if (v.diagnosis) {
                    acc[v.diagnosis] = (acc[v.diagnosis] || 0) + 1
                }
                return acc
            }, {})

            const topDiagnoses = Object.entries(diagnosisCount)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([name, count]) => ({ name, count }))

            // Visits by month
            const visitsByMonth = visits.reduce((acc, v) => {
                const month = v.visit_date.substring(0, 7) // YYYY-MM
                acc[month] = (acc[month] || 0) + 1
                return acc
            }, {})

            return {
                totalVisits,
                emergencyVisits,
                programVisits,
                communityVisits,
                totalCost,
                totalMedicalFees,
                totalOtherFees,
                totalTransportCosts,
                visitsWithTransport,
                averageCostPerVisit: totalVisits > 0 ? totalCost / totalVisits : 0,
                topFacilities,
                topDiagnoses,
                visitsByMonth,
            }
        },
    })
}