import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { subsonic } from '@/app/clients/subsonic'
import { Skeleton } from '@/app/components/ui/skeleton'
import { Card } from '@/app/components/ui/card'
import { AspectRatio } from '@/app/components/ui/aspect-ratio'
import { Button } from '@/app/components/ui/button'
import { Play, Heart, MoreHorizontal } from 'lucide-react'
// import Comments from '@/app/components/comments'

export default function ArtistPage() {
  const { id } = useParams<{ id: string }>()

  const { data: artist, isLoading } = useQuery({
    queryKey: ['artist', id],
    queryFn: () => subsonic.getArtist({ id: id! }),
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

  if (!artist) {
    return <div className="container mx-auto p-6">Artist not found</div>
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Artist Header */}
      <div className="flex gap-6">
        <Card className="overflow-hidden">
          <AspectRatio ratio={1}>
            <img
              src={artist.coverArt}
              alt={artist.name}
              className="object-cover w-full h-full"
            />
          </AspectRatio>
        </Card>

        <div className="flex-1 space-y-4">
          <h1 className="text-4xl font-bold">{artist.name}</h1>
          
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

          {artist.biography && (
            <div className="text-sm text-muted-foreground">
              {artist.biography}
            </div>
          )}
        </div>
      </div>

      {/* Albums/Tracks would go here */}

      {/* Comments Section - Temporarily Disabled */}
      {/* <div className="mt-8">
        <Comments
          entityType="artist"
          entityId={artist.id}
          entityName={artist.name}
        />
      </div> */}
    </div>
  )
}
