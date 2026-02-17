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
          recipients:emergency_relief_recipients(
            *,
            family_head:people(id, first_name, last_name, is_registered_member)
          )
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

export function useRecipientHistory(personId) {
    return useQuery({
        queryKey: ['recipient-history', personId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('emergency_relief_recipients')
                .select(`
                    *,
                    distribution:emergency_relief_distributions(*)
                `)
                .eq('family_head_id', personId)
                // Order by created_at as a proxy for date, since we can't easily sort by joined column without a view
                .order('created_at', { ascending: false })

            if (error) throw error
            return data
        },
        enabled: !!personId,
    })
}
