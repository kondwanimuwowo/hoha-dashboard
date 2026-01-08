import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useEmergencyDistributions() {
    return useQuery({
        queryKey: ['emergency-distributions'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('emergency_relief_distributions')
                .select(`
          *,
          recipients:emergency_relief_recipients(*)
        `)
                .order('distribution_date', { ascending: false })

            if (error) throw error
            return data
        },
    })
}

export function useCreateEmergencyDistribution() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({ recipients, ...distributionData }) => {
            // Create distribution
            const { data: distribution, error: distError } = await supabase
                .from('emergency_relief_distributions')
                .insert([distributionData])
                .select()
                .single()

            if (distError) throw distError

            // Create recipients
            const recipientsData = recipients.map(r => ({
                ...r,
                distribution_id: distribution.id,
            }))

            const { error: recipientsError } = await supabase
                .from('emergency_relief_recipients')
                .insert(recipientsData)

            if (recipientsError) throw recipientsError

            return distribution
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['emergency-distributions'] })
        },
    })
}
