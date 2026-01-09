import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function usePeople(search = '') {
    return useQuery({
        queryKey: ['people', search],
        queryFn: async () => {
            let query = supabase
                .from('people')
                .select('*')
                .is('deleted_at', null) // Only show non-deleted people
                .order('first_name')

            if (search) {
                query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,phone_number.ilike.%${search}%`)
            }

            const { data, error } = await query

            if (error) throw error
            return data
        },
    })
}

export function usePerson(id) {
    return useQuery({
        queryKey: ['person', id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('people')
                .select('*')
                .eq('id', id)
                .single()

            if (error) throw error
            return data
        },
        enabled: !!id,
    })
}

export function useCreatePerson() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (personData) => {
            const { data, error } = await supabase
                .from('people')
                .insert([personData])
                .select()
                .single()

            if (error) throw error
            return data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['people'] })
        },
    })
}

export function useFamilyGroups() {
    return useQuery({
        queryKey: ['family-groups'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('family_groups')
                .select('*')
                .order('recipient_name')

            if (error) throw error
            return data
        },
    })
}