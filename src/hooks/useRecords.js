import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

// =====================================================
// CASE NOTES HOOKS
// =====================================================

export function useCaseNotes(personId) {
    return useQuery({
        queryKey: ['caseNotes', personId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('case_notes')
                .select(`
                    *,
                    creator:user_profiles!case_notes_created_by_fkey(full_name)
                `)
                .eq('person_id', personId)
                .order('created_at', { ascending: false })

            if (error) throw error
            return data
        },
        enabled: !!personId,
    })
}

export function useCreateCaseNote() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (noteData) => {
            const { data: { user } } = await supabase.auth.getUser()

            const { data, error } = await supabase
                .from('case_notes')
                .insert([{
                    person_id: noteData.person_id,
                    note_type: noteData.note_type || 'General',
                    note_content: noteData.note_content,
                    created_by: user.id,
                }])
                .select()
                .single()

            if (error) throw error
            return data
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['caseNotes', variables.person_id] })
        },
    })
}

export function useUpdateCaseNote() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({ id, person_id, ...updates }) => {
            const { data, error } = await supabase
                .from('case_notes')
                .update(updates)
                .eq('id', id)
                .select()
                .single()

            if (error) throw error
            return { data, person_id }
        },
        onSuccess: (result) => {
            queryClient.invalidateQueries({ queryKey: ['caseNotes', result.person_id] })
        },
    })
}

export function useDeleteCaseNote() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({ id, person_id }) => {
            const { error } = await supabase
                .from('case_notes')
                .delete()
                .eq('id', id)

            if (error) throw error
            return person_id
        },
        onSuccess: (person_id) => {
            queryClient.invalidateQueries({ queryKey: ['caseNotes', person_id] })
        },
    })
}

// =====================================================
// STUDENT DOCUMENTS HOOKS
// =====================================================

export function useStudentDocuments(studentId) {
    return useQuery({
        queryKey: ['studentDocuments', studentId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('student_documents')
                .select(`
                    *,
                    uploader:user_profiles!student_documents_uploaded_by_fkey(full_name)
                `)
                .eq('student_id', studentId)
                .order('upload_date', { ascending: false })

            if (error) throw error
            return data
        },
        enabled: !!studentId,
    })
}

export function useCreateStudentDocument() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (documentData) => {
            const { data: { user } } = await supabase.auth.getUser()

            const { data, error } = await supabase
                .from('student_documents')
                .insert([{
                    student_id: documentData.student_id,
                    document_type: documentData.document_type || 'Other',
                    document_name: documentData.document_name,
                    document_url: documentData.document_url,
                    file_size: documentData.file_size,
                    mime_type: documentData.mime_type,
                    notes: documentData.notes,
                    uploaded_by: user.id,
                }])
                .select()
                .single()

            if (error) throw error
            return data
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['studentDocuments', variables.student_id] })
        },
    })
}

export function useDeleteStudentDocument() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({ id, studentId, documentUrl }) => {
            // Delete from storage first
            if (documentUrl) {
                const path = documentUrl.split('/').pop()
                await supabase.storage
                    .from('student-documents')
                    .remove([path])
            }

            // Then delete from database
            const { error } = await supabase
                .from('student_documents')
                .delete()
                .eq('id', id)

            if (error) throw error
            return studentId
        },
        onSuccess: (studentId) => {
            queryClient.invalidateQueries({ queryKey: ['studentDocuments', studentId] })
        },
    })
}

// =====================================================
// PARENT EMERGENCY CONTACTS HOOKS
// =====================================================

export function useParentEmergencyContact(parentId) {
    return useQuery({
        queryKey: ['parentEmergencyContact', parentId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('parent_emergency_contacts')
                .select('*')
                .eq('parent_id', parentId)
                .maybeSingle()

            if (error) throw error
            return data
        },
        enabled: !!parentId,
    })
}

export function useSaveParentEmergencyContact() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (contactData) => {
            const { data, error } = await supabase
                .from('parent_emergency_contacts')
                .upsert({
                    parent_id: contactData.parent_id,
                    emergency_contact_name: contactData.emergency_contact_name,
                    emergency_contact_phone: contactData.emergency_contact_phone,
                    emergency_contact_relationship: contactData.emergency_contact_relationship,
                }, {
                    onConflict: 'parent_id'
                })
                .select()
                .single()

            if (error) throw error
            return data
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['parentEmergencyContact', variables.parent_id] })
        },
    })
}
