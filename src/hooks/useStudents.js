import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useStudents(filters = {}) {
    return useQuery({
        queryKey: ['students', filters],
        placeholderData: keepPreviousData,
        queryFn: async () => {
            let query = supabase
                .from('student_details')
                .select('*')

            // Apply Filters
            if (Array.isArray(filters.gradeLevels) && filters.gradeLevels.length > 0) {
                query = query.in('grade_level', filters.gradeLevels)
            } else if (filters.gradeLevel) {
                query = query.eq('grade_level', filters.gradeLevel)
            }

            if (filters.status) {
                query = query.eq('current_status', filters.status)
            }

            if (filters.school) {
                if (filters.school === 'HOHA Only') {
                    query = query.is('government_school', null)
                } else {
                    query = query.eq('government_school', filters.school)
                }
            }

            if (filters.registrationStatus === 'registered') {
                query = query.eq('is_registered_member', true)
            } else if (filters.registrationStatus === 'non-registered') {
                query = query.eq('is_registered_member', false)
            }

            if (filters.search) {
                query = query.or(`first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,phone_number.ilike.%${filters.search}%`)
            }

            if (filters.isRegistered !== undefined) {
                query = query.eq('is_registered_member', filters.isRegistered)
            }

            // Apply Sorting
            if (filters.sortBy) {
                query = query.order(filters.sortBy, { ascending: filters.sortOrder !== 'desc' })
            } else {
                query = query.order('first_name')
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
          educare_enrollment(*)
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
            const { data, error } = await supabase.rpc('create_student_with_enrollment', {
                p_first_name: studentData.first_name,
                p_last_name: studentData.last_name,
                p_date_of_birth: studentData.date_of_birth,
                p_gender: studentData.gender,
                p_phone_number: studentData.phone_number || null,
                p_address: studentData.address || null,
                p_compound_area: studentData.compound_area || null,
                p_emergency_contact_name: studentData.emergency_contact_name || null,
                p_emergency_contact_phone: studentData.emergency_contact_phone || null,
                p_emergency_contact_relationship: studentData.emergency_contact_relationship || null,
                p_notes: studentData.notes || null,
                p_grade_level: studentData.grade_level,
                p_government_school_id: studentData.government_school_id || null,
                p_enrollment_date: studentData.enrollment_date || null,
                p_parent_id: studentData.parent_id || null,
                p_relationship_type: studentData.relationship_type || null,
                p_is_emergency_contact: studentData.is_emergency_contact || false,
            })

            if (error) throw error
            return { id: data }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['students'] })
            queryClient.invalidateQueries({ queryKey: ['educare-stats'] })
            queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
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
                .update({ deleted_at: new Date().toISOString(), is_active: false })
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
            queryClient.invalidateQueries({ queryKey: ['educare-stats'] })
            queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
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
