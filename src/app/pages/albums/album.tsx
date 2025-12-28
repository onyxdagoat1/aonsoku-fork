import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { subsonic } from '@/app/clients/subsonic'
import { Skeleton } from '@/app/components/ui/skeleton'
import { Card } from '@/app/components/ui/card'
import { AspectRatio } from '@/app/components/ui/aspect-ratio'
import { Button } from '@/app/components/ui/button'
import { Play, Heart, MoreHorizontal } from 'lucide-react'
// import Comments from '@/app/components/comments'

export default function AlbumPage() {
  const { id } = useParams<{ id: string }>()

  const { data: album, isLoading } = useQuery({
    queryKey: ['album', id],
    queryFn: () => subsonic.getAlbum({ id: id! }),
    enabled: !!id,
  })

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex gap-6">
          <Skeleton className="h-64 w-64 rounded-lg" />
          <div className="flex-1 space-y-4">
            <Skeleton className="h-12 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      </div>
    )
  }

  if (!album) {
    return <div className="container mx-auto p-6">Album not found</div>
  }

  // Detect entity type
  const isSingle = album.songCount === 1
  const entityType = isSingle 
    ? 'single' 
    : album.compilation 
      ? 'compilation' 
      : 'album'

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Album Header */}
      <div className="flex gap-6">
        <Card className="overflow-hidden">
          <AspectRatio ratio={1}>
            <img
              src={album.coverArt}
              alt={album.name}
              className="object-cover w-full h-full"
            />
          </AspectRatio>
        </Card>

        <div className="flex-1 space-y-4">
          <h1 className="text-4xl font-bold">{album.name}</h1>
          <p className="text-lg text-muted-foreground">{album.artist}</p>
          
          <div className="flex gap-2">
            <Button size="lg">
              <Play className="h-5 w-5 mr-2" />
              Play
            </Button>
            <Button size="lg" variant="outline">
              <Heart className="h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline">
              <MoreHorizontal className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Track list would go here */}

      {/* Comments Section - Temporarily Disabled */}
      {/* <div className="mt-8">
        <Comments
          entityType={entityType}
          entityId={album.id}
          entityName={album.name}
        />
      </div> */}
    </div>
  )
}
