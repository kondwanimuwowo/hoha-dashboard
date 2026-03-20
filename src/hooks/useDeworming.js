import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useDewormingEvents() {
    return useQuery({
        queryKey: ['deworming-events'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('deworming_events')
                .select(`
                    *,
                    records:deworming_records(count)
                `)
                .order('event_date', { ascending: false })

            if (error) throw error

            // Get administered counts per event
            const { data: adminCounts, error: countError } = await supabase
                .from('deworming_records')
                .select('event_id')
                .eq('administered', true)

            if (countError) throw countError

            const administeredByEvent = {}
            for (const row of adminCounts || []) {
                administeredByEvent[row.event_id] = (administeredByEvent[row.event_id] || 0) + 1
            }

            return (data || []).map((event) => ({
                ...event,
                total_records: event.records?.[0]?.count || 0,
                administered_count: administeredByEvent[event.id] || 0,
            }))
        },
    })
}

export function useDewormingEvent(id) {
    return useQuery({
        queryKey: ['deworming-event', id],
        queryFn: async () => {
            const { data: event, error: eventError } = await supabase
                .from('deworming_events')
                .select('*')
                .eq('id', id)
                .single()

            if (eventError) throw eventError

            const { data: records, error: recError } = await supabase
                .from('deworming_records')
                .select(`
                    *,
                    child:people!child_id(id, first_name, last_name, date_of_birth, gender, photo_url)
                `)
                .eq('event_id', id)

            if (recError) throw recError

            // Get grade levels from enrollment
            const childIds = (records || []).map((r) => r.child_id)
            let enrollmentMap = {}
            if (childIds.length > 0) {
                const { data: enrollments, error: enrError } = await supabase
                    .from('educare_enrollment')
                    .select('child_id, grade_level')
                    .in('child_id', childIds)
                    .is('deleted_at', null)

                if (enrError) throw enrError
                for (const e of enrollments || []) {
                    enrollmentMap[e.child_id] = e.grade_level
                }
            }

            return {
                ...event,
                records: (records || []).map((r) => ({
                    ...r,
                    grade_level: enrollmentMap[r.child_id] || null,
                })),
            }
        },
        enabled: !!id,
    })
}

export function useCreateDewormingEvent() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (eventData) => {
            const { data: { user } } = await supabase.auth.getUser()

            const { data: event, error: eventError } = await supabase
                .from('deworming_events')
                .insert([{
                    event_date: eventData.event_date,
                    medication_name: eventData.medication_name,
                    dosage_amount: eventData.dosage_amount,
                    dosage_unit: eventData.dosage_unit || 'mg',
                    notes: eventData.notes || null,
                    created_by: user?.id || null,
                }])
                .select()
                .single()

            if (eventError) throw eventError

            // Fetch all active students and bulk insert records
            const { data: students, error: studError } = await supabase
                .from('student_details')
                .select('person_id')
                .eq('current_status', 'Active')

            if (studError) throw studError

            if (students && students.length > 0) {
                const records = students.map((s) => ({
                    event_id: event.id,
                    child_id: s.person_id,
                    administered: false,
                }))

                const { error: insertError } = await supabase
                    .from('deworming_records')
                    .insert(records)

                if (insertError) throw insertError
            }

            return event
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['deworming-events'] })
        },
    })
}

export function useUpdateDewormingEvent() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({ id, ...updates }) => {
            const { data, error } = await supabase
                .from('deworming_events')
                .update({
                    ...updates,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', id)
                .select()
                .single()

            if (error) throw error
            return data
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['deworming-events'] })
            queryClient.invalidateQueries({ queryKey: ['deworming-event', data.id] })
        },
    })
}

export function useDeleteDewormingEvent() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (id) => {
            const { error } = await supabase
                .from('deworming_events')
                .delete()
                .eq('id', id)

            if (error) throw error
            return id
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['deworming-events'] })
        },
    })
}

export function useSaveDewormingRecords() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({ eventId, eventDate, records }) => {
            // Upsert all records
            const upsertData = records.map((r) => ({
                id: r.id,
                event_id: eventId,
                child_id: r.child_id,
                weight_kg: r.weight_kg || null,
                height_cm: r.height_cm || null,
                administered: r.administered,
                notes: r.notes || null,
                updated_at: new Date().toISOString(),
            }))

            const { error: upsertError } = await supabase
                .from('deworming_records')
                .upsert(upsertData, { onConflict: 'event_id,child_id' })

            if (upsertError) throw upsertError

            // Sync weight/height/last_deworming_date back to educare_enrollment
            // for administered children with measurements
            const toSync = records.filter((r) => r.administered && (r.weight_kg || r.height_cm))

            for (const record of toSync) {
                const updates = {}
                if (record.weight_kg) updates.weight_kg = record.weight_kg
                if (record.height_cm) updates.height_cm = record.height_cm
                updates.last_deworming_date = eventDate

                const { error } = await supabase
                    .from('educare_enrollment')
                    .update(updates)
                    .eq('child_id', record.child_id)
                    .is('deleted_at', null)

                if (error) throw error
            }

            // Also update last_deworming_date for administered children without measurements
            const adminOnly = records.filter((r) => r.administered && !r.weight_kg && !r.height_cm)
            if (adminOnly.length > 0) {
                const childIds = adminOnly.map((r) => r.child_id)
                const { error } = await supabase
                    .from('educare_enrollment')
                    .update({ last_deworming_date: eventDate })
                    .in('child_id', childIds)
                    .is('deleted_at', null)

                if (error) throw error
            }

            return { eventId }
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['deworming-events'] })
            queryClient.invalidateQueries({ queryKey: ['deworming-event', data.eventId] })
            queryClient.invalidateQueries({ queryKey: ['students'] })
        },
    })
}
