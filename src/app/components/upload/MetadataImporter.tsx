import axios from 'axios'
import { Check, Database, Loader2, Search } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'react-toastify'
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
import type { MusicMetadata } from '@/types/upload'

interface MetadataImporterProps {
  currentMetadata: MusicMetadata
  onImport: (metadata: Partial<MusicMetadata>) => void
}

interface MusicBrainzResult {
  id: string
  title: string
  artist: string
  album?: string
  date?: string
  length?: number
  releases?: any[]
}

export function MetadataImporter({
  currentMetadata,
  onImport,
}: MetadataImporterProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [results, setResults] = useState<MusicBrainzResult[]>([])

  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setIsSearching(true)
    try {
      // Search MusicBrainz API
      // Note: User-Agent is required by MusicBrainz
      const response = await axios.get(
        `https://musicbrainz.org/ws/2/recording`,
        {
          params: {
            query: searchQuery,
            fmt: 'json',
            limit: 10,
          },
        },
      )

      if (response.data.recordings) {
        const mappedResults = response.data.recordings.map((rec: any) => ({
          id: rec.id,
          title: rec.title,
          artist: rec['artist-credit']?.[0]?.name || 'Unknown',
          album: rec.releases?.[0]?.title,
          date: rec.releases?.[0]?.date || rec['first-release-date'],
          length: rec.length,
          releases: rec.releases,
        }))
        setResults(mappedResults)
      }
    } catch (error) {
      console.error('MusicBrainz search failed:', error)
      toast.error('Failed to search MusicBrainz')
    } finally {
      setIsSearching(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch()
  }

  const selectResult = (result: MusicBrainzResult) => {
    const year = result.date ? parseInt(result.date.split('-')[0]) : undefined

    // Construct new metadata
    const newMeta: Partial<MusicMetadata> = {
      title: result.title,
      artist: result.artist,
      album: result.album,
      year: year,
    }

    onImport(newMeta)
    setIsOpen(false)
    toast.success('Metadata imported!')
  }

  // Auto-fill query when opening
  const onOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (open && !searchQuery) {
      const query = [currentMetadata.artist, currentMetadata.title]
        .filter(Boolean)
        .join(' - ')
      setSearchQuery(query)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Database className="w-4 h-4" />
          Import Metadata
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Import from MusicBrainz</DialogTitle>
        </DialogHeader>

        <div className="flex gap-2 my-2">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search Artist - Title..."
            className="flex-1"
          />
          <Button onClick={handleSearch} disabled={isSearching}>
            {isSearching ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
          </Button>
        </div>

        <div className="flex-1 overflow-hidden min-h-[300px]">
          {results.length === 0 && !isSearching ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-50">
              <Database className="w-12 h-12 mb-2" />
              <p>Search for a song to import metadata</p>
            </div>
          ) : (
            <ScrollArea className="h-full">
              <div className="space-y-2 pr-4">
                {results.map((result) => (
                  <div
                    key={result.id}
                    className="border rounded-lg p-3 hover:bg-accent/50 transition-colors flex items-center justify-between group"
                  >
                    <div>
                      <div className="font-semibold">{result.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {result.artist} • {result.album} •{' '}
                        {result.date?.split('-')[0]}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => selectResult(result)}
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Select
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
