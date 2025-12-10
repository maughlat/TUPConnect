// Import Supabase from CDN
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// Supabase configuration
const supabaseUrl = 'https://rbmfimbdtiyuiflunuhx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJibWZpbWJkdGl5dWlmbHVudWh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUwMzA4MDQsImV4cCI6MjA4MDYwNjgwNH0.5LUfiV2PH78x5ExLROR9b0Z9j1O1ND75JJdGnEg2r4E';

// Initialize and export the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

