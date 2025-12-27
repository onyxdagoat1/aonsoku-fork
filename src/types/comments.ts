export type ContentType = 'artist' | 'album' | 'song' | 'compilation' | 'single';

export type ReactionType = 'like' | 'love' | 'fire' | 'laugh' | 'sad' | 'angry';

export interface Comment {
  id: string;
  content_type: ContentType;
  content_id: string;
  user_id: string;
  username: string;
  user_avatar?: string;
  text: string;
  parent_id?: string | null;
  reply_count: number;
  created_at: string;
  updated_at: string;
  edited: boolean;
  pinned: boolean;
  deleted: boolean;
  reported: boolean;
}

export interface CommentReaction {
  id: string;
  comment_id: string;
  user_id: string;
  reaction_type: ReactionType;
  created_at: string;
}

export interface CommentWithReactions extends Comment {
  reaction_counts: Record<ReactionType, number>;
  total_reactions: number;
  user_reaction?: ReactionType | null;
  replies?: CommentWithReactions[];
}

export interface CreateCommentInput {
  content_type: ContentType;
  content_id: string;
  text: string;
  parent_id?: string | null;
}

export interface UpdateCommentInput {
  text?: string;
  pinned?: boolean;
}

export interface CommentStats {
  total_comments: number;
  total_reactions: number;
  top_reactions: Array<{ type: ReactionType; count: number }>;
}

export const REACTION_EMOJIS: Record<ReactionType, string> = {
  like: '👍',
  love: '❤️',
  fire: '🔥',
  laugh: '😂',
  sad: '😢',
  angry: '😠',
};
