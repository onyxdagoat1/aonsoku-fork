/**
 * Example: Adding comments to a Single/Compilation page
 * 
 * Simpler implementation for single track or compilation releases.
 */

import { CommentSection } from '@/app/components/comments/CommentSection';
import { useCommentStats } from '@/hooks/useComments';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Separator } from '@/app/components/ui/separator';

export function SinglePageExample({ single, currentUser }) {
  const stats = useCommentStats('single', single.id);

  return (
    <div className="container max-w-4xl mx-auto py-8 space-y-8">
      {/* Single Info Card */}
      <Card>
        <CardHeader>
          <div className="flex gap-6">
            <img
              src={single.coverArt}
              alt={single.title}
              className="w-32 h-32 rounded-lg"
            />
            <div className="space-y-2">
              <CardTitle className="text-3xl">{single.title}</CardTitle>
              <p className="text-xl text-muted-foreground">{single.artist}</p>
              <div className="flex gap-4 text-sm text-muted-foreground">
                <span>{single.releaseDate}</span>
                <span>•</span>
                <span>{single.duration}</span>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-4">
            {/* Play button, share, etc. */}
            <div className="flex gap-2">
              {/* Your player controls */}
            </div>

            {/* Stats */}
            {stats.data && (
              <div className="flex gap-6 text-sm text-muted-foreground">
                <span>{stats.data.total_comments} comments</span>
                <span>{stats.data.total_reactions} reactions</span>
                {stats.data.top_reactions.map((reaction) => (
                  <span key={reaction.type}>
                    {REACTION_EMOJIS[reaction.type]} {reaction.count}
                  </span>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Comments */}
      <CommentSection
        contentType="single"
        contentId={single.id}
        userId={currentUser?.id}
        username={currentUser?.username}
        userAvatar={currentUser?.avatarUrl}
        placeholder={`Share your thoughts on "${single.title}"...`}
      />
    </div>
  );
}

// Import REACTION_EMOJIS
import { REACTION_EMOJIS } from '@/types/comments';
