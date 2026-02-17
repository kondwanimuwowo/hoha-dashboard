import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

// Fetch all outreach events
export function useOutreachEvents() {
    return useQuery({
        queryKey: ['outreach-events'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('community_outreach')
                .select(`
                    *,
                    location:outreach_locations!community_outreach_location_id_fkey(id, name),
                    created_by_user:user_profiles!community_outreach_created_by_fkey(email, full_name)
                `)
                .order('outreach_date', { ascending: false })

            if (error) throw error
            return data
        },
    })
}

// Fetch single outreach event with full details
export function useOutreachDetail(id) {
    return useQuery({
        queryKey: ['outreach-event', id],
        queryFn: async () => {
            // Fetch main event
            const { data: event, error: eventError } = await supabase
                .from('community_outreach')
                .select(`
                    *,
                    location:outreach_locations!community_outreach_location_id_fkey(id, name)
                `)
                .eq('id', id)
                .single()

            if (eventError) throw eventError

            // Fetch participants
            const { data: participants, error: participantsError } = await supabase
                .from('outreach_participants')
                .select(`
                    *,
                    person:people(id, first_name, last_name, phone_number, is_registered_member)
                `)
                .eq('outreach_id', id)

            if (participantsError) throw participantsError

            // Fetch expenses
            const { data: expenses, error: expensesError } = await supabase
                .from('outreach_expenses')
                .select('*')
                .eq('outreach_id', id)

            if (expensesError) throw expensesError

            return {
                ...event,
                participants,
                expenses,
            }
        },
        enabled: !!id,
    })
}

// Fetch outreach locations
export function useOutreachLocations() {
    return useQuery({
        queryKey: ['outreach-locations'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('outreach_locations')
                .select('*')
                .order('is_custom', { ascending: true })
                .order('name', { ascending: true })

            if (error) throw error
            return data
        },
    })
}

// Get outreach statistics
export function useOutreachStats(startDate, endDate) {
    return useQuery({
        queryKey: ['outreach-stats', startDate, endDate],
        queryFn: async () => {
            let query = supabase
                .from('community_outreach')
                .select('*')

            if (startDate) {
                query = query.gte('outreach_date', startDate)
            }
            if (endDate) {
                query = query.lte('outreach_date', endDate)
            }

            const { data: events, error } = await query

            if (error) throw error

            // Calculate stats
            const totalEvents = events.length
            const totalPeople = events.reduce((sum, e) => sum + (e.total_participants || 0), 0)
            const totalExpenses = events.reduce((sum, e) => sum + parseFloat(e.total_expenses || 0), 0)

            // Get unique locations
            const locations = [...new Set(events.map(e => e.location_name).filter(Boolean))]

            return {
                totalEvents,
                totalPeople,
                totalExpenses,
                uniqueLocations: locations.length,
                events,
            }
        },
    })
}

// Create new outreach event
export function useCreateOutreach() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({ event, participants, expenses }) => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('You must be logged in to create outreach events.')

            // Create main event
            const { data: newEvent, error: eventError } = await supabase
                .from('community_outreach')
                .insert({
                    outreach_date: event.outreach_date,
                    location_id: event.location_id,
                    location_name: event.location_name,
                    notes: event.notes,
                    created_by: user.id,
                })
                .select()
                .single()

            if (eventError) throw eventError

            // Create participants
            if (participants && participants.length > 0) {
                const participantRecords = participants.map(p => ({
                    outreach_id: newEvent.id,
                    person_id: p.person_id || null,
                    ad_hoc_name: p.ad_hoc_name || null,
                    is_registered_member: p.is_registered_member,
                    notes: p.notes,
                }))

                const { data: newParticipants, error: participantsError } = await supabase
                    .from('outreach_participants')
                    .insert(participantRecords)
                    .select()

                if (participantsError) throw participantsError

                // Create expenses
                if (expenses && expenses.length > 0) {
                    const expenseRecords = expenses.map(e => ({
                        outreach_id: newEvent.id,
                        participant_id: e.participant_id || null,
                        expense_type: e.expense_type,
                        amount: e.amount,
                        description: e.description,
                    }))

                    const { error: expensesError } = await supabase
                        .from('outreach_expenses')
                        .insert(expenseRecords)

                    if (expensesError) throw expensesError
                }
            }

            return newEvent
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['outreach-events'] })
            queryClient.invalidateQueries({ queryKey: ['outreach-stats'] })
            toast.success('Outreach event recorded successfully')
        },
        onError: (error) => {
            toast.error(`Failed to record outreach: ${error.message}`)
        },
    })
}

// Add custom location
export function useAddLocation() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (name) => {
            const { data, error } = await supabase
                .from('outreach_locations')
                .insert({ name, is_custom: true })
                .select()
                .single()

            if (error) throw error
            return data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['outreach-locations'] })
            toast.success('Location added successfully')
        },
        onError: (error) => {
            toast.error(`Failed to add location: ${error.message}`)
        },
    })
}
