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

            // Server-side sorting for base table fields
            const serverSortFields = ['enrollment_date', 'stage', 'status']
            if (filters.sortBy && serverSortFields.includes(filters.sortBy)) {
                query = query.order(filters.sortBy, { ascending: filters.sortOrder !== 'desc' })
            } else if (!filters.sortBy || !filters.sortBy.startsWith('woman.')) {
                query = query.order('enrollment_date', { ascending: false })
            }

            if (filters.status) {
                query = query.eq('status', filters.status)
            }

            if (filters.stage) {
                query = query.eq('stage', filters.stage)
            }

            const { data, error } = await query
            if (error) throw error

            let results = data || []

            // Client-side filtering for search
            if (filters.search) {
                const searchLower = filters.search.toLowerCase()
                results = results.filter(item => {
                    const fullName = `${item.woman?.first_name} ${item.woman?.last_name}`.toLowerCase()
                    const phone = (item.woman?.phone_number || '').toLowerCase()
                    return fullName.includes(searchLower) || phone.includes(searchLower)
                })
            }

            // Client-side sorting for joined fields (woman.first_name, etc)
            if (filters.sortBy && filters.sortBy.startsWith('woman.')) {
                const field = filters.sortBy.split('.')[1]
                const isAsc = filters.sortOrder !== 'desc'
                results.sort((a, b) => {
                    const valA = (a.woman?.[field] || '').toLowerCase()
                    const valB = (b.woman?.[field] || '').toLowerCase()
                    if (valA < valB) return isAsc ? -1 : 1
                    if (valA > valB) return isAsc ? 1 : -1
                    return 0
                })
            }

            return results
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
                        enrollment_date: womanData.enrollment_date || null,
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
                    address: womanData.address,
                    compound_area: womanData.compound_area,
                    notes: womanData.personal_notes,
                    date_of_birth: womanData.date_of_birth || null,
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
                    enrollment_date: womanData.enrollment_date || null,
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
        mutationFn: async ({ id, ...updates }) => {
            const personFields = [
                'first_name', 'last_name', 'date_of_birth', 'gender', 'phone_number',
                'address', 'compound_area', 'photo_url', 'notes', 'nrc_number'
            ]
            const enrollmentFields = ['stage', 'enrollment_date', 'status', 'notes', 'skills_learned', 'completion_date']

            const personUpdates = {}
            const enrollmentUpdates = {}

            Object.keys(updates).forEach(key => {
                if (personFields.includes(key)) personUpdates[key] = updates[key]
                if (enrollmentFields.includes(key)) enrollmentUpdates[key] = updates[key]
            })

            // Update person details
            if (Object.keys(personUpdates).length > 0) {
                // We need the woman_id from the enrollment
                const { data: enrollment } = await supabase
                    .from('legacy_women_enrollment')
                    .select('woman_id')
                    .eq('id', id)
                    .single()

                if (enrollment) {
                    const { error } = await supabase
                        .from('people')
                        .update(personUpdates)
                        .eq('id', enrollment.woman_id)

                    if (error) throw error
                }
            }

            // Update enrollment details
            if (Object.keys(enrollmentUpdates).length > 0) {
                const { error } = await supabase
                    .from('legacy_women_enrollment')
                    .update(enrollmentUpdates)
                    .eq('id', id)

                if (error) throw error
            }

            return { id, ...updates }
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['women'] })
            queryClient.invalidateQueries({ queryKey: ['woman'] })
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

export function useDeleteWoman() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (womanId) => {
            // Soft delete - set deleted_at timestamp on person record
            const { error: personError } = await supabase
                .from('people')
                .update({ deleted_at: new Date().toISOString() })
                .eq('id', womanId)

            if (personError) throw personError

            // Also soft delete the enrollment
            const { error: enrollmentError } = await supabase
                .from('legacy_women_enrollment')
                .update({ deleted_at: new Date().toISOString() })
                .eq('woman_id', womanId)

            if (enrollmentError) throw enrollmentError

            return womanId
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['women'] })
        },
    })
}