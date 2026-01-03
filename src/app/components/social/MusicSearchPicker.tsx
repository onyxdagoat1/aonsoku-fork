import { Disc3, Loader2, Music, Play, Search, X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useDebounce } from 'use-debounce'
import { getCoverArtUrl } from '@/api/httpClient'
import { Button } from '@/app/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/app/components/ui/dialog'
import { Input } from '@/app/components/ui/input'
import { ScrollArea } from '@/app/components/ui/scroll-area'
import { subsonic } from '@/service/subsonic'

interface MusicSearchResult {
  id: string
  name: string
  artist: string
  coverArt?: string
  type: 'track' | 'album'
  albumId?: string
}

interface MusicSearchPickerProps {
  onSelect: (result: MusicSearchResult) => void
  children: React.ReactNode
}

export function MusicSearchPicker({
  onSelect,
  children,
}: MusicSearchPickerProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [debouncedQuery] = useDebounce(query, 300)
  const [results, setResults] = useState<MusicSearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'tracks' | 'albums'>('tracks')

  const searchMusic = useCallback(
    async (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setResults([])
        return
      }

      setLoading(true)
      try {
        const response = await subsonic.search.get({
          query: searchQuery,
          songCount: activeTab === 'tracks' ? 20 : 0,
          albumCount: activeTab === 'albums' ? 20 : 0,
          artistCount: 0,
        })

        const searchResults: MusicSearchResult[] = []

        if (activeTab === 'tracks' && response?.song) {
          response.song.forEach((song) => {
            searchResults.push({
              id: song.id,
              name: song.title,
              artist: song.artist || 'Unknown Artist',
              coverArt: song.coverArt,
              type: 'track',
              albumId: song.albumId,
            })
          })
        }

        if (activeTab === 'albums' && response?.album) {
          response.album.forEach((album) => {
            searchResults.push({
              id: album.id,
              name: album.name,
              artist: album.artist || 'Unknown Artist',
              coverArt: album.coverArt,
              type: 'album',
            })
          })
        }

        setResults(searchResults)
      } catch (error) {
        console.error('Search failed:', error)
        setResults([])
      } finally {
        setLoading(false)
      }
    },
    [activeTab],
  )

  useEffect(() => {
    searchMusic(debouncedQuery)
  }, [debouncedQuery, searchMusic])

  const handleSelect = (result: MusicSearchResult) => {
    onSelect(result)
    setOpen(false)
    setQuery('')
    setResults([])
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-lg bg-background/95 backdrop-blur-xl border-white/10">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Music className="w-5 h-5 text-primary" />
            Attach Music
          </DialogTitle>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          <Button
            variant={activeTab === 'tracks' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('tracks')}
            className="gap-2"
          >
            <Music className="w-4 h-4" />
            Tracks
          </Button>
          <Button
            variant={activeTab === 'albums' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('albums')}
            className="gap-2"
          >
            <Disc3 className="w-4 h-4" />
            Albums
          </Button>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={`Search ${activeTab}...`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10 bg-muted/30 border-white/10"
          />
          {query && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
              onClick={() => setQuery('')}
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Results */}
        <ScrollArea className="h-80 mt-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : results.length > 0 ? (
            <div className="space-y-2">
              {results.map((result) => (
                <button
                  key={`${result.type}-${result.id}`}
                  onClick={() => handleSelect(result)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors text-left group"
                >
                  {/* Cover */}
                  <div className="relative w-12 h-12 rounded-md overflow-hidden bg-muted flex-shrink-0">
                    {result.coverArt ? (
                      <img
                        src={getCoverArtUrl(result.coverArt, 'album', '100')}
                        alt={result.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        {result.type === 'track' ? (
                          <Music className="w-5 h-5" />
                        ) : (
                          <Disc3 className="w-5 h-5" />
                        )}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Play className="w-5 h-5 text-white" />
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">
                      {result.name}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {result.artist}
                    </div>
                  </div>

                  {/* Type badge */}
                  <span className="text-[10px] font-bold uppercase px-2 py-1 rounded bg-primary/10 text-primary">
                    {result.type}
                  </span>
                </button>
              ))}
            </div>
          ) : query ? (
            <div className="text-center py-8 text-muted-foreground">
              No {activeTab} found
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Search for {activeTab} to attach
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
