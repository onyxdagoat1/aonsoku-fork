import { useQuery } from '@tanstack/react-query'
import { AlertCircle, Loader2, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import HeaderTitle from '@/app/components/header-title'
import ListWrapper from '@/app/components/list-wrapper'
import { Badge } from '@/app/components/ui/badge'
import { Button } from '@/app/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Checkbox } from '@/app/components/ui/checkbox'
import { ScrollArea } from '@/app/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs'
import { getCoverArtUrl } from '@/api/httpClient'
import { subsonic } from '@/service/subsonic'
import { ISong } from '@/types/responses/song'
import { convertSecondsToTime } from '@/utils/convertSecondsToTime'
import { formatBytes } from '@/utils/formatBytes'

interface DuplicateGroup {
  key: string
  songs: ISong[]
  type: 'exact' | 'similar'
}

function findDuplicates(songs: ISong[]): DuplicateGroup[] {
  const groups: Map<string, ISong[]> = new Map()

  // Group by title + artist (case insensitive)
  songs.forEach((song) => {
    const key = `${song.title.toLowerCase()}|||${song.artist.toLowerCase()}`
    const existing = groups.get(key) || []
    existing.push(song)
    groups.set(key, existing)
  })

  // Filter groups with more than 1 song
  const duplicateGroups: DuplicateGroup[] = []
  groups.forEach((songs, key) => {
    if (songs.length > 1) {
      // Check if they're exact duplicates (same path) or similar
      const paths = new Set(songs.map((s) => s.path))
      const type = paths.size === 1 ? 'exact' : 'similar'

      duplicateGroups.push({
        key,
        songs,
        type,
      })
    }
  })

  return duplicateGroups
}

export default function Duplicates() {
  const { t } = useTranslation()
  const [selectedSongs, setSelectedSongs] = useState<Set<string>>(new Set())

  const { data: allSongs, isLoading } = useQuery({
    queryKey: ['allSongs'],
    queryFn: async () => {
      // Get a large number of songs to scan
      return subsonic.songs.getAllSongs(5000)
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  const duplicates = allSongs ? findDuplicates(allSongs) : []
  const exactDuplicates = duplicates.filter((d) => d.type === 'exact')
  const similarDuplicates = duplicates.filter((d) => d.type === 'similar')

  const toggleSong = (songId: string) => {
    const newSelected = new Set(selectedSongs)
    if (newSelected.has(songId)) {
      newSelected.delete(songId)
    } else {
      newSelected.add(songId)
    }
    setSelectedSongs(newSelected)
  }

  const renderDuplicateGroup = (group: DuplicateGroup) => {
    const [first, ...rest] = group.songs

    return (
      <Card key={group.key} className="mb-4">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">
              {first.title}
              <span className="text-sm font-normal text-muted-foreground ml-2">
                by {first.artist}
              </span>
            </CardTitle>
            <Badge variant={group.type === 'exact' ? 'destructive' : 'default'}>
              {group.songs.length} {t('metadata.duplicates.copies')}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {group.songs.map((song) => (
              <div
                key={song.id}
                className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent transition-colors"
              >
                <Checkbox
                  checked={selectedSongs.has(song.id)}
                  onCheckedChange={() => toggleSong(song.id)}
                />
                <img
                  src={getCoverArtUrl(song.coverArt, 'album', '60')}
                  alt={song.album}
                  className="w-12 h-12 rounded object-cover"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{song.album}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {song.path}
                  </div>
                  <div className="flex gap-2 mt-1">
                    <Badge variant="neutral" className="text-xs">
                      {formatBytes(song.size)}
                    </Badge>
                    <Badge variant="neutral" className="text-xs">
                      {song.bitRate} kbps
                    </Badge>
                    <Badge variant="neutral" className="text-xs">
                      {convertSecondsToTime(song.duration)}
                    </Badge>
                    {song.playCount && song.playCount > 0 && (
                      <Badge variant="neutral" className="text-xs">
                        {song.playCount} {t('table.columns.plays').toLowerCase()}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="w-full">
      <HeaderTitle title={t('metadata.duplicates.title')} />

      <ListWrapper>
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        )}

        {!isLoading && duplicates.length === 0 && (
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {t('metadata.duplicates.noDuplicates')}
            </h3>
            <p className="text-muted-foreground">
              {t('metadata.duplicates.noDuplicatesDesc')}
            </p>
          </div>
        )}

        {!isLoading && duplicates.length > 0 && (
          <>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold">
                  {t('metadata.duplicates.found', { count: duplicates.length })}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {t('metadata.duplicates.scanned', { count: allSongs?.length || 0 })}
                </p>
              </div>
              {selectedSongs.size > 0 && (
                <Button variant="destructive" className="gap-2">
                  <Trash2 className="h-4 w-4" />
                  {t('metadata.duplicates.deleteSelected', {
                    count: selectedSongs.size,
                  })}
                </Button>
              )}
            </div>

            <Tabs defaultValue="all" className="w-full">
              <TabsList>
                <TabsTrigger value="all">
                  {t('metadata.duplicates.all')} ({duplicates.length})
                </TabsTrigger>
                <TabsTrigger value="exact">
                  {t('metadata.duplicates.exact')} ({exactDuplicates.length})
                </TabsTrigger>
                <TabsTrigger value="similar">
                  {t('metadata.duplicates.similar')} ({similarDuplicates.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all">
                <ScrollArea className="h-[calc(100vh-300px)]">
                  {duplicates.map(renderDuplicateGroup)}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="exact">
                <ScrollArea className="h-[calc(100vh-300px)]">
                  {exactDuplicates.map(renderDuplicateGroup)}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="similar">
                <ScrollArea className="h-[calc(100vh-300px)]">
                  {similarDuplicates.map(renderDuplicateGroup)}
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </>
        )}
      </ListWrapper>
    </div>
  )
}
