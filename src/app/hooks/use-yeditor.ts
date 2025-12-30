import { useQuery } from '@tanstack/react-query'
import { type ContentType, yeditorService } from '@/service/yeditorService'

export function useGetYeditorForContent(
  contentId: string,
  contentType: ContentType,
) {
  return useQuery({
    queryKey: ['yeditor', contentType, contentId],
    queryFn: () => yeditorService.getYeditorForContent(contentId, contentType),
    enabled: !!contentId,
  })
}

export function useGetYeditorsForContent(
  contentIds: string[],
  contentType: ContentType,
) {
  return useQuery({
    queryKey: ['yeditors', contentType, contentIds],
    queryFn: () =>
      yeditorService.getYeditorsForContent(contentIds, contentType),
    enabled: contentIds.length > 0,
  })
}

export function useGetYeditorLeaderboard(limit = 10) {
  return useQuery({
    queryKey: ['yeditor_leaderboard', limit],
    queryFn: () => yeditorService.getYeditorLeaderboard(limit),
  })
}
