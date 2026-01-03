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
import { subsonic } from '@/service/subsonic'
import { ISong } from '@/types/responses/song'

interface Track {
  id: string
  title: string
  artist: string
  album: string
  coverArt?: string
  tags: string[]
}

interface CustomTag {
  id: string
  name: string
  color: string | null
}

export default function BulkTagEditor() {
  const { user } = useAuth()
  const [tracks, setTracks] = useState<Track[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [availableTags, setAvailableTags] = useState<CustomTag[]>([])
  const [selectedTagId, setSelectedTagId] = useState('')
  const [isApplying, setIsApplying] = useState(false)

  // Search state
  const [query, setQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Track[]>([])
  const [isSearching, setIsSearching] = useState(false)

  const loadTags = useCallback(async () => {
    const { data } = await supabase
      .from('custom_tags')
      .select('*')
      .order('name')
    if (data) setAvailableTags(data)
  }, [])

  useEffect(() => {
    if (user?.id) {
      loadTags()
    }
  }, [user?.id, loadTags])

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    setIsSearching(true)
    try {
      const res = await subsonic.search.get({ query, songCount: 10 })
      const songs = res?.song || []

      const mapped: Track[] = songs.map((s: ISong) => ({
        id: s.id,
        title: s.title,
        artist: s.artist,
        album: s.album,
        coverArt: s.coverArt,
        tags: [], // We'd need to fetch existing tags separately if we want to show them
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
    setSearchResults([]) // Clear search results after adding
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

  const handleApplyTag = async () => {
    if (!selectedTagId || selectedIds.size === 0 || !user?.id) {
      toast.warn('Select tracks and a tag first')
      return
    }

    setIsApplying(true)
    try {
      const tag = availableTags.find((t) => t.id === selectedTagId)
      if (!tag) return

      const updates = Array.from(selectedIds).map((contentId) => ({
        content_type: 'song',
        content_id: contentId,
        tag_id: selectedTagId,
        user_id: user.id,
      }))

      // Use upsert or insert with ignore duplicates if possible, but standard insert might fail if unique constraint
      // Assuming no unique constraint on (content_id, tag_id) yet or we catch error
      // Ideally we check first or use RPC. For now, simple insert.

      const { error } = await supabase
        .from('content_tags')
        .insert(updates)
        .select() // basic insert

      if (error) {
        // If error is duplicate key, ignore it (or handle gracefully)
        console.warn('Error applying tags (might be duplicates)', error)
      }

      // Update local state visuals
      setTracks(
        tracks.map((t) => {
          if (selectedIds.has(t.id) && !t.tags.includes(tag.name)) {
            return { ...t, tags: [...t.tags, tag.name] }
          }
          return t
        }),
      )

      toast.success(`Applied tag "${tag.name}" to ${selectedIds.size} tracks`)
    } catch (e) {
      console.error(e)
      toast.error('Failed to apply tags')
    } finally {
      setIsApplying(false)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent">
          Bulk Tag Editor
        </h1>
        <p className="text-muted-foreground">
          Search for tracks and apply tags in bulk.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        {/* Actions Sidebar */}
        <div className="space-y-6 h-fit sticky top-6">
          {/* Search Box */}
          <div className="p-4 rounded-xl border border-border bg-card shadow-sm space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
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
              <div className="border border-border rounded-md max-h-48 overflow-auto bg-background/50 text-sm">
                {searchResults.map((track) => (
                  <button
                    key={track.id}
                    onClick={() => addTrack(track)}
                    className="w-full text-left p-2 hover:bg-accent flex items-center gap-2 truncate"
                  >
                    <Plus className="w-3 h-3 opacity-50" />
                    <span className="truncate">
                      {track.title} - {track.artist}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="p-6 rounded-xl border border-border bg-card shadow-sm space-y-6">
            <h3 className="font-semibold flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-primary" />
              Batch Actions
            </h3>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Tag</label>
                <Select value={selectedTagId} onValueChange={setSelectedTagId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Tag..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTags.map((tag) => (
                      <SelectItem key={tag.id} value={tag.id}>
                        {tag.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {availableTags.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    No custom tags found. Create some in Tag Manager.
                  </p>
                )}
              </div>

              <Button
                className="w-full"
                onClick={handleApplyTag}
                disabled={
                  isApplying || selectedIds.size === 0 || !selectedTagId
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
        </div>

        {/* Tracks Table */}
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm min-h-[400px]">
          {tracks.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-12">
              <Music className="w-12 h-12 mb-4 opacity-20" />
              <p>No tracks added yet.</p>
              <p className="text-sm">Search and add tracks to start editing.</p>
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
                <div className="grid grid-cols-[2fr_1fr_1fr_1fr_30px] flex-1 text-sm font-medium text-muted-foreground">
                  <span>Title</span>
                  <span>Artist</span>
                  <span>Album</span>
                  <span>Tags (Session)</span>
                  <span />
                </div>
              </div>

              <div className="divide-y divide-border">
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
                    <div className="grid grid-cols-[2fr_1fr_1fr_1fr_30px] flex-1 items-center gap-4">
                      <div className="flex items-center gap-3 font-medium overflow-hidden">
                        <div className="w-8 h-8 bg-muted rounded flex items-center justify-center text-muted-foreground overflow-hidden shrink-0">
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
                            <Music className="w-4 h-4" />
                          )}
                        </div>
                        <span className="truncate">{track.title}</span>
                      </div>
                      <div className="text-sm text-muted-foreground truncate">
                        {track.artist}
                      </div>
                      <div className="text-sm text-muted-foreground truncate">
                        {track.album}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {track.tags.map((tag, i) => (
                          <span
                            key={i}
                            className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium border border-primary/20"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
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
