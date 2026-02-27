import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useVisits(filters = {}) {
    return useQuery({
        queryKey: ['visits', filters],
        queryFn: async () => {
            let query = supabase
                .from('clinicare_visits')
                .select(`
          *,
          patient:people(*),
          facility:medical_facilities(facility_name)
        `)
                .order('visit_date', { ascending: false })

            if (filters.startDate) {
                query = query.gte('visit_date', filters.startDate)
            }

            if (filters.endDate) {
                query = query.lte('visit_date', filters.endDate)
            }

            if (filters.isEmergency !== undefined) {
                query = query.eq('is_emergency', filters.isEmergency)
            }

            if (filters.inProgram !== undefined) {
                query = query.eq('in_hoha_program', filters.inProgram)
            }

            if (filters.followUpRequired) {
                query = query.eq('follow_up_required', true)
            }

            const { data, error } = await query

            if (error) throw error

            let results = data || []

            if (filters.search) {
                const searchLower = filters.search.toLowerCase()
                results = results.filter(visit => {
                    const firstName = (visit.patient?.first_name || '').toLowerCase()
                    const lastName = (visit.patient?.last_name || '').toLowerCase()
                    const fullName = `${firstName} ${lastName}`
                    return fullName.includes(searchLower) || firstName.includes(searchLower) || lastName.includes(searchLower)
                })
            }

            return results
        },
    })
}

export function useVisit(id) {
    return useQuery({
        queryKey: ['visit', id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('clinicare_visits')
                .select(`
          *,
          patient:people(*),
          facility:medical_facilities(facility_name)
        `)
                .eq('id', id)
                .single()

            if (error) throw error
            return data
        },
        enabled: !!id,
    })
}

export function usePatientVisits(patientId) {
    return useQuery({
        queryKey: ['patient-visits', patientId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('clinicare_visits')
                .select('*')
                .eq('patient_id', patientId)
                .order('visit_date', { ascending: false })

            if (error) throw error

            // Calculate total costs
            const totalCost = data.reduce((sum, visit) => sum + (parseFloat(visit.cost_amount) || 0), 0)
            const totalMedicalFees = data.reduce((sum, visit) => sum + (parseFloat(visit.medical_fees) || 0), 0)
            const totalTransportCosts = data.reduce((sum, visit) => sum + (parseFloat(visit.transport_costs) || 0), 0)

            return {
                visits: data,
                summary: {
                    totalVisits: data.length,
                    totalCost,
                    totalMedicalFees,
                    totalTransportCosts,
                    emergencyVisits: data.filter(v => v.is_emergency).length,
                    pendingFollowUps: data.filter(v => v.follow_up_required && !v.follow_up_date).length,
                }
            }
        },
        enabled: !!patientId,
    })
}

export function useCreateVisit() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (visitData) => {
            const dataToInsert = {
                ...visitData,
                follow_up_date: visitData.follow_up_date || null,
                visit_date: visitData.visit_date || null,
            }

            const { data, error } = await supabase
                .from('clinicare_visits')
                .insert([dataToInsert])
                .select()
                .single()

            if (error) throw error
            return data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['visits'] })
            queryClient.invalidateQueries({ queryKey: ['patient-visits'] })
            queryClient.invalidateQueries({ queryKey: ['clinicare-stats'] })
        },
    })
}

export function useUpdateVisit() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({ id, updates }) => {
            const dataToUpdate = {
                ...updates,
                follow_up_date: updates.follow_up_date || null,
                visit_date: updates.visit_date || null,
            }

            const { data, error } = await supabase
                .from('clinicare_visits')
                .update(dataToUpdate)
                .eq('id', id)
                .select()
                .single()

            if (error) throw error
            return data
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['visits'] })
            queryClient.invalidateQueries({ queryKey: ['visit', variables.id] })
            queryClient.invalidateQueries({ queryKey: ['patient-visits'] })
        },
    })
}

export function useFollowUps() {
    return useQuery({
        queryKey: ['follow-ups'],
        queryFn: async () => {
            const today = new Date().toISOString().split('T')[0]

            const followUpSelect = `*, patient:people(*), facility:medical_facilities(facility_name)`

            // Get upcoming follow-ups (date set, in the future)
            const { data: upcoming, error: upcomingError } = await supabase
                .from('clinicare_visits')
                .select(followUpSelect)
                .eq('follow_up_required', true)
                .gte('follow_up_date', today)
                .order('follow_up_date')

            if (upcomingError) throw upcomingError

            // Get overdue follow-ups (date set, in the past)
            const { data: overdue, error: overdueError } = await supabase
                .from('clinicare_visits')
                .select(followUpSelect)
                .eq('follow_up_required', true)
                .lt('follow_up_date', today)
                .order('follow_up_date')

            if (overdueError) throw overdueError

            // Get follow-ups with no date scheduled yet
            const { data: undated, error: undatedError } = await supabase
                .from('clinicare_visits')
                .select(followUpSelect)
                .eq('follow_up_required', true)
                .is('follow_up_date', null)
                .order('visit_date', { ascending: false })

            if (undatedError) throw undatedError

            return {
                upcoming: upcoming || [],
                overdue: overdue || [],
                undated: undated || [],
            }
        },
    })
}