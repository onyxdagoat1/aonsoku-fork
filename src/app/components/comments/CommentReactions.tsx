import { useState } from 'react';
import type { CommentWithReactions, ReactionType } from '@/types/comments';
import { REACTION_EMOJIS } from '@/types/comments';
import { Button } from '../ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../ui/popover';
import { Smile } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CommentReactionsProps {
  comment: CommentWithReactions;
  currentUserId?: string;
  onReact: (reactionType: ReactionType) => void;
}

export function CommentReactions({
  comment,
  currentUserId,
  onReact,
}: CommentReactionsProps) {
  const [showPicker, setShowPicker] = useState(false);

  const reactionCounts = comment.reaction_counts || {};
  const userReaction = comment.user_reaction;
  const hasReactions = Object.keys(reactionCounts).length > 0;

  const handleReaction = (type: ReactionType) => {
    if (!currentUserId) {
      alert('Please log in to react');
      return;
    }
    onReact(type);
    setShowPicker(false);
  };

  return (
    <div className="flex items-center gap-1">
      {/* Existing reactions */}
      {hasReactions && (
        <div className="flex items-center gap-1">
          {Object.entries(reactionCounts)
            .filter(([, count]) => count > 0)
            .map(([type, count]) => {
              const reactionType = type as ReactionType;
              const isActive = userReaction === reactionType;

              return (
                <Button
                  key={type}
                  variant="ghost"
                  size="sm"
                  onClick={() => handleReaction(reactionType)}
                  className={cn(
                    'h-7 px-2 gap-1 text-xs',
                    isActive && 'bg-accent'
                  )}
                >
                  <span className="text-base">{REACTION_EMOJIS[reactionType]}</span>
                  <span className="text-muted-foreground">{count}</span>
                </Button>
              );
            })}
        </div>
      )}

      {/* Reaction picker */}
      <Popover open={showPicker} onOpenChange={setShowPicker}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2"
            disabled={!currentUserId}
          >
            <Smile className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2" align="start">
          <div className="flex gap-1">
            {Object.entries(REACTION_EMOJIS).map(([type, emoji]) => {
              const reactionType = type as ReactionType;
              const isActive = userReaction === reactionType;

              return (
                <Button
                  key={type}
                  variant="ghost"
                  size="sm"
                  onClick={() => handleReaction(reactionType)}
                  className={cn(
                    'h-10 w-10 p-0 text-2xl hover:scale-125 transition-transform',
                    isActive && 'bg-accent'
                  )}
                  title={type}
                >
                  {emoji}
                </Button>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
