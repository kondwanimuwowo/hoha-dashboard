import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useFacilities() {
    return useQuery({
        queryKey: ['facilities'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('medical_facilities')
                .select('*')
                .eq('is_active', true)
                .order('facility_name')

            if (error) throw error
            return data
        },
    })
}

export function useCreateFacility() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (facilityData) => {
            const { data, error } = await supabase
                .from('medical_facilities')
                .insert([{ ...facilityData, is_active: true }])
                .select()
                .single()

            if (error) throw error
            return data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['facilities'] })
        },
    })
}

export function useUpdateFacility() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({ id, updates }) => {
            const { data, error } = await supabase
                .from('medical_facilities')
                .update(updates)
                .eq('id', id)
                .select()
                .single()

            if (error) throw error
            return data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['facilities'] })
        },
    })
}

export function useDeleteFacility() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (id) => {
            // Soft delete
            const { error } = await supabase
                .from('medical_facilities')
                .update({ is_active: false })
                .eq('id', id)

            if (error) throw error
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['facilities'] })
        },
    })
}
