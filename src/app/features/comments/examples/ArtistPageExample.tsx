/**
 * Example: Adding comments to an Artist page
 * 
 * This shows how to integrate the comment system into
 * an artist detail page with user authentication.
 */

import { CommentSection } from '@/app/components/comments/CommentSection';
import { useCommentStats } from '@/hooks/useComments';
import { MessageSquare, ThumbsUp } from 'lucide-react';

// Example artist page component
export function ArtistPageExample({ artist, currentUser }) {
  const stats = useCommentStats('artist', artist.id);

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Artist Header */}
      <div className="space-y-4">
        <h1 className="text-4xl font-bold">{artist.name}</h1>
        <p className="text-muted-foreground">{artist.bio}</p>
        
        {/* Stats bar */}
        {stats.data && (
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              <span>{stats.data.total_comments} comments</span>
            </div>
            <div className="flex items-center gap-2">
              <ThumbsUp className="h-4 w-4" />
              <span>{stats.data.total_reactions} reactions</span>
            </div>
          </div>
        )}
      </div>

      {/* Albums, Songs, etc. */}
      <div>
        {/* Your existing artist content */}
      </div>

      {/* Comment Section */}
      <div className="border-t pt-8">
        <CommentSection
          contentType="artist"
          contentId={artist.id}
          userId={currentUser?.id}
          username={currentUser?.username}
          userAvatar={currentUser?.avatarUrl}
          title="Discussion"
          placeholder={`Share your thoughts about ${artist.name}...`}
        />
      </div>
    </div>
  );
}
