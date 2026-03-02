import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useSchools() {
    return useQuery({
        queryKey: ['schools'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('government_schools')
                .select('*')
                .eq('is_active', true)
                .order('school_name')

            if (error) throw error
            return data
        },
    })
}

export function useCreateSchool() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (schoolData) => {
            const { data, error } = await supabase
                .from('government_schools')
                .insert([schoolData])
                .select()
                .single()

            if (error) throw error
            return data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['schools'] })
        },
    })
}

export function useDeleteSchool() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (schoolId) => {
            const { error } = await supabase
                .from('government_schools')
                .update({ is_active: false })
                .eq('id', schoolId)

            if (error) throw error
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['schools'] })
            queryClient.invalidateQueries({ queryKey: ['students'] })
        },
    })
}