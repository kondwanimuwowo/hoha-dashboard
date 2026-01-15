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

            if (distError) {
                console.error(`Error fetching distribution ${id}:`, distError)
                throw distError
            }

            if (!distribution) {
                console.warn(`No distribution found with ID: ${id}`)
            }

            const { data: recipients, error: recError } = await supabase
                .from('food_recipients')
                .select(`
          *,
          family_head:people!family_head_id(*)
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
            const dataToInsert = {
                ...distributionData,
                distribution_date: distributionData.distribution_date || null
            }

            const { data, error } = await supabase
                .from('food_distribution')
                .insert([dataToInsert])
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
            const { distribution_id, family_group_id, family_head_id } = recipientData

            // 1. Check for duplicates
            if (family_group_id) {
                // Check by Family Group
                const { data: existingGroup, error: groupError } = await supabase
                    .from('food_recipients')
                    .select('id, collected_by, collection_time, family_head:people!family_head_id(first_name, last_name)')
                    .eq('distribution_id', distribution_id)
                    .eq('family_group_id', family_group_id)
                    .maybeSingle()

                if (groupError) throw groupError
                if (existingGroup) {
                    const collectorName = existingGroup.family_head ? `${existingGroup.family_head.first_name} ${existingGroup.family_head.last_name}` : 'a family member';
                    throw new Error(`This family has already collected hampers (Collected by ${collectorName})`)
                }
            } else {
                // Check by Individual (Family Head only)
                // Also check if they are part of a family group that collected? 
                // Ideally backend logic handles this, but for now we assume input provides correct group ID if they have one.
                const { data: existingPerson, error: personError } = await supabase
                    .from('food_recipients')
                    .select('id')
                    .eq('distribution_id', distribution_id)
                    .eq('family_head_id', family_head_id)
                    .maybeSingle()

                if (personError) throw personError
                if (existingPerson) {
                    throw new Error(`This person has already collected a hamper`)
                }
            }

            // 2. Insert Recipient
            const { data, error } = await supabase
                .from('food_recipients')
                .insert([{
                    ...recipientData,
                    collected: true, // Auto-mark as collected when adding to list? Or seperate step? 
                    // "Record Distribution" implies immediate collection.
                    // If it's just a "List", then collected=false. 
                    // Requirement says "Record Collection". So likely true.
                    // But let's check input. If 'collected' is not passed, default to true or false?
                    // I will assume this action records the handout.
                    collection_time: recipientData.collection_time || new Date().toISOString()
                }])
                .select()
                .single()

            if (error) throw error
            return data
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['distribution', variables.distribution_id] })
        },
    })
}

export function useDeleteDistribution() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (id) => {
            const { error } = await supabase
                .from('food_distribution')
                .delete()
                .eq('id', id)

            if (error) throw error
            return id
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['distributions'] })
        },
    })
}

export function useUpdateDistribution() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async ({ id, ...updates }) => {
            const { data, error } = await supabase
                .from('food_distribution')
                .update(updates)
                .eq('id', id)
                .select()
                .single()

            if (error) throw error
            return data
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['distributions'] })
            queryClient.invalidateQueries({ queryKey: ['distribution', data.id] })
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
