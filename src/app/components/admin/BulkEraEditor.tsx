import { Disc, Edit3, Music, Plus, Search, Tag, X } from 'lucide-react'
import { useState } from 'react'
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
import { ERAS } from '@/config/eras'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'
import { eraService } from '@/service/eraService'
import { subsonic } from '@/service/subsonic'
import { AITag, EditType, tagService } from '@/service/tagService'
import { ISong } from '@/types/responses/song'

// Edit type options for tagging
const EDIT_TYPES = [
  { id: 'highlight', label: 'Highlight', color: '#f59e0b' },
  { id: 'unique', label: 'Unique', color: '#8b5cf6' },
  { id: 'vanilla', label: 'Vanilla', color: '#6b7280' },
  { id: 'overhaul', label: 'Overhaul', color: '#ef4444' },
  { id: 'renovation', label: 'Renovation', color: '#3b82f6' },
  { id: 'extension', label: 'Extension', color: '#10b981' },
  { id: 'remix', label: 'Remix', color: '#ec4899' },
] as const

interface Entity {
  id: string
  title: string
  artist: string
  album?: string
  coverArt?: string
  era?: string
  type: 'song' | 'album'
}

export function BulkEraEditor() {
  const { user } = useAuth()
  const [entities, setEntities] = useState<Entity[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [selectedEraId, setSelectedEraId] = useState('')
  const [isApplying, setIsApplying] = useState(false)

  const [query, setQuery] = useState('')
  const [searchType, setSearchType] = useState<'song' | 'album'>('song')
  const [searchResults, setSearchResults] = useState<Entity[]>([])
  const [isSearching, setIsSearching] = useState(false)

  // AI and Edit Type tagging
  const [selectedAITag, setSelectedAITag] = useState<'none' | 'ai' | 'human'>(
    'none',
  )
  const [selectedEditType, setSelectedEditType] = useState('none')

  // Selected search results for batch add
  const [selectedSearchIds, setSelectedSearchIds] = useState<Set<string>>(
    new Set(),
  )

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    setIsSearching(true)
    try {
      let mapped: Entity[] = []

      if (searchType === 'song') {
        const res = await subsonic.search.get({ query, songCount: 20 })
        const songs = res?.song || []
        mapped = songs.map((s: ISong) => ({
          id: s.id,
          title: s.title,
          artist: s.artist,
          album: s.album,
          coverArt: s.coverArt,
          era: undefined,
          type: 'song',
        }))
      } else {
        // Search albums
        const res = await subsonic.search.get({ query, albumCount: 20 })
        const albums = res?.album || []
        mapped = albums.map((a) => ({
          id: a.id,
          title: a.name,
          artist: a.artist,
          coverArt: a.coverArt,
          era: undefined,
          type: 'album',
        }))
      }

      setSearchResults(mapped)
    } catch (error) {
      console.error('Search failed', error)
      toast.error('Search failed')
    } finally {
      setIsSearching(false)
    }
  }

  const addEntity = (entity: Entity) => {
    if (entities.find((e) => e.id === entity.id)) return
    setEntities((prev) => [...prev, entity])
  }

  const addSelectedSearchResults = () => {
    const toAdd = searchResults.filter(
      (item) =>
        selectedSearchIds.has(item.id) &&
        !entities.find((e) => e.id === item.id),
    )
    if (toAdd.length > 0) {
      setEntities((prev) => [...prev, ...toAdd])
      toast.success(`Added ${toAdd.length} item${toAdd.length > 1 ? 's' : ''}`)
    }
    setSelectedSearchIds(new Set())
    setSearchResults([])
  }

  const toggleSearchResult = (id: string) => {
    setSelectedSearchIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const toggleAllSearchResults = () => {
    if (selectedSearchIds.size === searchResults.length) {
      setSelectedSearchIds(new Set())
    } else {
      setSelectedSearchIds(new Set(searchResults.map((r) => r.id)))
    }
  }

  const removeEntity = (id: string) => {
    setEntities((prev) => prev.filter((e) => e.id !== id))
    selectedIds.delete(id)
    setSelectedIds(new Set(selectedIds))
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === entities.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(entities.map((e) => e.id)))
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
    if (selectedIds.size === 0 || !user?.id) {
      toast.warn('Select items first')
      return
    }

    // Check if at least one thing is being applied
    if (
      !selectedEraId &&
      selectedAITag === 'none' &&
      selectedEditType === 'none'
    ) {
      toast.warn('Select an era, AI tag, or edit type to apply')
      return
    }

    setIsApplying(true)
    try {
      const era = selectedEraId
        ? ERAS.find((e) => e.id === selectedEraId)
        : null

      // Get selected entities
      const selectedEntities = entities.filter((e) => selectedIds.has(e.id))

      // Apply era to each selected entity (if era selected)
      if (selectedEraId && era) {
        await Promise.all(
          selectedEntities.map((entity) =>
            eraService.setEra(entity.id, entity.type, selectedEraId),
          ),
        )
      }

      // Apply AI/Edit Type tags (if either is selected)
      if (selectedAITag !== 'none' || selectedEditType !== 'none') {
        await tagService.setTagsBatch(
          selectedEntities.map((entity) => ({
            contentId: entity.id,
            contentType: entity.type,
            aiTag:
              selectedAITag !== 'none' ? (selectedAITag as AITag) : undefined,
            editType:
              selectedEditType !== 'none'
                ? (selectedEditType as EditType)
                : undefined,
          })),
        )
      }

      // Update local state
      setEntities(
        entities.map((e) => {
          if (selectedIds.has(e.id)) {
            return { ...e, era: era?.label || e.era }
          }
          return e
        }),
      )

      // Build success message
      const parts = []
      if (era) parts.push(`era "${era.label}"`)
      if (selectedAITag !== 'none') parts.push(`AI tag "${selectedAITag}"`)
      if (selectedEditType !== 'none')
        parts.push(`edit type "${selectedEditType}"`)

      toast.success(`Applied ${parts.join(', ')} to ${selectedIds.size} items`)
      setSelectedIds(new Set())
    } catch (e) {
      console.error(e)
      toast.error('Failed to apply tags')
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
          Search for songs or comps and assign era tags in bulk
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        {/* Actions Sidebar */}
        <div className="space-y-4">
          {/* Search Box */}
          <div className="p-4 rounded-xl border border-border bg-card shadow-sm space-y-4">
            <h3 className="font-semibold flex items-center gap-2 text-sm">
              <Search className="w-4 h-4" /> Add Items
            </h3>

            <div className="flex bg-muted p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setSearchType('song')}
                className={cn(
                  'flex-1 text-xs font-medium py-1.5 px-3 rounded-md transition-all',
                  searchType === 'song'
                    ? 'bg-background shadow-sm text-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                Songs
              </button>
              <button
                type="button"
                onClick={() => setSearchType('album')}
                className={cn(
                  'flex-1 text-xs font-medium py-1.5 px-3 rounded-md transition-all',
                  searchType === 'album'
                    ? 'bg-background shadow-sm text-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                Comps
              </button>
            </div>

            <form onSubmit={handleSearch} className="flex gap-2">
              <Input
                placeholder={`Search ${searchType === 'song' ? 'songs' : 'comps'}...`}
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
              <div className="border border-border rounded-md bg-background/50 text-sm">
                <div className="flex items-center justify-between p-2 border-b border-border bg-muted/50">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={
                        selectedSearchIds.size === searchResults.length &&
                        searchResults.length > 0
                      }
                      onCheckedChange={toggleAllSearchResults}
                    />
                    <span className="text-xs font-medium">
                      Select All ({searchResults.length})
                    </span>
                  </label>
                  <Button
                    size="sm"
                    onClick={addSelectedSearchResults}
                    disabled={selectedSearchIds.size === 0}
                    className="h-7 text-xs"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Add ({selectedSearchIds.size})
                  </Button>
                </div>
                <div className="max-h-48 overflow-auto">
                  {searchResults.map((item) => (
                    <label
                      key={item.id}
                      className="w-full p-2 hover:bg-accent flex items-center gap-2 cursor-pointer border-b border-border/50 last:border-0"
                    >
                      <Checkbox
                        checked={selectedSearchIds.has(item.id)}
                        onCheckedChange={() => toggleSearchResult(item.id)}
                      />
                      <span className="truncate flex-1">
                        {item.title}
                        <span className="text-muted-foreground ml-1">
                          - {item.artist}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
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
                  <SelectContent className="max-h-[300px]">
                    {ERAS.map((era) => (
                      <SelectItem key={era.id} value={era.id}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: era.color }}
                          />
                          {era.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">AI Tag</label>
                <Select
                  value={selectedAITag}
                  onValueChange={(v) =>
                    setSelectedAITag(v as 'none' | 'ai' | 'human')
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Set AI Tag..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None (Don't Change)</SelectItem>
                    <SelectItem value="human">Human</SelectItem>
                    <SelectItem value="ai">AI</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Edit Type</label>
                <Select
                  value={selectedEditType}
                  onValueChange={setSelectedEditType}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Set Edit Type..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None (Don't Change)</SelectItem>
                    {EDIT_TYPES.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: type.color }}
                          />
                          {type.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
          {entities.length > 0 && (
            <div className="p-4 rounded-xl border border-border bg-card/50 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Items:</span>
                <span className="font-semibold">{entities.length}</span>
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
          {entities.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-12">
              <Music className="w-16 h-16 mb-4 opacity-20" />
              <p className="font-medium">No items added yet</p>
              <p className="text-sm">
                Search and add songs or comps to start tagging
              </p>
            </div>
          ) : (
            <>
              <div className="p-4 border-b border-border flex items-center gap-4 bg-muted/30">
                <Checkbox
                  checked={
                    selectedIds.size === entities.length && entities.length > 0
                  }
                  onCheckedChange={toggleSelectAll}
                />
                <div className="grid grid-cols-[2fr_1.5fr_1.5fr_100px_30px] flex-1 text-sm font-medium text-muted-foreground">
                  <span>Title</span>
                  <span>Artist</span>
                  <span>Type</span>
                  <span>Era</span>
                  <span />
                </div>
              </div>

              <div className="divide-y divide-border max-h-[600px] overflow-y-auto">
                {entities.map((entity) => (
                  <div
                    key={entity.id}
                    className={cn(
                      'flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors cursor-pointer',
                      selectedIds.has(entity.id) && 'bg-primary/5',
                    )}
                    onClick={() => toggleSelect(entity.id)}
                  >
                    <Checkbox
                      checked={selectedIds.has(entity.id)}
                      onCheckedChange={() => toggleSelect(entity.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="grid grid-cols-[2fr_1.5fr_1.5fr_100px_30px] flex-1 items-center gap-4">
                      <div className="flex items-center gap-3 font-medium overflow-hidden">
                        <div className="w-10 h-10 bg-muted rounded flex items-center justify-center text-muted-foreground overflow-hidden shrink-0 relative">
                          {entity.coverArt ? (
                            <img
                              src={getCoverArtUrl(
                                entity.coverArt,
                                entity.type === 'album' ? 'album' : 'song',
                                '100',
                              )}
                              alt={entity.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Music className="w-5 h-5" />
                          )}
                          {entity.type === 'album' && (
                            <div className="absolute bottom-0 right-0 p-0.5 bg-black/60 rounded-tl-md">
                              <Disc className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </div>
                        <span className="truncate text-sm">{entity.title}</span>
                      </div>
                      <div className="text-sm text-muted-foreground truncate">
                        {entity.artist}
                      </div>
                      <div className="text-sm text-muted-foreground truncate capitalize">
                        {entity.type === 'album' ? 'Comp' : 'Song'}
                      </div>
                      <div>
                        {entity.era && (
                          <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium border border-primary/20 whitespace-nowrap">
                            {entity.era}
                          </span>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={(e) => {
                          e.stopPropagation()
                          removeEntity(entity.id)
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
