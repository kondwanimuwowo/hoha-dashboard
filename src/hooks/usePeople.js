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

export function useUpdatePerson() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({ id, ...updates }) => {
            const { data, error } = await supabase
                .from('people')
                .update(updates)
                .eq('id', id)
                .select()
                .single()

            if (error) throw error
            return data
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['people'] })
            queryClient.invalidateQueries({ queryKey: ['person', variables.id] })
        },
    })
}

export function useDeletePerson() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (id) => {
            const { error } = await supabase
                .from('people')
                .update({ deleted_at: new Date().toISOString() })
                .eq('id', id)

            if (error) throw error
            return id
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['people'] })
            queryClient.invalidateQueries({ queryKey: ['parents'] })
        },
    })
}

export function useParents(search = '') {
    return useQuery({
        queryKey: ['parents', search],
        queryFn: async () => {
            // First get all people who are marked as a parent/guardian in relationships
            // and have children in educare
            let query = supabase
                .from('people')
                .select(`
                    *,
                    relationships!relationships_person_id_fkey (
                        relationship_type,
                        student:people!relationships_related_person_id_fkey (
                            id,
                            first_name,
                            last_name,
                            educare_enrollment!inner (
                                id,
                                current_status
                            )
                        )
                    )
                `)
                .is('deleted_at', null)
                .order('first_name')

            if (search) {
                query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,phone_number.ilike.%${search}%`)
            }

            const { data, error } = await query

            if (error) throw error

            // Filter out people who don't have any children in educare
            // and format the data
            return data
                .filter(person => person.relationships && person.relationships.length > 0)
                .map(person => {
                    const educareChildren = person.relationships
                        .filter(rel => rel.student && rel.student.educare_enrollment.length > 0)
                        .map(rel => ({
                            id: rel.student.id,
                            first_name: rel.student.first_name,
                            last_name: rel.student.last_name,
                            status: rel.student.educare_enrollment[0].current_status,
                            relationship: rel.relationship_type
                        }))

                    return {
                        ...person,
                        educare_children: educareChildren,
                        children_count: educareChildren.length
                    }
                })
                .filter(person => person.children_count > 0)
        }
    })
}
