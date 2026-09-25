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

export function useEmergencyDistribution(id) {
    return useQuery({
        queryKey: ['emergency-distribution', id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('emergency_relief_distributions')
                .select(`
                    *,
                    recipients:emergency_relief_recipients(
                        *,
                        family_head:people!family_head_id(*)
                    )
                `)
                .eq('id', id)
                .single()

            if (error) throw error
            return data
        },
        enabled: !!id,
    })
}

function invalidateEmergencyQueries(queryClient) {
    queryClient.invalidateQueries({ queryKey: ['emergency-distribution'] })
    queryClient.invalidateQueries({ queryKey: ['emergency-distributions'] })
    queryClient.invalidateQueries({ queryKey: ['relief-history'] })
}

export function useMarkEmergencyCollected() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({ recipientId, collected }) => {
            const { error } = await supabase
                .from('emergency_relief_recipients')
                .update({ collected })
                .eq('id', recipientId)

            if (error) throw error
        },
        onSuccess: () => invalidateEmergencyQueries(queryClient),
    })
}

export function useUpdateEmergencyDistribution() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({ id, distribution_date, reason, notes }) => {
            const { error } = await supabase
                .from('emergency_relief_distributions')
                .update({ distribution_date, reason, notes: notes || null })
                .eq('id', id)

            if (error) throw error
        },
        onSuccess: () => invalidateEmergencyQueries(queryClient),
    })
}

export function useDeleteEmergencyDistribution() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (id) => {
            // Recipients are removed explicitly so this works even if the live
            // foreign key was created without ON DELETE CASCADE.
            const { error: recipientsError } = await supabase
                .from('emergency_relief_recipients')
                .delete()
                .eq('distribution_id', id)

            if (recipientsError) throw recipientsError

            const { error } = await supabase
                .from('emergency_relief_distributions')
                .delete()
                .eq('id', id)

            if (error) throw error
        },
        onSuccess: () => invalidateEmergencyQueries(queryClient),
    })
}

export function useAddEmergencyRecipient() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({ distribution_id, family_head_id, ad_hoc_name, items_provided }) => {
            const { error } = await supabase
                .from('emergency_relief_recipients')
                .insert([{
                    distribution_id,
                    family_head_id: family_head_id || null,
                    ad_hoc_name: ad_hoc_name || null,
                    items_provided: items_provided || '',
                }])

            if (error) throw error
        },
        onSuccess: () => invalidateEmergencyQueries(queryClient),
    })
}

export function useUpdateEmergencyRecipient() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({ recipientId, items_provided }) => {
            const { error } = await supabase
                .from('emergency_relief_recipients')
                .update({ items_provided })
                .eq('id', recipientId)

            if (error) throw error
        },
        onSuccess: () => invalidateEmergencyQueries(queryClient),
    })
}

export function useRemoveEmergencyRecipient() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (recipientId) => {
            const { error } = await supabase
                .from('emergency_relief_recipients')
                .delete()
                .eq('id', recipientId)

            if (error) throw error
        },
        onSuccess: () => invalidateEmergencyQueries(queryClient),
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
