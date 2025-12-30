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
      comments: {
        Row: {
          id: string
          content_type: 'artist' | 'album' | 'song' | 'compilation' | 'single'
          content_id: string
          user_id: string
          username: string
          user_avatar: string | null
          text: string
          parent_id: string | null
          reply_count: number
          created_at: string
          updated_at: string
          edited: boolean
          pinned: boolean
          deleted: boolean
          reported: boolean
        }
        Insert: {
          id?: string
          content_type: 'artist' | 'album' | 'song' | 'compilation' | 'single'
          content_id: string
          user_id: string
          username: string
          user_avatar?: string | null
          text: string
          parent_id?: string | null
          reply_count?: number
          created_at?: string
          updated_at?: string
          edited?: boolean
          pinned?: boolean
          deleted?: boolean
          reported?: boolean
        }
        Update: {
          id?: string
          content_type?: 'artist' | 'album' | 'song' | 'compilation' | 'single'
          content_id?: string
          user_id?: string
          username?: string
          user_avatar?: string | null
          text?: string
          parent_id?: string | null
          reply_count?: number
          created_at?: string
          updated_at?: string
          edited?: boolean
          pinned?: boolean
          deleted?: boolean
          reported?: boolean
        }
      }
      comment_reactions: {
        Row: {
          id: string
          comment_id: string
          user_id: string
          reaction_type: 'like' | 'love' | 'fire' | 'laugh' | 'sad' | 'angry'
          created_at: string
        }
        Insert: {
          id?: string
          comment_id: string
          user_id: string
          reaction_type: 'like' | 'love' | 'fire' | 'laugh' | 'sad' | 'angry'
          created_at?: string
        }
        Update: {
          id?: string
          comment_id?: string
          user_id?: string
          reaction_type?: 'like' | 'love' | 'fire' | 'laugh' | 'sad' | 'angry'
          created_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          username: string | null
          display_name: string | null
          avatar_url: string | null
          website: string | null
          bio: string | null
          is_admin: boolean
          is_yeditor: boolean
          navidrome_username: string | null
          navidrome_user_id: string | null
          navidrome_password: string | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id: string
          username?: string | null
          display_name?: string | null
          avatar_url?: string | null
          website?: string | null
          bio?: string | null
          is_admin?: boolean
          is_yeditor?: boolean
          navidrome_username?: string | null
          navidrome_user_id?: string | null
          navidrome_password?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          username?: string | null
          display_name?: string | null
          avatar_url?: string | null
          website?: string | null
          bio?: string | null
          is_admin?: boolean
          is_yeditor?: boolean
          navidrome_username?: string | null
          navidrome_user_id?: string | null
          navidrome_password?: string | null
          created_at?: string
          updated_at?: string | null
        }
      }
      yeditors: {
        Row: {
          id: string
          name: string
          user_id: string | null
          bio: string | null
          avatar_url: string | null
          social_links: Json
          is_verified: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          user_id?: string | null
          bio?: string | null
          avatar_url?: string | null
          social_links?: Json
          is_verified?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          user_id?: string | null
          bio?: string | null
          avatar_url?: string | null
          social_links?: Json
          is_verified?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      content_yeditors: {
        Row: {
          id: string
          content_id: string
          content_type: 'song' | 'album' | 'single' | 'compilation'
          yeditor_id: string
          created_at: string
        }
        Insert: {
          id?: string
          content_id: string
          content_type: 'song' | 'album' | 'single' | 'compilation'
          yeditor_id: string
          created_at?: string
        }
        Update: {
          id?: string
          content_id?: string
          content_type?: 'song' | 'album' | 'single' | 'compilation'
          yeditor_id?: string
          created_at?: string
        }
      }
      collections: {
        Row: {
          id: string
          title: string
          description: string | null
          cover_image_url: string | null
          created_by: string | null
          is_public: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          cover_image_url?: string | null
          created_by?: string | null
          is_public?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          cover_image_url?: string | null
          created_by?: string | null
          is_public?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      collection_items: {
        Row: {
          id: string
          collection_id: string
          content_id: string
          content_type: string
          display_order: number
          created_at: string
        }
        Insert: {
          id?: string
          collection_id: string
          content_id: string
          content_type: string
          display_order: number
          created_at?: string
        }
        Update: {
          id?: string
          collection_id?: string
          content_id?: string
          content_type?: string
          display_order?: number
          created_at?: string
        }
      }
    }
    Views: {
      comments_with_reactions: {
        Row: {
          id: string
          content_type: 'artist' | 'album' | 'song' | 'compilation' | 'single'
          content_id: string
          user_id: string
          username: string
          user_avatar: string | null
          text: string
          parent_id: string | null
          reply_count: number
          created_at: string
          updated_at: string
          edited: boolean
          pinned: boolean
          deleted: boolean
          reported: boolean
          reaction_counts: Json
          total_reactions: number
        }
      }
    }
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
