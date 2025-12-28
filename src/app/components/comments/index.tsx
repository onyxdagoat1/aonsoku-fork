import { CommentSection } from './CommentSection'
import type { ContentType } from '@/types/comments'

// Map old entity types to new content types
function mapEntityType(entityType: 'artist' | 'album' | 'compilation' | 'single'): ContentType {
  if (entityType === 'album' || entityType === 'compilation' || entityType === 'single') {
    return 'album'
  }
  return 'artist'
}

export default function Comments({
  entityType,
  entityId,
  entityName,
}: {
  entityType: 'artist' | 'album' | 'compilation' | 'single'
  entityId: string
  entityName: string
}) {
  const contentType = mapEntityType(entityType)

  return (
    <div className="mt-8">
      <CommentSection
        contentType={contentType}
        contentId={entityId}
        title={`Comments on ${entityName}`}
        placeholder="Add a comment..."
      />
    </div>
  )
}
