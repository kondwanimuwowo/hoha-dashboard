import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

// Fetch all awards
export function useAwards() {
    return useQuery({
        queryKey: ['school-awards'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('school_awards')
                .select('*')
                .order('award_date', { ascending: false })

            if (error) throw error
            return data
        },
    })
}

// Fetch award detail with recipients
export function useAwardDetail(id) {
    return useQuery({
        queryKey: ['school-award', id],
        queryFn: async () => {
            const { data: award, error: awardError } = await supabase
                .from('school_awards')
                .select('*')
                .eq('id', id)
                .single()

            if (awardError) throw awardError

            const { data: recipients, error: recipientsError } = await supabase
                .from('award_recipients')
                .select(`
                    *,
                    student:student_details(
                        id,
                        first_name,
                        last_name,
                        grade_level
                    )
                `)
                .eq('award_id', id)

            if (recipientsError) throw recipientsError

            return {
                ...award,
                recipients,
            }
        },
        enabled: !!id,
    })
}

// Fetch student award rankings
export function useStudentRankings(filters = {}) {
    return useQuery({
        queryKey: ['student-rankings', filters],
        queryFn: async () => {
            let query = supabase
                .from('student_award_rankings')
                .select('*')

            if (filters.gradeLevel) {
                query = query.eq('grade_level', filters.gradeLevel)
            }

            if (filters.registrationStatus === 'registered') {
                query = query.eq('is_registered_member', true)
            } else if (filters.registrationStatus === 'non-registered') {
                query = query.eq('is_registered_member', false)
            }

            const { data, error } = await query

            if (error) throw error
            return data
        },
    })
}

// Create award distribution
export function useCreateAward() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({ award, recipients }) => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('You must be logged in to create awards.')

            // Create award
            const { data: newAward, error: awardError } = await supabase
                .from('school_awards')
                .insert({
                    award_date: award.award_date,
                    term: award.term,
                    academic_year: award.academic_year,
                    notes: award.notes,
                    created_by: user.id,
                })
                .select()
                .single()

            if (awardError) throw awardError

            // Create recipients
            if (recipients && recipients.length > 0) {
                const recipientRecords = recipients.map(r => ({
                    award_id: newAward.id,
                    student_id: r.student_id,
                    attendance_percentage: r.attendance_percentage,
                    grade_level: r.grade_level,
                    notes: r.notes,
                }))

                const { error: recipientsError } = await supabase
                    .from('award_recipients')
                    .insert(recipientRecords)

                if (recipientsError) throw recipientsError
            }

            return newAward
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['school-awards'] })
            queryClient.invalidateQueries({ queryKey: ['student-rankings'] })
            toast.success('Award distribution recorded successfully')
        },
        onError: (error) => {
            toast.error(`Failed to record award: ${error.message}`)
        },
    })
}

// Get student's awards
export function useStudentAwards(studentId) {
    return useQuery({
        queryKey: ['student-awards', studentId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('award_recipients')
                .select(`
                    *,
                    award:school_awards(*)
                `)
                .eq('student_id', studentId)
                .order('created_at', { ascending: false })

            if (error) throw error
            return data
        },
        enabled: !!studentId,
    })
}
