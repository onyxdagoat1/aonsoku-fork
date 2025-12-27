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
    Functions: {}
    Enums: {}
  }
}
