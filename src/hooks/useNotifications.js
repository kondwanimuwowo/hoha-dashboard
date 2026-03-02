import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

// ---------------------------------------------------------------------------
// Data fetchers
// ---------------------------------------------------------------------------

async function fetchFollowUps() {
    const today = new Date().toISOString().split('T')[0]
    const sevenDaysLater = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0]

    const select = `id, visit_date, follow_up_date, patient:people(first_name, last_name)`

    const [
        { data: overdue, error: e1 },
        { data: upcoming, error: e2 },
        { data: undated, error: e3 },
    ] = await Promise.all([
        supabase
            .from('clinicare_visits')
            .select(select)
            .eq('follow_up_required', true)
            .lt('follow_up_date', today)
            .order('follow_up_date'),
        supabase
            .from('clinicare_visits')
            .select(select)
            .eq('follow_up_required', true)
            .gte('follow_up_date', today)
            .lte('follow_up_date', sevenDaysLater)
            .order('follow_up_date'),
        supabase
            .from('clinicare_visits')
            .select(select)
            .eq('follow_up_required', true)
            .is('follow_up_date', null)
            .order('visit_date', { ascending: false }),
    ])

    if (e1) throw e1
    if (e2) throw e2
    if (e3) throw e3

    return {
        overdue: overdue || [],
        upcoming: upcoming || [],
        undated: undated || [],
    }
}

async function fetchRecentEdukareEnrollments() {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0]

    const { data, error } = await supabase
        .from('educare_enrollment')
        .select(`id, enrollment_date, child_id, child:people!educare_enrollment_child_id_fkey(id, first_name, last_name)`)
        .gte('enrollment_date', sevenDaysAgo)
        .is('deleted_at', null)
        .order('enrollment_date', { ascending: false })

    if (error) throw error
    return data || []
}

async function fetchRecentLegacyEnrollments() {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0]

    const { data, error } = await supabase
        .from('legacy_women_enrollment')
        .select(`id, enrollment_date, woman_id, woman:people!legacy_women_enrollment_woman_id_fkey(id, first_name, last_name)`)
        .gte('enrollment_date', sevenDaysAgo)
        .is('deleted_at', null)
        .order('enrollment_date', { ascending: false })

    if (error) throw error
    return data || []
}

async function fetchUpcomingDistributionsWithUncollected() {
    const today = new Date().toISOString().split('T')[0]

    const { data: distributions, error: distError } = await supabase
        .from('food_distribution')
        .select(`id, distribution_date, quarter, year, distribution_location`)
        .gte('distribution_date', today)
        .order('distribution_date')

    if (distError) throw distError
    if (!distributions?.length) return []

    // Count uncollected recipients per distribution
    const { data: uncollected, error: recError } = await supabase
        .from('food_recipients')
        .select('distribution_id')
        .in('distribution_id', distributions.map((d) => d.id))
        .eq('is_collected', false)

    if (recError) throw recError

    const uncollectedCounts = (uncollected || []).reduce((acc, row) => {
        acc[row.distribution_id] = (acc[row.distribution_id] || 0) + 1
        return acc
    }, {})

    return distributions
        .filter((d) => (uncollectedCounts[d.id] || 0) > 0)
        .map((d) => ({ ...d, uncollected_count: uncollectedCounts[d.id] }))
}

async function fetchReadKeys(userId) {
    const { data, error } = await supabase
        .from('notification_reads')
        .select('notification_key')
        .eq('user_id', userId)

    if (error) throw error
    return new Set((data || []).map((r) => r.notification_key))
}

// ---------------------------------------------------------------------------
// Notification builders
// ---------------------------------------------------------------------------

