import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useWomen(filters = {}) {
    return useQuery({
        queryKey: ['women', filters],
        queryFn: async () => {
            let query = supabase
                .from('legacy_women_enrollment')
                .select(`
          *,
          woman:people!legacy_women_enrollment_woman_id_fkey(*),
          mentor:people!legacy_women_enrollment_mentor_id_fkey(*)
        `)
                .order('enrollment_date', { ascending: false })

            if (filters.status) {
                query = query.eq('status', filters.status)
            }

            if (filters.stage) {
                query = query.eq('stage', filters.stage)
            }

            if (filters.search) {
                // This is a workaround since we can't directly search on joined tables
                const { data: allData } = await query
                return allData?.filter(item => {
                    const fullName = `${item.woman?.first_name} ${item.woman?.last_name}`.toLowerCase()
                    return fullName.includes(filters.search.toLowerCase())
                })
            }

            const { data, error } = await query

            if (error) throw error
            return data
        },
    })
}

export function useWoman(id) {
    return useQuery({
        queryKey: ['woman', id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('legacy_women_enrollment')
                .select(`
          *,
          woman:people!legacy_women_enrollment_woman_id_fkey(*),
          mentor:people!legacy_women_enrollment_mentor_id_fkey(*)
        `)
                .eq('woman_id', id)
                .single()

            if (error) throw error

            // Get children if any
            const { data: children } = await supabase
                .from('relationships')
                .select(`
          *,
          child:people!relationships_related_person_id_fkey(*)
        `)
                .eq('person_id', id)
                .in('relationship_type', ['Mother', 'Parent', 'Guardian'])

            return { ...data, children: children || [] }
        },
        enabled: !!id,
    })
}

export function useCreateWoman() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (womanData) => {
            // If woman_id provided, they already exist
            if (womanData.woman_id) {
                const { data, error } = await supabase
                    .from('legacy_women_enrollment')
                    .insert([{
                        woman_id: womanData.woman_id,
                        stage: womanData.stage,
                        enrollment_date: womanData.enrollment_date,
                        status: 'Active',
                        notes: womanData.notes,
                    }])
                    .select()
                    .single()

                if (error) throw error
                return data
            }

            // Otherwise, create new person first
            const { data: person, error: personError } = await supabase
                .from('people')
                .insert([{
                    first_name: womanData.first_name,
                    last_name: womanData.last_name,
                    date_of_birth: womanData.date_of_birth,
                    gender: 'Female',
                    phone_number: womanData.phone_number,
                    address: womanData.address,
                    compound_area: womanData.compound_area,
                    notes: womanData.personal_notes,
                }])
                .select()
                .single()

            if (personError) throw personError

            // Then create enrollment
            const { data, error } = await supabase
                .from('legacy_women_enrollment')
                .insert([{
                    woman_id: person.id,
                    stage: womanData.stage,
                    enrollment_date: womanData.enrollment_date,
                    status: 'Active',
                    notes: womanData.notes,
                }])
                .select()
                .single()

            if (error) throw error
            return data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['women'] })
        },
    })
}

export function useUpdateWoman() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({ id, updates }) => {
            const { data, error } = await supabase
                .from('legacy_women_enrollment')
                .update(updates)
                .eq('id', id)
                .select()
                .single()

            if (error) throw error
            return data
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['women'] })
            queryClient.invalidateQueries({ queryKey: ['woman', variables.id] })
        },
    })
}

export function useCompleteStage() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({ id, completionDate, skillsLearned }) => {
            const { data, error } = await supabase
                .from('legacy_women_enrollment')
                .update({
                    status: 'Completed',
                    completion_date: completionDate,
                    skills_learned: skillsLearned,
                })
                .eq('id', id)
                .select()
                .single()

            if (error) throw error
            return data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['women'] })
        },
    })
}