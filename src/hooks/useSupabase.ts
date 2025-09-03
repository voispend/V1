import { useState, useEffect } from 'react'
import { supabase } from '../config/supabase'
import { User, Session } from '@supabase/supabase-js'

export const useSupabase = () => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })
    return { data, error }
  }

  const signIn = async (email: string, password: string) => {
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

  const resetPassword = async (email: string) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email)
    return { data, error }
  }

  const signInWithPhone = async (phone: string) => {
    const { data, error } = await supabase.auth.signInWithOtp({
      phone,
      options: {
        shouldCreateUser: true, // This ensures a user is created if they don't exist
      }
    })
    return { data, error }
  }

  const verifyOtp = async (phone: string, token: string) => {
    const { data, error } = await supabase.auth.verifyOtp({
      phone,
      token,
      type: 'sms',
    })
    
    // If verification is successful and we have a user, ensure profile exists
    if (data?.user && !error) {
      try {
        // Check if profile exists
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single()
        
        // If profile doesn't exist, create one
        if (profileError && profileError.code === 'PGRST116') {
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: data.user.id,
              email: null, // Phone users don't have email
              phone: phone, // Store the phone number
              full_name: null,
              avatar_url: null,
            })
          
          if (insertError) {
            console.error('Failed to create profile:', insertError)
            // Don't fail the auth, just log the error
          }
        }
      } catch (profileErr) {
        console.error('Profile creation error:', profileErr)
        // Don't fail the auth, just log the error
      }
    }
    
    return { data, error }
  }

  const signUpWithPhone = async (phone: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      phone,
      password,
    })
    return { data, error }
  }

  return {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    signInWithPhone,
    verifyOtp,
    signUpWithPhone,
    supabase,
  }
}
