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

  /**
   * Get posts attached to specific content (e.g. comments on an album)
   */
  async getPostsByAttachment(
    contentType: string,
    contentId: string,
    page = 0,
    limit = 20,
  ) {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const query = supabase
      .from('posts')
      .select('*, profiles(*)')
      .eq('attached_content_type', contentType)
      .eq('attached_content_id', contentId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .range(page * limit, (page + 1) * limit - 1)

    const { data, error } = await query

    if (error) throw error

    return postsService._enrichWithVotes(data as Post[], user?.id)
  },

  /**
   * Get post count by attachment
   */
  async getPostCount(contentType: string, contentId: string) {
    const { count, error } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('attached_content_type', contentType)
      .eq('attached_content_id', contentId)
      .eq('is_deleted', false)

    if (error) throw error
    return count || 0
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
  async reply(postId: string, content: string, parentReplyId?: string) {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const insertData: {
      post_id: string
      user_id: string
      content: string
      parent_reply_id?: string
    } = {
      post_id: postId,
      user_id: user.id,
      content,
    }

    // Only add parent_reply_id if it exists (for nested replies)
    if (parentReplyId) {
      insertData.parent_reply_id = parentReplyId
    }

    const { data, error } = await supabase
      .from('post_replies')
      .insert(insertData)
      .select('*, profiles(*)')
      .single()

    if (error) throw error

    return data as PostReply
  },

  /**
   * Delete a post (soft delete)
   * Users can delete their own posts, admins can delete any post
   */
  async deletePost(postId: string) {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    const isAdmin = profile?.is_admin === true

    // Check if user owns the post or is admin
    const { data: post } = await supabase
      .from('posts')
      .select('user_id')
      .eq('id', postId)
      .single()

    if (!post) throw new Error('Post not found')
    if (!isAdmin && post.user_id !== user.id) {
      throw new Error('Not authorized to delete this post')
    }

    const { error } = await supabase
      .from('posts')
      .update({ is_deleted: true })
      .eq('id', postId)

    if (error) throw error
    return { deleted: true }
  },

  /**
   * Get replies for a post with user vote status
   */
  async getRepliesWithVotes(postId: string) {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { data, error } = await supabase
      .from('post_replies')
      .select('*, profiles(*)')
      .eq('post_id', postId)
      .order('created_at', { ascending: true })

    if (error) throw error

    let replies = data as (PostReply & { user_vote?: number })[]

    // Get user votes if logged in
    if (user && replies.length > 0) {
      const replyIds = replies.map((r) => r.id)
      const { data: votes } = await supabase
        .from('reply_votes')
        .select('reply_id, vote')
        .eq('user_id', user.id)
        .in('reply_id', replyIds)

      if (votes) {
        const voteMap = new Map(votes.map((v) => [v.reply_id, v.vote]))
        replies = replies.map((r) => ({
          ...r,
          user_vote: voteMap.get(r.id) || 0,
        }))
      }
    }

    return replies
  },

  /**
   * Vote on a reply
   */
  async voteReply(replyId: string, vote: 1 | -1) {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    // Upsert vote
    const { error } = await supabase.from('reply_votes').upsert(
      {
        reply_id: replyId,
        user_id: user.id,
        vote,
      },
      { onConflict: 'reply_id,user_id' },
    )

    if (error) throw error

    // Update counts on the reply
    // This could be done via trigger, but doing manually for now
    const { data: allVotes } = await supabase
      .from('reply_votes')
      .select('vote')
      .eq('reply_id', replyId)

    const upvotes = allVotes?.filter((v) => v.vote === 1).length || 0
    const downvotes = allVotes?.filter((v) => v.vote === -1).length || 0

    await supabase
      .from('post_replies')
      .update({ upvotes, downvotes })
      .eq('id', replyId)
  },

  /**
   * Delete a reply
   */
  async deleteReply(replyId: string) {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    const isAdmin = profile?.is_admin === true

    // Check ownership
    const { data: reply } = await supabase
      .from('post_replies')
      .select('user_id')
      .eq('id', replyId)
      .single()

    if (!reply) throw new Error('Reply not found')
    if (!isAdmin && reply.user_id !== user.id) {
      throw new Error('Not authorized to delete this reply')
    }

    const { error } = await supabase
      .from('post_replies')
      .delete()
      .eq('id', replyId)

    if (error) throw error
    return { deleted: true }
  },
}
