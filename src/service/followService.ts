import { supabase } from '@/lib/supabase'

export interface UserFollow {
  id: string
  follower_id: string
  following_type: 'user' | 'yeditor'
  following_id: string
  created_at: string
}

export type FollowType = 'user' | 'yeditor'

class FollowService {
  /**
   * Follow a user or yeditor
   */
  async follow(
    followingType: FollowType,
    followingId: string,
  ): Promise<boolean> {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      console.error('Must be logged in to follow')
      return false
    }

    const { error } = await supabase.from('user_follows').insert({
      follower_id: user.id,
      following_type: followingType,
      following_id: followingId,
    })

    if (error) {
      // Ignore duplicate key error (already following)
      if (error.code === '23505') {
        return true
      }
      console.error('Error following:', error)
      return false
    }

    return true
  }

  /**
   * Unfollow a user or yeditor
   */
  async unfollow(
    followingType: FollowType,
    followingId: string,
  ): Promise<boolean> {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      console.error('Must be logged in to unfollow')
      return false
    }

    const { error } = await supabase
      .from('user_follows')
      .delete()
      .eq('follower_id', user.id)
      .eq('following_type', followingType)
      .eq('following_id', followingId)

    if (error) {
      console.error('Error unfollowing:', error)
      return false
    }

    return true
  }

  /**
   * Check if current user is following someone
   */
  async isFollowing(
    followingType: FollowType,
    followingId: string,
  ): Promise<boolean> {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return false

    const { data, error } = await supabase
      .from('user_follows')
      .select('id')
      .eq('follower_id', user.id)
      .eq('following_type', followingType)
      .eq('following_id', followingId)
      .maybeSingle()

    if (error) {
      console.error('Error checking follow status:', error)
      return false
    }

    return !!data
  }

  /**
   * Get all users/yeditors that the current user is following
   */
  async getFollowing(type?: FollowType): Promise<UserFollow[]> {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return []

    let query = supabase
      .from('user_follows')
      .select('*')
      .eq('follower_id', user.id)
      .order('created_at', { ascending: false })

    if (type) {
      query = query.eq('following_type', type)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching following:', error)
      return []
    }

    return data || []
  }

  /**
   * Get followers of a user or yeditor
   */
  async getFollowers(
    followingType: FollowType,
    followingId: string,
  ): Promise<UserFollow[]> {
    const { data, error } = await supabase
      .from('user_follows')
      .select('*')
      .eq('following_type', followingType)
      .eq('following_id', followingId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching followers:', error)
      return []
    }

    return data || []
  }

  /**
   * Get follower count for a user or yeditor
   */
  async getFollowerCount(
    followingType: FollowType,
    followingId: string,
  ): Promise<number> {
    const { data, error } = await supabase.rpc('get_follower_count', {
      target_type: followingType,
      target_id: followingId,
    })

    if (error) {
      console.error('Error fetching follower count:', error)
      return 0
    }

    return data || 0
  }

  /**
   * Get following count for current user
   */
  async getFollowingCount(): Promise<number> {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return 0

    const { data, error } = await supabase.rpc('get_following_count', {
      user_uuid: user.id,
    })

    if (error) {
      console.error('Error fetching following count:', error)
      return 0
    }

    return data || 0
  }

  /**
   * Toggle follow status
   */
  async toggleFollow(
    followingType: FollowType,
    followingId: string,
  ): Promise<boolean> {
    const isCurrentlyFollowing = await this.isFollowing(
      followingType,
      followingId,
    )

    if (isCurrentlyFollowing) {
      return this.unfollow(followingType, followingId)
    } else {
      return this.follow(followingType, followingId)
    }
  }

  /**
   * Get follow status for multiple items
   */
  async getFollowStatuses(
    items: Array<{ type: FollowType; id: string }>,
  ): Promise<Record<string, boolean>> {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return items.reduce(
        (acc, item) => ({ ...acc, [`${item.type}-${item.id}`]: false }),
        {},
      )
    }

    const { data, error } = await supabase
      .from('user_follows')
      .select('following_type, following_id')
      .eq('follower_id', user.id)

    if (error) {
      console.error('Error fetching follow statuses:', error)
      return items.reduce(
        (acc, item) => ({ ...acc, [`${item.type}-${item.id}`]: false }),
        {},
      )
    }

    const followingSet = new Set(
      (data || []).map((f) => `${f.following_type}-${f.following_id}`),
    )

    return items.reduce(
      (acc, item) => {
        const key = `${item.type}-${item.id}`
        return { ...acc, [key]: followingSet.has(key) }
      },
      {} as Record<string, boolean>,
    )
  }
}

export const followService = new FollowService()
