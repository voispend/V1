import React, { createContext, useContext } from 'react';
import { useSupabase } from '../hooks/useSupabase';
import { User } from '@supabase/supabase-js';

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: null | string }>;
  signUp: (email: string, password: string) => Promise<{ error: null | string }>;
  signInWithPhone: (phone: string) => Promise<{ error: null | string }>;
  verifyOtp: (phone: string, token: string) => Promise<{ error: null | string }>;
  signUpWithPhone: (phone: string, password: string) => Promise<{ error: null | string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { 
    user: supabaseUser, 
    loading, 
    signIn: supabaseSignIn, 
    signUp: supabaseSignUp, 
    signInWithPhone: supabaseSignInWithPhone,
    verifyOtp: supabaseVerifyOtp,
    signUpWithPhone: supabaseSignUpWithPhone,
    signOut: supabaseSignOut 
  } = useSupabase();

  // Convert Supabase user to our AuthUser format
  const user: AuthUser | null = supabaseUser ? {
    id: supabaseUser.id,
    email: supabaseUser.email || supabaseUser.phone || '',
    name: supabaseUser.user_metadata?.full_name || 
           supabaseUser.email?.split('@')[0] || 
           supabaseUser.phone || 
           'User',
  } : null;

  const signIn = async (email: string, password: string) => {
    const { error } = await supabaseSignIn(email, password);
    return { error: error?.message || null };
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabaseSignUp(email, password);
    return { error: error?.message || null };
  };

  const signOut = async () => {
    await supabaseSignOut();
  };

  const signInWithPhone = async (phone: string) => {
    const { error } = await supabaseSignInWithPhone(phone);
    return { error: error?.message || null };
  };

  const verifyOtp = async (phone: string, token: string) => {
    const { error } = await supabaseVerifyOtp(phone, token);
    return { error: error?.message || null };
  };

  const signUpWithPhone = async (phone: string, password: string) => {
    const { error } = await supabaseSignUpWithPhone(phone, password);
    return { error: error?.message || null };
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      signIn, 
      signUp, 
      signInWithPhone,
      verifyOtp,
      signUpWithPhone,
      signOut 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}