import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Loader2, Send } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CommentFormProps {
  placeholder?: string;
  onSubmit: (text: string) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
  username?: string;
  userAvatar?: string;
  initialValue?: string;
  compact?: boolean;
  maxLength?: number;
}

export function CommentForm({
  placeholder = 'Add a comment...',
  onSubmit,
  onCancel,
  isSubmitting = false,
  username,
  userAvatar,
  initialValue = '',
  compact = false,
  maxLength = 2000,
}: CommentFormProps) {
  const [text, setText] = useState(initialValue);
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = () => {
    if (!text.trim() || isSubmitting) return;
    onSubmit(text);
    setText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Submit on Ctrl/Cmd + Enter
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit();
    }
    // Cancel on Escape
    if (e.key === 'Escape' && onCancel) {
      e.preventDefault();
      onCancel();
    }
  };

  const showActions = isFocused || text.length > 0;
  const remainingChars = maxLength - text.length;
  const isNearLimit = remainingChars < 100;

  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        {/* Avatar */}
        {!compact && username && (
          <Avatar className="h-10 w-10">
            <AvatarImage src={userAvatar} />
            <AvatarFallback>{username.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
        )}

        {/* Input area */}
        <div className="flex-1">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isSubmitting}
            className={cn(
              'resize-none transition-all',
              compact ? 'min-h-[80px]' : 'min-h-[100px]'
            )}
            maxLength={maxLength}
          />

          {/* Character counter */}
          {showActions && isNearLimit && (
            <p className={cn(
              'text-xs mt-1',
              remainingChars < 0 ? 'text-red-600' : 'text-muted-foreground'
            )}>
              {remainingChars} characters remaining
            </p>
          )}
        </div>
      </div>

      {/* Actions */}
      {showActions && (
        <div className={cn(
          'flex items-center justify-end gap-2',
          !compact && username && 'ml-[52px]'
        )}>
          {onCancel && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          )}
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={!text.trim() || isSubmitting || text.length > maxLength}
            className="gap-2"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            {isSubmitting ? 'Posting...' : 'Post'}
          </Button>
        </div>
      )}

      {/* Helper text */}
      {!compact && showActions && (
        <p className="text-xs text-muted-foreground">
          Press <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Ctrl+Enter</kbd> to submit
        </p>
      )}
    </div>
  );
}
