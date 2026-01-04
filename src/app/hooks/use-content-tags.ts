import { useQuery } from '@tanstack/react-query'
import { tagService } from '@/service/tagService'

export function useContentTags(
  contentIds: string[],
  contentType: 'album' | 'song',
) {
  return useQuery({
    queryKey: ['content-tags', contentType, contentIds],
    queryFn: () => tagService.getTagsForContent(contentIds, contentType),
    enabled: contentIds.length > 0,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

export function useContentTag(
  contentId: string,
  contentType: 'album' | 'song',
) {
  return useQuery({
    queryKey: ['content-tag', contentType, contentId],
    queryFn: () => tagService.getTag(contentId, contentType),
    enabled: !!contentId,
    staleTime: 1000 * 60 * 5,
  })
}
