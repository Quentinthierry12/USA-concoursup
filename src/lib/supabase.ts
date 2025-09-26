import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://puwvqzhobxviudosqndy.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1d3ZxemhvYnh2aXVkb3NxbmR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwNTE3NTIsImV4cCI6MjA3MzYyNzc1Mn0.7OZW5AQOZL1_8nvVfm02yUe1FkD_8ADHH8pUHNMc8Rg'

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Export supabase pour utilisation dans les composants
export { supabase as default };

// Types pour Supabase
export type Database = {
  public: {
    Tables: {
      concour_users: {
        Row: {
          id: string;
          username: string;
          email: string;
          password: string;
          role: 'admin' | 'responsable' | 'candidat';
          full_name: string | null;
          discord_username: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          username: string;
          email: string;
          password: string;
          role?: 'admin' | 'responsable' | 'candidat';
          full_name?: string | null;
          discord_username?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          email?: string;
          password?: string;
          role?: 'admin' | 'responsable' | 'candidat';
          full_name?: string | null;
          discord_username?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      concour_contests: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          start_date: string | null;
          end_date: string | null;
          type: 'public' | 'private';
          status: 'draft' | 'active' | 'closed' | 'archived';
          logo_url: string | null;
          access_link: string | null;
          max_participants: number | null;
          is_recurring: boolean;
          recurring_interval: string | null;
          agency_id: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          start_date?: string | null;
          end_date?: string | null;
          type?: 'public' | 'private';
          status?: 'draft' | 'active' | 'closed' | 'archived';
          logo_url?: string | null;
          access_link?: string | null;
          max_participants?: number | null;
          is_recurring?: boolean;
          recurring_interval?: string | null;
          agency_id?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          start_date?: string | null;
          end_date?: string | null;
          type?: 'public' | 'private';
          status?: 'draft' | 'active' | 'closed' | 'archived';
          logo_url?: string | null;
          access_link?: string | null;
          max_participants?: number | null;
          is_recurring?: boolean;
          recurring_interval?: string | null;
          agency_id?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
};
