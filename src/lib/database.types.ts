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
          banner_url: string | null
          website: string | null
          bio: string | null
          pronouns: string | null
          spotlight_content_id: string | null
          spotlight_content_type:
            | 'song'
            | 'album'
            | 'single'
            | 'compilation'
            | null
          average_rating: number
          comment_count: number
          is_admin: boolean
          is_yeditor: boolean
          navidrome_username: string | null
          navidrome_user_id: string | null
          navidrome_password: string | null
          lastfm_session_key: string | null
          lastfm_enabled: boolean
          created_at: string
          updated_at: string | null
          location: string | null
          badges: Json | null
        }
        Insert: {
          id: string
          username?: string | null
          display_name?: string | null
          avatar_url?: string | null
          banner_url?: string | null
          website?: string | null
          bio?: string | null
          pronouns?: string | null
          spotlight_content_id?: string | null
          spotlight_content_type?:
            | 'song'
            | 'album'
            | 'single'
            | 'compilation'
            | null
          average_rating?: number
          comment_count?: number
          is_admin?: boolean
          is_yeditor?: boolean
          navidrome_username?: string | null
          navidrome_user_id?: string | null
          navidrome_password?: string | null
          lastfm_session_key?: string | null
          lastfm_enabled?: boolean
          created_at?: string
          updated_at?: string | null
          location?: string | null
          badges?: Json | null
        }
        Update: {
          id?: string
          username?: string | null
          display_name?: string | null
          avatar_url?: string | null
          banner_url?: string | null
          website?: string | null
          bio?: string | null
          pronouns?: string | null
          spotlight_content_id?: string | null
          spotlight_content_type?:
            | 'song'
            | 'album'
            | 'single'
            | 'compilation'
            | null
          average_rating?: number
          comment_count?: number
          is_admin?: boolean
          is_yeditor?: boolean
          navidrome_username?: string | null
          navidrome_user_id?: string | null
          navidrome_password?: string | null
          lastfm_session_key?: string | null
          lastfm_enabled?: boolean
          created_at?: string
          updated_at?: string | null
          location?: string | null
          badges?: Json | null
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
      stream_counts: {
        Row: {
          id: string
          user_id: string
          track_id: string
          album_id: string | null
          artist_id: string | null
          streamed_at: string
          duration_seconds: number | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          track_id: string
          album_id?: string | null
          artist_id?: string | null
          streamed_at?: string
          duration_seconds?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          track_id?: string
          album_id?: string | null
          artist_id?: string | null
          streamed_at?: string
          duration_seconds?: number | null
          created_at?: string
        }
      }
      track_stats: {
        Row: {
          track_id: string
          total_streams: number
          unique_listeners: number
          last_streamed_at: string | null
          updated_at: string
        }
        Insert: {
          track_id: string
          total_streams?: number
          unique_listeners?: number
          last_streamed_at?: string | null
          updated_at?: string
        }
        Update: {
          track_id?: string
          total_streams?: number
          unique_listeners?: number
          last_streamed_at?: string | null
          updated_at?: string
        }
      }
      scheduled_releases: {
        Row: {
          id: string
          title: string
          description: string | null
          artist_name: string | null
          album_id: string | null
          cover_art_url: string | null
          release_type:
            | 'album'
            | 'single'
            | 'compilation'
            | 'edit'
            | 'event'
            | null
          scheduled_at: string
          is_active: boolean
          is_hidden: boolean
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          artist_name?: string | null
          album_id?: string | null
          cover_art_url?: string | null
          release_type?:
            | 'album'
            | 'single'
            | 'compilation'
            | 'edit'
            | 'event'
            | null
          scheduled_at: string
          is_active?: boolean
          is_hidden?: boolean
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          artist_name?: string | null
          album_id?: string | null
          cover_art_url?: string | null
          release_type?:
            | 'album'
            | 'single'
            | 'compilation'
            | 'edit'
            | 'event'
            | null
          scheduled_at?: string
          is_active?: boolean
          is_hidden?: boolean
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      chart_snapshots: {
        Row: {
          id: string
          chart_type: 'streams' | 'follows' | 'likes'
          content_type: 'track' | 'album' | 'artist'
          content_id: string
          rank: number
          score: number
          snapshot_date: string
          created_at: string
        }
        Insert: {
          id?: string
          chart_type: 'streams' | 'follows' | 'likes'
          content_type: 'track' | 'album' | 'artist'
          content_id: string
          rank: number
          score: number
          snapshot_date?: string
          created_at?: string
        }
        Update: {
          id?: string
          chart_type?: 'streams' | 'follows' | 'likes'
          content_type?: 'track' | 'album' | 'artist'
          content_id?: string
          rank?: number
          score?: number
          snapshot_date?: string
          created_at?: string
        }
      }
      playlist_follows: {
        Row: {
          id: string
          user_id: string
          playlist_id: string
          followed_at: string
        }
        Insert: {
          id?: string
          user_id: string
          playlist_id: string
          followed_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          playlist_id?: string
          followed_at?: string
        }
      }
      posts: {
        Row: {
          id: string
          user_id: string
          content: string | null
          post_type:
            | 'text'
            | 'image'
            | 'track_share'
            | 'album_share'
            | 'playlist_share'
          attached_content_id: string | null
          attached_content_type: string | null
          upvotes: number
          downvotes: number
          reply_count: number
          is_pinned: boolean
          is_deleted: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          content?: string | null
          post_type?:
            | 'text'
            | 'image'
            | 'track_share'
            | 'album_share'
            | 'playlist_share'
          attached_content_id?: string | null
          attached_content_type?: string | null
          upvotes?: number
          downvotes?: number
          reply_count?: number
          is_pinned?: boolean
          is_deleted?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          content?: string | null
          post_type?:
            | 'text'
            | 'image'
            | 'track_share'
            | 'album_share'
            | 'playlist_share'
          attached_content_id?: string | null
          attached_content_type?: string | null
          upvotes?: number
          downvotes?: number
          reply_count?: number
          is_pinned?: boolean
          is_deleted?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      post_votes: {
        Row: {
          id: string
          post_id: string
          user_id: string
          vote: number
          created_at: string
        }
        Insert: {
          id?: string
          post_id: string
          user_id: string
          vote: number
          created_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          user_id?: string
          vote?: number
          created_at?: string
        }
      }
      post_replies: {
        Row: {
          id: string
          post_id: string
          parent_reply_id: string | null
          user_id: string
          content: string
          upvotes: number
          downvotes: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          post_id: string
          parent_reply_id?: string | null
          user_id: string
          content: string
          upvotes?: number
          downvotes?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          parent_reply_id?: string | null
          user_id?: string
          content?: string
          upvotes?: number
          downvotes?: number
          created_at?: string
          updated_at?: string
        }
      }
      conversations: {
        Row: {
          id: string
          participant_ids: string[]
          last_message_preview: string | null
          last_message_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          participant_ids: string[]
          last_message_preview?: string | null
          last_message_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          participant_ids?: string[]
          last_message_preview?: string | null
          last_message_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          sender_id: string
          content: string
          is_read: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          sender_id: string
          content: string
          is_read?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          sender_id?: string
          content?: string
          is_read?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: 'follow' | 'reply' | 'like' | 'system' | 'message'
          title: string
          body: string | null
          related_user_id: string | null
          related_entity_id: string | null
          related_entity_type: string | null
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'follow' | 'reply' | 'like' | 'system' | 'message'
          title: string
          body?: string | null
          related_user_id?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'follow' | 'reply' | 'like' | 'system' | 'message'
          title?: string
          body?: string | null
          related_user_id?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          is_read?: boolean
          created_at?: string
        }
      }
      user_preferences: {
        Row: {
          user_id: string
          layout_settings: Json
          theme_settings: Json
          playback_settings: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          layout_settings?: Json
          theme_settings?: Json
          playback_settings?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          layout_settings?: Json
          theme_settings?: Json
          playback_settings?: Json
          created_at?: string
          updated_at?: string
        }
      }
      smart_playlist_rules: {
        Row: {
          id: string
          playlist_id: string | null
          field: string
          operator: string
          value: string | null
          value_end: string | null
          created_at: string
        }
        Insert: {
          id?: string
          playlist_id?: string | null
          field: string
          operator: string
          value?: string | null
          value_end?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          playlist_id?: string | null
          field?: string
          operator?: string
          value?: string | null
          value_end?: string | null
          created_at?: string
        }
      }
      saved_searches: {
        Row: {
          id: string
          user_id: string
          name: string
          filters: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          filters: Json
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          filters?: Json
          created_at?: string
        }
      }
      queue_history: {
        Row: {
          id: string
          user_id: string
          track_ids: string[]
          played_at: string
          saved_as_playlist_id: string | null
        }
        Insert: {
          id?: string
          user_id: string
          track_ids: string[]
          played_at?: string
          saved_as_playlist_id?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          track_ids?: string[]
          played_at?: string
          saved_as_playlist_id?: string | null
        }
      }
      custom_tags: {
        Row: {
          id: string
          name: string
          color: string | null
          icon: string | null
          created_by: string | null
          is_system: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          color?: string | null
          icon?: string | null
          created_by?: string | null
          is_system?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          color?: string | null
          icon?: string | null
          created_by?: string | null
          is_system?: boolean
          created_at?: string
        }
      }
      content_tags: {
        Row: {
          id: string
          content_type: string
          content_id: string
          tag_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          content_type: string
          content_id: string
          tag_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          content_type?: string
          content_id?: string
          tag_id?: string
          user_id?: string
          created_at?: string
        }
      }
      blacklisted_words: {
        Row: {
          id: string
          word: string
          severity: 'warn' | 'block' | 'shadow_ban'
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          word: string
          severity?: 'warn' | 'block' | 'shadow_ban'
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          word?: string
          severity?: 'warn' | 'block' | 'shadow_ban'
          created_by?: string | null
          created_at?: string
        }
      }
      content_reports: {
        Row: {
          id: string
          reporter_id: string
          content_type: 'post' | 'comment' | 'user' | 'message'
          content_id: string
          reason: string | null
          description: string | null
          status: 'pending' | 'reviewed' | 'actioned' | 'dismissed'
          reviewed_by: string | null
          reviewed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          reporter_id: string
          content_type: 'post' | 'comment' | 'user' | 'message'
          content_id: string
          reason?: string | null
          description?: string | null
          status?: 'pending' | 'reviewed' | 'actioned' | 'dismissed'
          reviewed_by?: string | null
          reviewed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          reporter_id?: string
          content_type?: 'post' | 'comment' | 'user' | 'message'
          content_id?: string
          reason?: string | null
          description?: string | null
          status?: 'pending' | 'reviewed' | 'actioned' | 'dismissed'
          reviewed_by?: string | null
          reviewed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      moderation_actions: {
        Row: {
          id: string
          admin_id: string | null
          target_type: string
          target_id: string
          action: 'warn' | 'delete' | 'ban' | 'shadow_ban' | 'dismiss' | null
          reason: string | null
          created_at: string
        }
        Insert: {
          id?: string
          admin_id?: string | null
          target_type: string
          target_id: string
          action?: 'warn' | 'delete' | 'ban' | 'shadow_ban' | 'dismiss' | null
          reason?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          admin_id?: string | null
          target_type?: string
          target_id?: string
          action?: 'warn' | 'delete' | 'ban' | 'shadow_ban' | 'dismiss' | null
          reason?: string | null
          created_at?: string
        }
      }

      announcements: {
        Row: {
          id: string
          title: string
          body: string
          created_by: string | null
          is_archived: boolean
          archived_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          body: string
          created_by?: string | null
          is_archived?: boolean
          archived_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          body?: string
          created_by?: string | null
          is_archived?: boolean
          archived_at?: string | null
          created_at?: string
        }
      }
      parties: {
        Row: {
          id: string
          name: string
          description: string | null
          host_id: string
          is_live: boolean
          is_private: boolean
          password: string | null
          max_attendees: number
          current_track: Json | null
          queue_locked: boolean
          scheduled_for: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          host_id: string
          is_live?: boolean
          is_private?: boolean
          password?: string | null
          max_attendees?: number
          current_track?: Json | null
          queue_locked?: boolean
          scheduled_for?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          host_id?: string
          is_live?: boolean
          is_private?: boolean
          password?: string | null
          max_attendees?: number
          current_track?: Json | null
          queue_locked?: boolean
          scheduled_for?: string | null
          created_at?: string
        }
      }
      party_members: {
        Row: {
          party_id: string
          user_id: string
          joined_at: string
        }
        Insert: {
          party_id: string
          user_id: string
          joined_at?: string
        }
        Update: {
          party_id?: string
          user_id?: string
          joined_at?: string
        }
      }
      party_messages: {
        Row: {
          id: string
          party_id: string
          user_id: string
          message: string
          created_at: string
        }
        Insert: {
          id?: string
          party_id: string
          user_id: string
          message: string
          created_at?: string
        }
        Update: {
          id?: string
          party_id?: string
          user_id?: string
          message?: string
          created_at?: string
        }
      }
      party_queue_items: {
        Row: {
          id: string
          party_id: string
          requested_by: string
          title: string
          artist: string | null
          uri: string | null
          duration_ms: number | null
          provider: string | null
          created_at: string
          played_at: string | null
        }
        Insert: {
          id?: string
          party_id: string
          requested_by: string
          title: string
          artist?: string | null
          uri?: string | null
          duration_ms?: number | null
          provider?: string | null
          created_at?: string
          played_at?: string | null
        }
        Update: {
          id?: string
          party_id?: string
          requested_by?: string
          title?: string
          artist?: string | null
          uri?: string | null
          duration_ms?: number | null
          provider?: string | null
          created_at?: string
          played_at?: string | null
        }
      }
      party_queue_votes: {
        Row: {
          queue_item_id: string
          user_id: string
          vote: number
          created_at: string
        }
        Insert: {
          queue_item_id: string
          user_id: string
          vote?: number
          created_at?: string
        }
        Update: {
          queue_item_id?: string
          user_id?: string
          vote?: number
          created_at?: string
        }
      }
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
      profile_comments: {
        Row: {
          id: string
          profile_id: string
          author_id: string
          content: string
          created_at: string
          updated_at: string
        }
        Insert: {
          profile_id: string
          author_id: string
          content: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          profile_id?: string
          author_id?: string
          content?: string
          created_at?: string
          updated_at?: string
        }
      }
      profile_ratings: {
        Row: {
          id: string
          profile_id: string
          rater_id: string
          rating: number
          created_at: string
        }
        Insert: {
          profile_id: string
          rater_id: string
          rating: number
          created_at?: string
        }
        Update: {
          id?: string
          profile_id?: string
          rater_id?: string
          rating?: number
          created_at?: string
        }
      }
      profile_favorites: {
        Row: {
          id: string
          profile_id: string
          content_id: string
          content_type: 'song' | 'album' | 'single' | 'compilation'
          created_at: string
        }
        Insert: {
          profile_id: string
          content_id: string
          content_type: 'song' | 'album' | 'single' | 'compilation'
          created_at?: string
        }
        Update: {
          id?: string
          profile_id?: string
          content_id?: string
          content_type?: 'song' | 'album' | 'single' | 'compilation'
          created_at?: string
        }
      }
      profile_social_links: {
        Row: {
          id: string
          profile_id: string
          platform:
            | 'twitter'
            | 'instagram'
            | 'github'
            | 'linkedin'
            | 'youtube'
            | 'spotify'
            | 'discord'
            | 'soundcloud'
          url: string
          youtube_url: string | null
          discord_url: string | null
          instagram_url: string | null
          soundcloud_url: string | null
          spotify_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          profile_id: string
          platform:
            | 'twitter'
            | 'instagram'
            | 'github'
            | 'linkedin'
            | 'youtube'
            | 'spotify'
            | 'discord'
            | 'soundcloud'
          url: string
          youtube_url?: string | null
          discord_url?: string | null
          instagram_url?: string | null
          soundcloud_url?: string | null
          spotify_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          profile_id?: string
          platform?:
            | 'twitter'
            | 'instagram'
            | 'github'
            | 'linkedin'
            | 'youtube'
            | 'spotify'
            | 'discord'
            | 'soundcloud'
          url?: string
          youtube_url?: string | null
          discord_url?: string | null
          instagram_url?: string | null
          soundcloud_url?: string | null
          spotify_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
