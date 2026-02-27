import { createClient } from '@supabase/supabase-js';

// These should be environment variables in a real application
// Vite uses import.meta.env for environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const SupabaseService = {
  // Example Authentication method
  async signUp(email: string, password: string) {
    return await supabase.auth.signUp({ email, password });
  },

  async signIn(email: string, password: string) {
    return await supabase.auth.signInWithPassword({ email, password });
  },

  async signOut() {
    return await supabase.auth.signOut();
  },

  // Example Database method
  async getUserProfile(userId: string) {
    return await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
  }
};
