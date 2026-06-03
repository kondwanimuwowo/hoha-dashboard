import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function usePeople(search = '') {
    return useQuery({
        queryKey: ['people', search],
        placeholderData: keepPreviousData,
        queryFn: async () => {
            let query = supabase
                .from('people')
                .select('*')
                .is('deleted_at', null) // Only show non-deleted people
                .order('first_name')

            if (search) {
                const terms = search.split(/\s+/).filter(Boolean)
                for (const term of terms) {
                    query = query.or(`first_name.ilike.%${term}%,last_name.ilike.%${term}%,phone_number.ilike.%${term}%`)
                }
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
            const firstName = personData.first_name?.trim()
            const lastName = personData.last_name?.trim()
            const phoneNumber = personData.phone_number?.trim()

            if (phoneNumber) {
                const { data: existingByPhone, error: existingByPhoneError } = await supabase
                    .from('people')
                    .select('*')
                    .eq('phone_number', phoneNumber)
                    .is('deleted_at', null)
                    .limit(1)

                if (existingByPhoneError) throw existingByPhoneError
                if (existingByPhone?.length) return existingByPhone[0]
            }

            if (firstName && lastName) {
                const { data: existingByName, error: existingByNameError } = await supabase
                    .from('people')
                    .select('*')
                    .ilike('first_name', firstName)
                    .ilike('last_name', lastName)
                    .is('deleted_at', null)
                    .limit(1)

                if (existingByNameError) throw existingByNameError
                if (existingByName?.length) return existingByName[0]
            }

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
            queryClient.invalidateQueries({ queryKey: ['parents'] })
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
            queryClient.invalidateQueries({ queryKey: ['parents'] })
        },
    })
}

export function useDeletePerson() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (id) => {
            const { error } = await supabase
                .from('people')
                .update({ deleted_at: new Date().toISOString(), is_active: false })
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
        placeholderData: keepPreviousData,
        queryFn: async () => {
            // First get all people who are marked as a parent/guardian in relationships
            // and have children in educare
            let query = supabase
                .from('people')
                .select(`
                    *,
                    own_enrollment:educare_enrollment(id),
                    relationships!relationships_person_id_fkey (
                        relationship_type,
                        student:people!relationships_related_person_id_fkey (
                            id,
                            first_name,
                            last_name,
                            educare_enrollment (
                                id,
                                current_status
                            )
                        )
                    )
                `)
                .is('deleted_at', null)
                .order('first_name')

            if (search) {
                const terms = search.split(/\s+/).filter(Boolean)
                for (const term of terms) {
                    query = query.or(`first_name.ilike.%${term}%,last_name.ilike.%${term}%,phone_number.ilike.%${term}%`)
                }
            }

            const { data, error } = await query

            if (error) throw error

            return data
                .filter(person => !(person.own_enrollment?.length > 0)) // exclude students
                // When searching, show all non-students so orphaned parents can be found.
                // When browsing (no search), only show people who have relationship entries.
                .filter(person => search || (person.relationships && person.relationships.length > 0))
                .map(person => {
                    const educareChildren = person.relationships
                        .filter(rel => rel.student)
                        .map(rel => ({
                            id: rel.student.id,
                            first_name: rel.student.first_name,
                            last_name: rel.student.last_name,
                            status: rel.student.educare_enrollment?.[0]?.current_status ?? null,
                            relationship: rel.relationship_type
                        }))

                    return {
                        ...person,
                        educare_children: educareChildren,
                        children_count: educareChildren.length
                    }
                })
        }
    })
}
