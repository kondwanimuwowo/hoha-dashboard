import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useRelationships(personId) {
    return useQuery({
        queryKey: ['relationships', personId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('relationships')
                .select(`
          *,
          related_person:people!relationships_related_person_id_fkey(*)
        `)
                .eq('person_id', personId)

            if (error) throw error
            return data
        },
        enabled: !!personId,
    })
}

export function useCreateRelationship() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (relationshipData) => {
            const { data, error } = await supabase
                .from('relationships')
                .insert([relationshipData])
                .select()

            if (error) throw error
            return data
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['relationships', variables.person_id] })
            queryClient.invalidateQueries({ queryKey: ['student-guardians', variables.related_person_id] })
            queryClient.invalidateQueries({ queryKey: ['parents'] })
            queryClient.invalidateQueries({ queryKey: ['students'] })
        },
    })
}

// Hook to get all family members for a student (queries by related_person_id)
export function useStudentGuardians(studentId) {
    return useQuery({
        queryKey: ['student-guardians', studentId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('relationships')
                .select(`
          *,
          person:people!relationships_person_id_fkey(*)
        `)
                .eq('related_person_id', studentId)

            if (error) throw error
            return data
        },
        enabled: !!studentId,
    })
}
