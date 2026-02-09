import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useUserPreferences(userId) {
  return useQuery({
    queryKey: ['user-preferences', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()

      if (error) throw error
      return data
    },
    enabled: !!userId,
  })
}

export function useUpsertUserPreferences() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ userId, updates }) => {
      const { data, error } = await supabase
        .from('user_preferences')
        .upsert(
          {
            user_id: userId,
            ...updates,
          },
          { onConflict: 'user_id' }
        )
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['user-preferences', data.user_id], data)
    },
  })
}