function buildNotifications({ followUps, educareEnrollments, legacyEnrollments, distributions, readKeys }) {
    const items = []

    // Follow-ups — overdue
    for (const visit of followUps.overdue) {
        const name = visit.patient
            ? `${visit.patient.first_name} ${visit.patient.last_name}`
            : 'a patient'
        const key = `followup_overdue_${visit.id}`
        items.push({
            key,
            type: 'follow_up_overdue',
            title: 'Overdue follow-up',
            message: `Follow-up for ${name} is past due (${visit.follow_up_date}).`,
            link: '/clinicare/visits?filter=follow-ups',
            createdAt: new Date(visit.follow_up_date),
            read: readKeys.has(key),
        })
    }

    // Follow-ups — upcoming within 7 days
    for (const visit of followUps.upcoming) {
        const name = visit.patient
            ? `${visit.patient.first_name} ${visit.patient.last_name}`
            : 'a patient'
        const key = `followup_upcoming_${visit.id}`
        items.push({
            key,
            type: 'follow_up_upcoming',
            title: 'Follow-up due soon',
            message: `Follow-up for ${name} is scheduled for ${visit.follow_up_date}.`,
            link: '/clinicare/visits?filter=follow-ups',
            createdAt: new Date(visit.follow_up_date),
            read: readKeys.has(key),
        })
    }

    // Follow-ups — no date set
    for (const visit of followUps.undated) {
        const name = visit.patient
            ? `${visit.patient.first_name} ${visit.patient.last_name}`
            : 'a patient'
        const key = `followup_undated_${visit.id}`
        items.push({
            key,
            type: 'follow_up_undated',
            title: 'Follow-up needs a date',
            message: `No follow-up date set for ${name}'s visit on ${visit.visit_date}.`,
            link: '/clinicare/visits?filter=follow-ups',
            createdAt: new Date(visit.visit_date),
            read: readKeys.has(key),
        })
    }

    // Educare enrolments (last 7 days)
    for (const enrollment of educareEnrollments) {
        const name = enrollment.child
            ? `${enrollment.child.first_name} ${enrollment.child.last_name}`
            : 'A student'
        const personId = enrollment.child?.id || enrollment.child_id
        const key = `educare_enroll_${enrollment.id}`
        items.push({
            key,
            type: 'educare_enroll',
            title: 'New student enrolled',
            message: `${name} was enrolled in Educare on ${enrollment.enrollment_date}.`,
            link: `/educare/students/${personId}`,
            createdAt: new Date(enrollment.enrollment_date),
            read: readKeys.has(key),
        })
    }

    // Legacy enrolments (last 7 days)
    for (const enrollment of legacyEnrollments) {
        const name = enrollment.woman
            ? `${enrollment.woman.first_name} ${enrollment.woman.last_name}`
            : 'A participant'
        const womanId = enrollment.woman_id
        const key = `legacy_enroll_${enrollment.id}`
        items.push({
            key,
            type: 'legacy_enroll',
            title: 'New Legacy participant',
            message: `${name} was enrolled in Legacy on ${enrollment.enrollment_date}.`,
            link: `/legacy/participants/${womanId}`,
            createdAt: new Date(enrollment.enrollment_date),
            read: readKeys.has(key),
        })
    }

    // Upcoming food distributions with uncollected hampers
    for (const dist of distributions) {
        const key = `food_dist_${dist.id}`
        items.push({
            key,
            type: 'food_distribution',
            title: 'Distribution has uncollected hampers',
            message: `"${dist.distribution_location || `${dist.quarter} ${dist.year}`}" has ${dist.uncollected_count} uncollected hamper${dist.uncollected_count !== 1 ? 's' : ''}.`,
            link: `/food/distributions/${dist.id}`,
            createdAt: new Date(dist.distribution_date),
            read: readKeys.has(key),
        })
    }

    // Sort: unread first, then newest first
    items.sort((a, b) => {
        if (a.read !== b.read) return a.read ? 1 : -1
        return b.createdAt - a.createdAt
    })

    return items
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useNotifications() {
    const { user } = useAuth()
    const queryClient = useQueryClient()

    const dataQuery = useQuery({
        queryKey: ['notification-data'],
        queryFn: async () => {
            const [followUps, educareEnrollments, legacyEnrollments, distributions] = await Promise.all([
                fetchFollowUps(),
                fetchRecentEdukareEnrollments(),
                fetchRecentLegacyEnrollments(),
                fetchUpcomingDistributionsWithUncollected(),
            ])
            return { followUps, educareEnrollments, legacyEnrollments, distributions }
        },
        enabled: !!user,
        staleTime: 5 * 60 * 1000,
    })

    const readsQuery = useQuery({
        queryKey: ['notification-reads', user?.id],
        queryFn: () => fetchReadKeys(user.id),
        enabled: !!user,
        staleTime: 60 * 1000,
    })

    const isLoading = dataQuery.isLoading || readsQuery.isLoading

    const notifications = (() => {
        if (!dataQuery.data) return []
        const readKeys = readsQuery.data || new Set()
        return buildNotifications({ ...dataQuery.data, readKeys })
    })()

    const unreadCount = notifications.filter((n) => !n.read).length

    const markRead = useMutation({
        mutationFn: async (key) => {
            if (!user) return
            const { error } = await supabase
                .from('notification_reads')
                .upsert({ user_id: user.id, notification_key: key }, { onConflict: 'user_id,notification_key' })
            if (error) throw error
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notification-reads', user?.id] })
        },
    })

    const markAllRead = useMutation({
        mutationFn: async () => {
            if (!user) return
            const unreadKeys = notifications
                .filter((n) => !n.read)
                .map((n) => ({ user_id: user.id, notification_key: n.key }))
            if (!unreadKeys.length) return
            const { error } = await supabase
                .from('notification_reads')
                .upsert(unreadKeys, { onConflict: 'user_id,notification_key' })
            if (error) throw error
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notification-reads', user?.id] })
        },
    })

    return {
        notifications,
        unreadCount,
        markRead: (key) => markRead.mutate(key),
        markAllRead: () => markAllRead.mutate(),
        isLoading,
    }
}
