import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables. Please check your .env file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

const PAGE_SIZE = 1000

// Supabase/PostgREST silently caps unpaginated selects at 1000 rows, so any
// query that can plausibly return more (e.g. attendance across a term/year)
// must page through with .range() or it will return a truncated, misleading
// result set instead of erroring.
export async function fetchAllRows(queryFactory, pageSize = PAGE_SIZE) {
    let allRows = []
    let from = 0

    while (true) {
        const { data, error } = await queryFactory(from, from + pageSize - 1)
        if (error) throw error

        allRows = allRows.concat(data ?? [])

        if (!data || data.length < pageSize) break
        from += pageSize
    }

    return allRows
}
