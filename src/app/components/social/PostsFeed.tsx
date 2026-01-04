import { useInfiniteQuery } from '@tanstack/react-query'
import { memo, useState } from 'react'
import { RiLoader4Fill } from 'react-icons/ri'

import { PostCard } from '@/app/components/social/PostCard'
import { PostComposer } from '@/app/components/social/PostComposer'
import { Button } from '@/app/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog'
import { Post, postsService } from '@/service/posts.service'

interface PostsFeedProps {
  showComposer?: boolean
  className?: string
  limit?: number
  userId?: string
  attachmentFilter?: {
    type: 'track' | 'album'
    id: string
    name: string
    artist: string
    coverArt?: string
  }
}

// Add posts feed to queryKeys if not exists (I should check queryKeys first, but using a string key is safe for now or extending it locally)
const POSTS_QUERY_KEY = 'posts-feed'

export const PostsFeed = memo(
  ({
    showComposer = true,
    className,
    limit = 20,
    userId,
    attachmentFilter,
  }: PostsFeedProps) => {
    const [replyingTo, setReplyingTo] = useState<Post | null>(null)

    const {
      data,
      fetchNextPage,
      hasNextPage,
      // isFetching, // Removed unused
      isFetchingNextPage,
      isLoading,
      refetch,
    } = useInfiniteQuery({
      queryKey: [
        POSTS_QUERY_KEY,
        userId || 'all',
        attachmentFilter?.id || 'none',
        limit,
      ],
      queryFn: ({ pageParam = 0 }) => {
        if (attachmentFilter) {
          return postsService.getPostsByAttachment(
            attachmentFilter.type,
            attachmentFilter.id,
            pageParam,
            limit,
          )
        }
        return userId
          ? postsService.getUserPosts(userId, pageParam, limit)
          : postsService.getFeed(pageParam, limit)
      },
      initialPageParam: 0,
      getNextPageParam: (lastPage, allPages) => {
        // If last page has fewer items than limit, no more pages
        if (!lastPage || lastPage.length < limit) return undefined
        return allPages.length
      },
    })

    // Flatten pages
    const posts = data?.pages.flatMap((page) => page) || []

    return (
      <div className={`space-y-6 ${className}`}>
        {showComposer && (
          <PostComposer
            onPostCreated={refetch}
            forcedAttachment={
              attachmentFilter
                ? {
                    id: attachmentFilter.id,
                    type: attachmentFilter.type,
                    name: attachmentFilter.name,
                    artist: attachmentFilter.artist,
                    coverArt: attachmentFilter.coverArt,
                  }
                : undefined
            }
          />
        )}

        {isLoading && posts.length === 0 ? (
          <div className="flex justify-center p-8">
            <RiLoader4Fill className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : posts.length > 0 ? (
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onReply={(post) => setReplyingTo(post)}
                onDelete={() => refetch()}
              />
            ))}

            {hasNextPage && (
              <div className="flex justify-center pt-4">
                <Button
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  variant="outline"
                  className="bg-background/20 backdrop-blur-sm"
                >
                  {isFetchingNextPage ? (
                    <>
                      <RiLoader4Fill className="w-4 h-4 animate-spin mr-2" />{' '}
                      Loading...
                    </>
                  ) : (
                    'Load More'
                  )}
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center p-12 text-muted-foreground bg-card/30 rounded-xl border border-dashed border-white/10">
            <p>No posts yet. Be the first to say something!</p>
          </div>
        )}

        <Dialog
          open={!!replyingTo}
          onOpenChange={(open) => !open && setReplyingTo(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                Reply to {replyingTo?.profiles?.display_name || 'User'}
              </DialogTitle>
            </DialogHeader>
            <div className="pt-4">
              <PostComposer
                placeholder={`Replying to ${replyingTo?.profiles?.display_name}...`}
                replyToId={replyingTo?.id}
                onPostCreated={() => {
                  setReplyingTo(null)
                  // We might want to optimistically update reply count or similar
                }}
              />
            </div>
          </DialogContent>
        </Dialog>
      </div>
    )
  },
)
