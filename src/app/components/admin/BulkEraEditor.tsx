import { Edit3, Music, Plus, Search, Tag, X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import { getCoverArtUrl } from '@/api/httpClient'
import { Button } from '@/app/components/ui/button'
import { Checkbox } from '@/app/components/ui/checkbox'
import { Input } from '@/app/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { eraService } from '@/service/eraService'
import { subsonic } from '@/service/subsonic'
import { ISong } from '@/types/responses/song'

interface Track {
  id: string
  title: string
  artist: string
  album: string
  coverArt?: string
  era?: string
}

interface Era {
  id: string
  name: string
}

export function BulkEraEditor() {
  const { user } = useAuth()
  const [tracks, setTracks] = useState<Track[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [eras, setEras] = useState<Era[]>([])
  const [selectedEraId, setSelectedEraId] = useState('')
  const [isApplying, setIsApplying] = useState(false)

  // Search state
  const [query, setQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Track[]>([])
  const [isSearching, setIsSearching] = useState(false)

  const loadEras = useCallback(async () => {
    try {
      // Get eras from database
      const { data, error } = await supabase
        .from('eras')
        .select('id, name')
        .order('name')

      if (error) throw error
      setEras(data || [])
    } catch (error) {
      console.error('Failed to load eras:', error)
    }
  }, [])

  useEffect(() => {
    if (user?.id) {
      loadEras()
    }
  }, [user?.id, loadEras])

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    setIsSearching(true)
    try {
      const res = await subsonic.search.get({ query, songCount: 20 })
      const songs = res?.song || []

      const mapped: Track[] = songs.map((s: ISong) => ({
        id: s.id,
        title: s.title,
        artist: s.artist,
        album: s.album,
        coverArt: s.coverArt,
        era: undefined,
      }))
      setSearchResults(mapped)
    } catch (error) {
      console.error('Search failed', error)
      toast.error('Search failed')
    } finally {
      setIsSearching(false)
    }
  }

  const addTrack = (track: Track) => {
    if (tracks.find((t) => t.id === track.id)) return
    setTracks((prev) => [...prev, track])
    setSearchResults([])
    setQuery('')
  }

  const removeTrack = (id: string) => {
    setTracks((prev) => prev.filter((t) => t.id !== id))
    selectedIds.delete(id)
    setSelectedIds(new Set(selectedIds))
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === tracks.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(tracks.map((t) => t.id)))
    }
  }

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
  }

  const handleApplyEra = async () => {
    if (!selectedEraId || selectedIds.size === 0 || !user?.id) {
      toast.warn('Select tracks and an era first')
      return
    }

    setIsApplying(true)
    try {
      const era = eras.find((e) => e.id === selectedEraId)
      if (!era) return

      // Apply era to each selected track
      await Promise.all(
        Array.from(selectedIds).map((songId) =>
          eraService.setEra(songId, 'song', selectedEraId),
        ),
      )

      // Update local state
      setTracks(
        tracks.map((t) => {
          if (selectedIds.has(t.id)) {
            return { ...t, era: era.name }
          }
          return t
        }),
      )

      toast.success(`Applied era "${era.name}" to ${selectedIds.size} tracks`)
      setSelectedIds(new Set())
    } catch (e) {
      console.error(e)
      toast.error('Failed to apply era tags')
    } finally {
      setIsApplying(false)
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
          <Edit3 className="w-5 h-5 text-primary" />
          Bulk Era Editor
        </h2>
        <p className="text-muted-foreground text-sm mt-1">
          Search for tracks and assign era tags in bulk
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        {/* Actions Sidebar */}
        <div className="space-y-4">
          {/* Search Box */}
          <div className="p-4 rounded-xl border border-border bg-card shadow-sm space-y-4">
            <h3 className="font-semibold flex items-center gap-2 text-sm">
              <Search className="w-4 h-4" /> Add Tracks
            </h3>
            <form onSubmit={handleSearch} className="flex gap-2">
              <Input
                placeholder="Search songs..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-9"
              />
              <Button type="submit" size="sm" disabled={isSearching}>
                {isSearching ? (
                  <span className="animate-spin">⏳</span>
                ) : (
                  <Search className="w-4 h-4" />
                )}
              </Button>
            </form>

            {searchResults.length > 0 && (
              <div className="border border-border rounded-md max-h-64 overflow-auto bg-background/50 text-sm">
                {searchResults.map((track) => (
                  <button
                    key={track.id}
                    onClick={() => addTrack(track)}
                    className="w-full text-left p-2 hover:bg-accent flex items-center gap-2 truncate border-b border-border/50 last:border-0"
                  >
                    <Plus className="w-3 h-3 opacity-50 shrink-0" />
                    <span className="truncate">
                      {track.title} - {track.artist}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Era Selection */}
          <div className="p-4 rounded-xl border border-border bg-card shadow-sm space-y-4">
            <h3 className="font-semibold flex items-center gap-2 text-sm">
              <Tag className="w-4 h-4 text-primary" />
              Batch Actions
            </h3>

            <div className="space-y-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Era</label>
                <Select value={selectedEraId} onValueChange={setSelectedEraId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Era..." />
                  </SelectTrigger>
                  <SelectContent>
                    {eras.map((era) => (
                      <SelectItem key={era.id} value={era.id}>
                        {era.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {eras.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    No eras found in database
                  </p>
                )}
              </div>

              <Button
                className="w-full"
                onClick={handleApplyEra}
                disabled={
                  isApplying || selectedIds.size === 0 || !selectedEraId
                }
              >
                {isApplying ? (
                  <span className="animate-spin mr-2">⏳</span>
                ) : (
                  <Tag className="w-4 h-4 mr-2" />
                )}
                Apply to Selected ({selectedIds.size})
              </Button>
            </div>
          </div>

          {/* Quick Stats */}
          {tracks.length > 0 && (
            <div className="p-4 rounded-xl border border-border bg-card/50 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Tracks:</span>
                <span className="font-semibold">{tracks.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Selected:</span>
                <span className="font-semibold text-primary">
                  {selectedIds.size}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Tracks Table */}
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm min-h-[500px]">
          {tracks.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-12">
              <Music className="w-16 h-16 mb-4 opacity-20" />
              <p className="font-medium">No tracks added yet</p>
              <p className="text-sm">Search and add tracks to start tagging</p>
            </div>
          ) : (
            <>
              <div className="p-4 border-b border-border flex items-center gap-4 bg-muted/30">
                <Checkbox
                  checked={
                    selectedIds.size === tracks.length && tracks.length > 0
                  }
                  onCheckedChange={toggleSelectAll}
                />
                <div className="grid grid-cols-[2fr_1.5fr_1.5fr_100px_30px] flex-1 text-sm font-medium text-muted-foreground">
                  <span>Title</span>
                  <span>Artist</span>
                  <span>Album</span>
                  <span>Era</span>
                  <span />
                </div>
              </div>

              <div className="divide-y divide-border max-h-[600px] overflow-y-auto">
                {tracks.map((track) => (
                  <div
                    key={track.id}
                    className={cn(
                      'flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors cursor-pointer',
                      selectedIds.has(track.id) && 'bg-primary/5',
                    )}
                    onClick={() => toggleSelect(track.id)}
                  >
                    <Checkbox
                      checked={selectedIds.has(track.id)}
                      onCheckedChange={() => toggleSelect(track.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="grid grid-cols-[2fr_1.5fr_1.5fr_100px_30px] flex-1 items-center gap-4">
                      <div className="flex items-center gap-3 font-medium overflow-hidden">
                        <div className="w-10 h-10 bg-muted rounded flex items-center justify-center text-muted-foreground overflow-hidden shrink-0">
                          {track.coverArt ? (
                            <img
                              src={getCoverArtUrl(
                                track.coverArt,
                                'song',
                                '100',
                              )}
                              alt={track.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Music className="w-5 h-5" />
                          )}
                        </div>
                        <span className="truncate text-sm">{track.title}</span>
                      </div>
                      <div className="text-sm text-muted-foreground truncate">
                        {track.artist}
                      </div>
                      <div className="text-sm text-muted-foreground truncate">
                        {track.album}
                      </div>
                      <div>
                        {track.era && (
                          <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium border border-primary/20">
                            {track.era}
                          </span>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={(e) => {
                          e.stopPropagation()
                          removeTrack(track.id)
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
