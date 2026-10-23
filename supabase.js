import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

/**
 * Supabase Project Configuration for LIFE Emergency Response App
 * 
 * You can set these in your environment (.env or EAS secrets) as:
 *   EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
 *   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
 * 
 * Or paste your project URL and public anon key directly below:
 */
export const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  'https://vmfldumqxoxlywmgteuk.supabase.co';

export const SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtZmxkdW1xeG94bHl3bWd0ZXVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI3MDAwNzgsImV4cCI6MjEwODI3NjA3OH0.RoemocrLN-EDBeyawjG-kzeIP7s-Uq3XBYo3PvdoUTQ';

/**
 * Checks whether real Supabase credentials have been configured.
 * Validates that the URL points to a Supabase project and the anon key is non-empty.
 */
export const isSupabaseConfigured = () => {
  return (
    typeof SUPABASE_URL === 'string' &&
    SUPABASE_URL.startsWith('https://') &&
    SUPABASE_URL.includes('.supabase.co') &&
    typeof SUPABASE_ANON_KEY === 'string' &&
    SUPABASE_ANON_KEY.length > 20
  );
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
  },
});
