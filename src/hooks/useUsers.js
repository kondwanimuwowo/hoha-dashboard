import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useUsers() {
    return useQuery({
        queryKey: ['users'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('user_profiles')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) throw error
            return data
        },
    })
}

export function useUpdateUser() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({ id, updates }) => {
            const { data, error } = await supabase
                .from('user_profiles')
                .update(updates)
                .eq('id', id)
                .select()
                .single()

            if (error) throw error
            return data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] })
        },
    })
}

import { createClient } from '@supabase/supabase-js'

export function useCreateUser() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({ email, password, fullName, role }) => {
            // Create a temporary client that doesn't persist session
            // This prevents the admin from being logged out
            const tempClient = createClient(
                import.meta.env.VITE_SUPABASE_URL,
                import.meta.env.VITE_SUPABASE_ANON_KEY,
                {
                    auth: {
                        persistSession: false,
                        autoRefreshToken: false,
                        detectSessionInUrl: false,
                    },
                }
            )

            // 1. Create the user
            const { data: authData, error: authError } = await tempClient.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName,
                    },
                },
            })

            if (authError) throw authError
            if (!authData.user) throw new Error('Failed to create user')

            // 2. Update the role (using the main Admin session)
            // The trigger sets default role, but we want to set the selected role immediately
            if (role && role !== 'Data Entry') {
                const { error: roleError } = await supabase
                    .from('user_profiles')
                    .update({ role })
                    .eq('id', authData.user.id)

                if (roleError) {
                    // Log error but don't fail the whole creation
                    console.error('Failed to update user role:', roleError)
                }
            }

            return authData.user
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] })
        },
    })
}
