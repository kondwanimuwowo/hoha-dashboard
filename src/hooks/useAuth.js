import { createContext, createElement, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'

const AuthContext = createContext(undefined)

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [profile, setProfile] = useState(null)
    const [loading, setLoading] = useState(true)

    const fetchProfile = async (userId) => {
        try {
            const { data, error } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('id', userId)
                .maybeSingle()

            if (error && error.code !== 'PGRST116') {
                // PGRST116 is "no rows returned" which is okay
                console.error('Error fetching profile:', error)
            }

            setProfile(data || null)
        } catch (error) {
            console.error('Error fetching profile:', error)
            setProfile(null)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null)
            if (session?.user) {
                fetchProfile(session.user.id)
            } else {
                setLoading(false)
            }
        })

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null)
            if (session?.user) {
                fetchProfile(session.user.id)
            } else {
                setProfile(null)
                setLoading(false)
            }
        })

        return () => subscription.unsubscribe()
    }, [])

    const signIn = async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })
        return { data, error }
    }

    const signOut = async () => {
        const { error } = await supabase.auth.signOut()
        return { error }
    }

    const resetPassword = async (email) => {
        const { data, error } = await supabase.auth.resetPasswordForEmail(email)
        return { data, error }
    }

    const updatePassword = async (newPassword) => {
        const { data, error } = await supabase.auth.updateUser({
            password: newPassword,
        })
        return { data, error }
    }

    const value = useMemo(() => ({
        user,
        profile,
        loading,
        signIn,
        signOut,
        resetPassword,
        updatePassword,
        isAdmin: profile?.role === 'Admin',
        isProgramManager: profile?.role === 'Program Manager',
    }), [loading, profile, user])

    return createElement(AuthContext.Provider, { value }, children)
}

export function useAuth() {
    const context = useContext(AuthContext)

    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider')
    }

    return context
}
