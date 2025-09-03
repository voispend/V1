import { createClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { ENV, validateEnv } from './env'

// Validate environment variables
if (!validateEnv()) {
  console.warn('Supabase configuration incomplete. Check environment variables.');
}

// Supabase configuration using environment variables
const supabaseUrl = ENV.SUPABASE_URL
const supabaseAnonKey = ENV.SUPABASE_ANON_KEY

console.log('🔗 Connecting to Supabase:', {
  url: supabaseUrl,
  key: supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'MISSING'
});

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})

// Test Supabase connection
export const testSupabaseConnection = async () => {
  try {
    console.log('🧪 Testing Supabase connection...');
    
    // Test basic connection
    const { data, error } = await supabase.from('profiles').select('count').limit(1);
    
    if (error) {
      console.error('❌ Supabase connection error:', error);
      
      // Check if it's a table not found error
      if (error.code === 'PGRST116') {
        console.warn('⚠️  Table not found. Database schema may need to be created.');
        return { connected: false, error: 'Table not found - schema needs setup' };
      }
      
      return { connected: false, error: error.message };
    }
    
    console.log('✅ Supabase connection successful');
    return { connected: true, data };
    
  } catch (err) {
    console.error('❌ Supabase connection failed:', err);
    return { connected: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
};

// Database types
interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string | null
          phone: string | null
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email?: string | null
          phone?: string | null
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          phone?: string | null
          full_name?: string | null
          avatar_url?: string | null
          updated_at?: string
        }
      }
      expenses: {
        Row: {
          id: string
          user_id: string
          amount: number
          description: string
          category: string
          date: string
          currency: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          amount: number
          description: string
          category: string
          date: string
          currency: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          amount?: number
          description?: string
          category?: string
          date?: string
          currency?: string
          updated_at?: string
        }
      }
    }
  }
}

export type { Database }
