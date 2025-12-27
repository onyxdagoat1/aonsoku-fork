import { supabase } from '@/lib/supabase';
import type {
  Comment,
  CommentReaction,
  CommentWithReactions,
  CreateCommentInput,
  UpdateCommentInput,
  ContentType,
  ReactionType,
  CommentStats,
} from '@/types/comments';

class CommentsService {
  /**
   * Get all comments for a specific content
   */
  async getComments(
    contentType: ContentType,
    contentId: string,
    userId?: string
  ): Promise<CommentWithReactions[]> {
    try {
      // Get top-level comments with reactions
      const { data: comments, error } = await supabase
        .from('comments_with_reactions')
        .select('*')
        .eq('content_type', contentType)
        .eq('content_id', contentId)
        .is('parent_id', null)
        .order('pinned', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get user's reactions if userId provided
      let userReactions: CommentReaction[] = [];
      if (userId) {
        const { data } = await supabase
          .from('comment_reactions')
          .select('*')
          .eq('user_id', userId)
          .in(
            'comment_id',
            comments?.map((c) => c.id) || []
          );
        userReactions = data || [];
      }

      // Get replies for each comment
      const commentsWithReplies = await Promise.all(
        (comments || []).map(async (comment) => {
          const replies = await this.getReplies(comment.id, userId);
          const userReaction = userReactions.find(
            (r) => r.comment_id === comment.id
          );

          return {
            ...comment,
            reaction_counts: comment.reaction_counts || {},
            user_reaction: userReaction?.reaction_type || null,
            replies,
          } as CommentWithReactions;
        })
      );

      return commentsWithReplies;
    } catch (error) {
      console.error('Error fetching comments:', error);
      throw error;
    }
  }

  /**
   * Get replies for a comment
   */
  async getReplies(
    parentId: string,
    userId?: string
  ): Promise<CommentWithReactions[]> {
    try {
      const { data: replies, error } = await supabase
        .from('comments_with_reactions')
        .select('*')
        .eq('parent_id', parentId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Get user's reactions
      let userReactions: CommentReaction[] = [];
      if (userId && replies && replies.length > 0) {
        const { data } = await supabase
          .from('comment_reactions')
          .select('*')
          .eq('user_id', userId)
          .in(
            'comment_id',
            replies.map((r) => r.id)
          );
        userReactions = data || [];
      }

      return (
        replies?.map((reply) => {
          const userReaction = userReactions.find(
            (r) => r.comment_id === reply.id
          );
          return {
            ...reply,
            reaction_counts: reply.reaction_counts || {},
            user_reaction: userReaction?.reaction_type || null,
            replies: [],
          } as CommentWithReactions;
        }) || []
      );
    } catch (error) {
      console.error('Error fetching replies:', error);
      return [];
    }
  }

  /**
   * Create a new comment
   */
  async createComment(
    input: CreateCommentInput,
    userId: string,
    username: string,
    userAvatar?: string
  ): Promise<Comment> {
    try {
      const { data, error } = await supabase
        .from('comments')
        .insert({
          ...input,
          user_id: userId,
          username,
          user_avatar: userAvatar,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating comment:', error);
      throw error;
    }
  }

  /**
   * Update a comment
   */
  async updateComment(
    commentId: string,
    input: UpdateCommentInput
  ): Promise<Comment> {
    try {
      const { data, error } = await supabase
        .from('comments')
        .update(input)
        .eq('id', commentId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating comment:', error);
      throw error;
    }
  }

  /**
   * Delete a comment (soft delete)
   */
  async deleteComment(commentId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('comments')
        .update({ deleted: true, text: '[deleted]' })
        .eq('id', commentId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting comment:', error);
      throw error;
    }
  }

  /**
   * Add or update reaction to a comment
   */
  async addReaction(
    commentId: string,
    userId: string,
    reactionType: ReactionType
  ): Promise<CommentReaction> {
    try {
      const { data, error } = await supabase
        .from('comment_reactions')
        .upsert(
          {
            comment_id: commentId,
            user_id: userId,
            reaction_type: reactionType,
          },
          {
            onConflict: 'comment_id,user_id',
          }
        )
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error adding reaction:', error);
      throw error;
    }
  }

  /**
   * Remove reaction from a comment
   */
  async removeReaction(commentId: string, userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('comment_reactions')
        .delete()
        .eq('comment_id', commentId)
        .eq('user_id', userId);

      if (error) throw error;
    } catch (error) {
      console.error('Error removing reaction:', error);
      throw error;
    }
  }

  /**
   * Get comment statistics
   */
  async getCommentStats(
    contentType: ContentType,
    contentId: string
  ): Promise<CommentStats> {
    try {
      const { data: comments, error } = await supabase
        .from('comments_with_reactions')
        .select('id, total_reactions, reaction_counts')
        .eq('content_type', contentType)
        .eq('content_id', contentId);

      if (error) throw error;

      const totalComments = comments?.length || 0;
      const totalReactions =
        comments?.reduce((sum, c) => sum + (c.total_reactions || 0), 0) || 0;

      // Aggregate reaction counts
      const reactionMap: Record<string, number> = {};
      comments?.forEach((comment) => {
        const counts = comment.reaction_counts as Record<string, number>;
        if (counts) {
          Object.entries(counts).forEach(([type, count]) => {
            reactionMap[type] = (reactionMap[type] || 0) + count;
          });
        }
      });

      const topReactions = Object.entries(reactionMap)
        .map(([type, count]) => ({ type: type as ReactionType, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);

      return {
        total_comments: totalComments,
        total_reactions: totalReactions,
        top_reactions: topReactions,
      };
    } catch (error) {
      console.error('Error getting comment stats:', error);
      return {
        total_comments: 0,
        total_reactions: 0,
        top_reactions: [],
      };
    }
  }

  /**
   * Report a comment
   */
  async reportComment(commentId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('comments')
        .update({ reported: true })
        .eq('id', commentId);

      if (error) throw error;
    } catch (error) {
      console.error('Error reporting comment:', error);
      throw error;
    }
  }

  /**
   * Pin/unpin a comment
   */
  async pinComment(commentId: string, pinned: boolean): Promise<void> {
    try {
      const { error } = await supabase
        .from('comments')
        .update({ pinned })
        .eq('id', commentId);

      if (error) throw error;
    } catch (error) {
      console.error('Error pinning comment:', error);
      throw error;
    }
  }
}

export const commentsService = new CommentsService();
