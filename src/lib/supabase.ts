import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials. Please connect to Supabase using the "Connect to Supabase" button.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false // Disable session persistence to avoid issues with browser storage
  },
  global: {
    fetch: (...args) => {
      // Use a custom fetch function with proper error handling
      return fetch(...args).catch(err => {
        console.error('Network error in Supabase fetch:', err);
        throw new Error('Network error when connecting to database. Please check your connection.');
      });
    }
  }
});