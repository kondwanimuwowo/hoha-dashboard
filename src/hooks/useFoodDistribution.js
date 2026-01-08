import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useDistributions() {
    return useQuery({
        queryKey: ['distributions'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('food_distribution')
                .select(`
          *,
          recipients:food_recipients(count)
        `)
                .order('distribution_date', { ascending: false })

            if (error) throw error
            return data
        },
    })
}

export function useDistribution(id) {
    return useQuery({
        queryKey: ['distribution', id],
        queryFn: async () => {
            const { data: distribution, error: distError } = await supabase
                .from('food_distribution')
                .select('*')
                .eq('id', id)
                .single()

            if (distError) throw distError

            const { data: recipients, error: recError } = await supabase
                .from('food_recipients')
                .select(`
          *,
          family_head:people(*)
        `)
                .eq('distribution_id', id)

            if (recError) throw recError

            return {
                ...distribution,
                recipients: recipients || [],
            }
        },
        enabled: !!id,
    })
}

export function useCreateDistribution() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (distributionData) => {
            const { data, error } = await supabase
                .from('food_distribution')
                .insert([distributionData])
                .select()
                .single()

            if (error) throw error
            return data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['distributions'] })
            queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
        },
    })
}

export function useAddRecipient() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (recipientData) => {
            const { data, error } = await supabase
                .from('food_recipients')
                .insert([recipientData])
                .select()
                .single()

            if (error) throw error
            return data
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['distribution', variables.distribution_id] })
            queryClient.invalidateQueries({ queryKey: ['distributions'] })
        },
    })
}

export function useUpdateDistribution() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({ id, updates }) => {
            const { data, error } = await supabase
                .from('food_distribution')
                .update(updates)
                .eq('id', id)
                .select()
                .single()

            if (error) throw error
            return data
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['distributions'] })
            queryClient.invalidateQueries({ queryKey: ['distribution', variables.id] })
        },
    })
}

export function useMarkCollected() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({ recipientId, collectionTime }) => {
            const { data, error } = await supabase
                .from('food_recipients')
                .update({ collection_time: collectionTime })
                .eq('id', recipientId)
                .select()
                .single()

            if (error) throw error
            return data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['distribution'] })
            queryClient.invalidateQueries({ queryKey: ['distributions'] })
        },
    })
}

export function useRemoveRecipient() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (recipientId) => {
            const { error } = await supabase
                .from('food_recipients')
                .delete()
                .eq('id', recipientId)

            if (error) throw error
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['distribution'] })
            queryClient.invalidateQueries({ queryKey: ['distributions'] })
        },
    })
}
