export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string
          display_name: string | null
          avatar_url: string | null
          bio: string | null
          navidrome_username: string | null
          navidrome_credentials_encrypted: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username: string
          display_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          navidrome_username?: string | null
          navidrome_credentials_encrypted?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string
          display_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          navidrome_username?: string | null
          navidrome_credentials_encrypted?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      comments: {
        Row: {
          id: string
          user_id: string
          song_id: string
          content: string
          parent_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          song_id: string
          content: string
          parent_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          song_id?: string
          content?: string
          parent_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      playlists: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          is_public: boolean
          cover_art_url: string | null
          song_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          is_public?: boolean
          cover_art_url?: string | null
          song_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          is_public?: boolean
          cover_art_url?: string | null
          song_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      playlist_songs: {
        Row: {
          id: string
          playlist_id: string
          song_id: string
          position: number
          added_at: string
        }
        Insert: {
          id?: string
          playlist_id: string
          song_id: string
          position: number
          added_at?: string
        }
        Update: {
          id?: string
          playlist_id?: string
          song_id?: string
          position?: number
          added_at?: string
        }
      }
      playlist_collaborators: {
        Row: {
          id: string
          playlist_id: string
          user_id: string
          can_edit: boolean
          added_at: string
        }
        Insert: {
          id?: string
          playlist_id: string
          user_id: string
          can_edit?: boolean
          added_at?: string
        }
        Update: {
          id?: string
          playlist_id?: string
          user_id?: string
          can_edit?: boolean
          added_at?: string
        }
      }
      favorites: {
        Row: {
          id: string
          user_id: string
          song_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          song_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          song_id?: string
          created_at?: string
        }
      }
      listening_history: {
        Row: {
          id: string
          user_id: string
          song_id: string
          played_at: string
          play_duration_seconds: number | null
        }
        Insert: {
          id?: string
          user_id: string
          song_id: string
          played_at?: string
          play_duration_seconds?: number | null
        }
        Update: {
          id?: string
          user_id?: string
          song_id?: string
          played_at?: string
          play_duration_seconds?: number | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
