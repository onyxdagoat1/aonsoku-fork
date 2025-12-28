import { createClient } from '@supabase/supabase-js'

// Supabase configuration
// Add these to your .env file:
// VITE_SUPABASE_URL=your_supabase_url
// VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase credentials not found. Comments will use mock data. ' +
    'Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.'
  )
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
)

// Database types
export interface Database {
  public: {
    Tables: {
      comments: {
        Row: {
          id: number
          entity_type: 'artist' | 'album' | 'compilation' | 'single'
          entity_id: string
          user_id: string
          username: string
          content: string
          created_at: string
          updated_at: string | null
          likes: number
        }
        Insert: {
          id?: number
          entity_type: 'artist' | 'album' | 'compilation' | 'single'
          entity_id: string
          user_id: string
          username: string
          content: string
          created_at?: string
          updated_at?: string | null
          likes?: number
        }
        Update: {
          content?: string
          updated_at?: string | null
        }
      }
      comment_likes: {
        Row: {
          id: number
          comment_id: number
          user_id: string
          created_at: string
        }
        Insert: {
          id?: number
          comment_id: number
          user_id: string
          created_at?: string
        }
        Delete: {
          comment_id: number
          user_id: string
        }
      }
    }
  }
}
