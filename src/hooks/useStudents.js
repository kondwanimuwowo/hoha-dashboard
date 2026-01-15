import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useStudents(filters = {}) {
    return useQuery({
        queryKey: ['students', filters],
        queryFn: async () => {
            let query = supabase
                .from('student_details')
                .select('*')
                .order('first_name')

            if (filters.gradeLevel) {
                query = query.eq('grade_level', filters.gradeLevel)
            }

            if (filters.status) {
                query = query.eq('current_status', filters.status)
            }

            if (filters.search) {
                query = query.or(`first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%`)
            }

            const { data, error } = await query

            if (error) throw error
            return data
        },
    })
}

export function useStudent(id) {
    return useQuery({
        queryKey: ['student', id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('people')
                .select(`
          *,
          educare_enrollment(*),
          relationships!relationships_related_person_id_fkey(
            *,
            person:people!relationships_person_id_fkey(*)
          )
        `)
                .eq('id', id)
                .single()

            if (error) throw error
            return data
        },
        enabled: !!id,
    })
}

export function useCreateStudent() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (studentData) => {
            // First create the person
            const { data: person, error: personError } = await supabase
                .from('people')
                .insert([{
                    first_name: studentData.first_name,
                    last_name: studentData.last_name,
                    date_of_birth: studentData.date_of_birth,
                    gender: studentData.gender,
                    phone_number: studentData.phone_number,
                    address: studentData.address,
                    compound_area: studentData.compound_area,
                    emergency_contact_name: studentData.emergency_contact_name,
                    emergency_contact_phone: studentData.emergency_contact_phone,
                    emergency_contact_relationship: studentData.emergency_contact_relationship,
                    notes: studentData.notes,
                }])
                .select()
                .single()

            if (personError) throw personError

            // Then create educare enrollment
            const { error: enrollmentError } = await supabase
                .from('educare_enrollment')
                .insert([{
                    child_id: person.id,
                    grade_level: studentData.grade_level,
                    government_school_id: studentData.government_school_id,
                    enrollment_date: studentData.enrollment_date || null,
                }])

            if (enrollmentError) throw enrollmentError

            // Create relationships if parent data provided
            if (studentData.parent_id) {
                const { error: relationshipError } = await supabase
                    .from('relationships')
                    .insert([{
                        person_id: studentData.parent_id,
                        related_person_id: person.id,
                        relationship_type: studentData.relationship_type || 'Parent',
                        is_primary: true,
                    }])

                if (relationshipError) throw relationshipError
            }

            return person
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['students'] })
        },
    })
}

export function useUpdateStudent() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({ id, ...updates }) => {
            const personFields = [
                'first_name', 'last_name', 'date_of_birth', 'gender', 'phone_number',
                'address', 'compound_area', 'photo_url', 'notes',
                'emergency_contact_name', 'emergency_contact_phone', 'emergency_contact_relationship'
            ]
            const enrollmentFields = ['grade_level', 'government_school_id', 'enrollment_date', 'current_status']

            const personUpdates = {}
            const enrollmentUpdates = {}

            Object.keys(updates).forEach(key => {
                if (personFields.includes(key)) personUpdates[key] = updates[key]
                if (enrollmentFields.includes(key)) enrollmentUpdates[key] = updates[key]
            })

            // Update person details
            if (Object.keys(personUpdates).length > 0) {
                const { error } = await supabase
                    .from('people')
                    .update(personUpdates)
                    .eq('id', id)

                if (error) throw error
            }

            // Update enrollment details
            if (Object.keys(enrollmentUpdates).length > 0) {
                const { error } = await supabase
                    .from('educare_enrollment')
                    .update(enrollmentUpdates)
                    .eq('child_id', id)

                if (error) throw error
            }

            return { id, ...updates }
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['students'] })
            queryClient.invalidateQueries({ queryKey: ['student', variables.id] })
        },
    })
}

export function useDeleteStudent() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (id) => {
            // Soft delete - set deleted_at timestamp
            const { error: personError } = await supabase
                .from('people')
                .update({ deleted_at: new Date().toISOString() })
                .eq('id', id)

            if (personError) throw personError

            // Also soft delete the enrollment
            const { error: enrollmentError } = await supabase
                .from('educare_enrollment')
                .update({ deleted_at: new Date().toISOString() })
                .eq('child_id', id)

            if (enrollmentError) throw enrollmentError

            return id
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['students'] })
        },
    })
}

export function usePromoteStudents() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async () => {
            const { data, error } = await supabase.rpc('promote_all_students')
            if (error) throw error
            return data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['students'] })
            queryClient.invalidateQueries({ queryKey: ['educare-stats'] })
        },
    })
}