import { VerificationType } from '@/app/components/ui/VerifiedBadge'
import { Database } from '@/lib/database.types'
import { supabase } from '@/lib/supabase'

export type Post = Database['public']['Tables']['posts']['Row'] & {
  profiles?: Database['public']['Tables']['profiles']['Row'] & {
    verification_type?: VerificationType
    is_admin?: boolean
    is_yeditor?: boolean
  }
  user_vote?: number // -1, 0, 1
  // Extended fields for attachments
  image_url?: string | null
  attached_track_name?: string | null
  attached_track_artist?: string | null
  attached_cover_art?: string | null
}

export type PostReply = Database['public']['Tables']['post_replies']['Row'] & {
  profiles?: Database['public']['Tables']['profiles']['Row']
}

export const postsService = {
  /**
   * Get main feed posts
   */
  async getFeed(page = 0, limit = 20) {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // We need to fetch posts and join with profiles
    const query = supabase
      .from('posts')
      .select('*, profiles(*)')
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .range(page * limit, (page + 1) * limit - 1)

    const { data, error } = await query

    if (error) throw error

    return postsService._enrichWithVotes(data as Post[], user?.id)
  },

  /**
   * Get posts by a specific user
   */
  async getUserPosts(userId: string, page = 0, limit = 20) {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const query = supabase
      .from('posts')
      .select('*, profiles(*)')
      .eq('user_id', userId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .range(page * limit, (page + 1) * limit - 1)

    const { data, error } = await query

    if (error) throw error

    return postsService._enrichWithVotes(data as Post[], user?.id)
  },

  async _enrichWithVotes(posts: Post[], userId?: string) {
    if (!userId || posts.length === 0) return posts

    let postsWithVotes = [...posts]
    const postIds = posts.map((p) => p.id)

    const { data: votes } = await supabase
      .from('post_votes')
      .select('post_id, vote')
      .eq('user_id', userId)
      .in('post_id', postIds)

    if (votes) {
      const voteMap = new Map(votes.map((v) => [v.post_id, v.vote]))
      postsWithVotes = postsWithVotes.map((p) => ({
        ...p,
        user_vote: voteMap.get(p.id) || 0,
      }))
    }

    return postsWithVotes
  },

  /**
   * Create a new post
   */
  async createPost(
    content: string,
    type: Post['post_type'] | 'media' = 'text',
    attachment?: {
      id: string
      type: string
      name?: string
      artist?: string
      coverArt?: string
    },
    imageUrl?: string,
  ) {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('posts')
      .insert({
        user_id: user.id,
        content,
        post_type: type,
        attached_content_id: attachment?.id,
        attached_content_type: attachment?.type,
        attached_track_name: attachment?.name,
        attached_track_artist: attachment?.artist,
        attached_cover_art: attachment?.coverArt,
        image_url: imageUrl,
      })
      .select('*, profiles(*)')
      .single()

    if (error) throw error
    return data as Post
  },

  /**
   * Vote on a post
   */
  async vote(postId: string, vote: 1 | -1) {
    const { error } = await supabase.rpc('vote_post', {
      p_post_id: postId,
      p_vote: vote,
    })

    if (error) throw error
  },

  /**
   * Get replies for a post
   */
  async getReplies(postId: string) {
    const { data, error } = await supabase
      .from('post_replies')
      .select('*, profiles(*)')
      .eq('post_id', postId)
      .order('created_at', { ascending: true })

    if (error) throw error
    return data as PostReply[]
  },

  /**
   * Reply to a post
   */
  async reply(
    postId: string,
    content: string,
    parentReplyId?: string,
    attachment?: {
      id: string
      type: string
      name?: string
      artist?: string
      coverArt?: string
    },
    imageUrl?: string,
  ) {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('post_replies')
      .insert({
        post_id: postId,
        user_id: user.id,
        content,
        parent_reply_id: parentReplyId,
        attached_content_id: attachment?.id,
        attached_content_type: attachment?.type,
        attached_track_name: attachment?.name,
        attached_track_artist: attachment?.artist,
        attached_cover_art: attachment?.coverArt,
        image_url: imageUrl,
      })
      .select('*, profiles(*)')
      .single()

    if (error) throw error

    return data as PostReply
  },
}
