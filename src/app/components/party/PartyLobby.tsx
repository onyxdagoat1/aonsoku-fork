import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import {
  Calendar,
  Music,
  Lock,
  PlayCircle,
  Search,
  Plus,
  Clock,
  Radio,
  Eye,
} from 'lucide-react'
import { Button } from '@/app/components/ui/button'
import { Badge } from '@/app/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog'
import { Input } from '@/app/components/ui/input'
import { Password } from '@/app/components/ui/password'
import { Switch } from '@/app/components/ui/switch'
import { Textarea } from '@/app/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select'
import { useAuth } from '@/contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'

interface Party {
  id: string
  name: string
  description: string
  host_id: string
  host_name: string
  host_avatar?: string
  is_live: boolean
  is_private: boolean
  password?: string
  current_track?: {
    title: string
    artist: string
  }
  attendee_count: number
  max_attendees: number
  genre_tags: string[]
  created_at: string
  scheduled_for?: string
}

export function PartyLobby() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [parties, setParties] = useState<Party[]>([])
  const [filteredParties, setFilteredParties] = useState<Party[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedGenre, setSelectedGenre] = useState('all')
  const [filter, setFilter] = useState<'all' | 'live' | 'scheduled'>('all')
  const [loading, setLoading] = useState(true)
  const [joiningParty, setJoiningParty] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [createStep, setCreateStep] = useState<1 | 2 | 3>(1)
  const [createForm, setCreateForm] = useState({
    name: '',
    description: '',
    isPrivate: false,
    password: '',
    maxAttendees: 50,
    scheduledFor: '',
    primaryGenre: 'all',
    extraTags: '',
  })

  const genres = ['all', 'electronic', 'rock', 'jazz', 'pop', 'hip-hop', 'classical', 'ambient']

  useEffect(() => {
    loadParties()
  }, [])

  useEffect(() => {
    filterParties()
  }, [parties, searchQuery, selectedGenre, filter])

  const loadParties = async () => {
    setLoading(true)
    try {
      const { data: partyRows, error } = await supabase
        .from('parties')
        .select(
          'id,name,description,host_id,is_live,is_private,max_attendees,scheduled_for,genre_tags,created_at,current_track',
        )
        .order('created_at', { ascending: false })

      if (error) throw error

      const hostIds = Array.from(new Set((partyRows || []).map((p: any) => p.host_id)))

      const [{ data: hostProfiles }, { data: memberRows }] = await Promise.all([
        hostIds.length
          ? supabase
              .from('profiles')
              .select('id,username,display_name,avatar_url')
              .in('id', hostIds)
          : Promise.resolve({ data: [] as any[] }),
        (partyRows || []).length
          ? supabase
              .from('party_members')
              .select('party_id')
              .in(
                'party_id',
                (partyRows || []).map((p: any) => p.id),
              )
          : Promise.resolve({ data: [] as any[] }),
      ])

      const hostMap = new Map(
        (hostProfiles || []).map((p: any) => [p.id, p] as const),
      )

      const attendeeCounts = (memberRows || []).reduce((acc: Record<string, number>, r: any) => {
        acc[r.party_id] = (acc[r.party_id] || 0) + 1
        return acc
      }, {})

      const mapped: Party[] = (partyRows || []).map((p: any) => {
        const host = hostMap.get(p.host_id)
        const hostName = host?.display_name || host?.username || 'Unknown'
        const current = p.current_track as any

        return {
          id: p.id,
          name: p.name,
          description: p.description || '',
          host_id: p.host_id,
          host_name: hostName,
          host_avatar: host?.avatar_url || undefined,
          is_live: !!p.is_live,
          is_private: !!p.is_private,
          attendee_count: attendeeCounts[p.id] || 0,
          max_attendees: p.max_attendees,
          genre_tags: (p.genre_tags || []) as string[],
          created_at: p.created_at,
          scheduled_for: p.scheduled_for || undefined,
          current_track:
            current && typeof current === 'object'
              ? {
                  title: current.title || 'Unknown',
                  artist: current.artist || 'Unknown',
                }
              : undefined,
        }
      })

      setParties(mapped)
    } catch (error) {
      console.error('Error loading parties:', error)
      toast.error('Failed to load parties')
    } finally {
      setLoading(false)
    }
  }

  const filterParties = () => {
    let filtered = parties

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(party =>
        party.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        party.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        party.host_name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Filter by genre
    if (selectedGenre !== 'all') {
      filtered = filtered.filter(party =>
        party.genre_tags.includes(selectedGenre)
      )
    }

    // Filter by status
    if (filter === 'live') {
      filtered = filtered.filter(party => party.is_live)
    } else if (filter === 'scheduled') {
      filtered = filtered.filter(party => !party.is_live && party.scheduled_for)
    }

    setFilteredParties(filtered)
  }

  const handleJoinParty = async (party: Party) => {
    setJoiningParty(party.id)
    
    try {
      // Check if party is full
      if (party.attendee_count >= party.max_attendees) {
        toast.error('Party is full')
        return
      }

      let password: string | null = null
      if (party.is_private) {
        password = window.prompt('Enter party password:')
        if (password === null) return
      }

      const { error } = await supabase.rpc('join_party', {
        p_party_id: party.id,
        p_password: password,
      })

      if (error) {
        toast.error(error.message || 'Failed to join party')
        return
      }

      try {
        await supabase.from('social_activity').insert({
          user_id: profile?.id,
          action: 'party_join',
          payload: {
            target_type: 'party',
            party_id: party.id,
            party_name: party.name,
            message: `Joined ${party.name}`,
          },
        })
      } catch {
        // ignore if table/migration not installed yet
      }

      // Join party - navigate to party room
      navigate(`/party/${party.id}`)
      toast.success(`Joined ${party.name}!`)
    } catch (error) {
      console.error('Error joining party:', error)
      toast.error('Failed to join party')
    } finally {
      setJoiningParty(null)
    }
  }

  const handleCreateParty = () => {
    if (!profile?.id) {
      toast.error('You must be logged in to create a party')
      return
    }

    setCreateForm({
      name: '',
      description: '',
      isPrivate: false,
      password: '',
      maxAttendees: 50,
      scheduledFor: '',
      primaryGenre: selectedGenre,
      extraTags: '',
    })
    setCreateStep(1)
    setCreateOpen(true)
  }

  const submitCreateParty = async () => {
    if (!profile?.id) {
      toast.error('You must be logged in to create a party')
      return
    }

    const name = createForm.name.trim()
    if (!name) {
      toast.error('Party name is required')
      return
    }

    if (createForm.isPrivate && createForm.password.trim().length === 0) {
      toast.error('Password required for private parties')
      return
    }

    let scheduledFor: string | null = null
    if (createForm.scheduledFor.trim().length > 0) {
      const d = new Date(createForm.scheduledFor)
      if (Number.isNaN(d.getTime())) {
        toast.error('Invalid scheduled time')
        return
      }
      scheduledFor = d.toISOString()
    }

    const tags = new Set<string>()
    if (createForm.primaryGenre && createForm.primaryGenre !== 'all') {
      tags.add(createForm.primaryGenre)
    }
    for (const t of createForm.extraTags
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)) {
      tags.add(t)
    }

    try {
      const { data, error } = await supabase.rpc('create_party', {
        p_name: name,
        p_description: createForm.description,
        p_is_private: createForm.isPrivate,
        p_password: createForm.isPrivate ? createForm.password : null,
        p_max_attendees: Math.max(1, Number(createForm.maxAttendees) || 50),
        p_scheduled_for: scheduledFor,
        p_genre_tags: Array.from(tags),
      })

      if (error) {
        toast.error(error.message || 'Failed to create party')
        return
      }

      toast.success('Party created!')
      setCreateOpen(false)

      try {
        await supabase.from('social_activity').insert({
          user_id: profile.id,
          action: 'party_create',
          payload: {
            target_type: 'party',
            party_id: data,
            party_name: name,
            message: `Created party ${name}`,
          },
        })
      } catch {
        // ignore if table/migration not installed yet
      }

      await loadParties()

      if (data) {
        navigate(`/party/${data}`)
      }
    } catch (error) {
      console.error('Error creating party:', error)
      toast.error('Failed to create party')
    }
  }

  const PartyCard = ({ party }: { party: Party }) => (
    <div className="bg-card/50 border border-border rounded-xl p-4 hover:border-primary/50 transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-semibold text-foreground">{party.name}</h3>
            {party.is_live && (
              <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-xs">
                <div className="w-2 h-2 rounded-full bg-emerald-400 mr-1 animate-pulse"></div>
                LIVE
              </Badge>
            )}
            {party.is_private && (
              <Badge variant="outline" className="text-xs">
                <Lock className="w-3 h-3 mr-1" />
                Private
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mb-2">{party.description}</p>
          <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
            <span>Host: {party.host_name}</span>
            <span>•</span>
            <span>{party.attendee_count}/{party.max_attendees} listeners</span>
          </div>
          <div className="flex flex-wrap gap-1 mb-3">
            {party.genre_tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
          {party.current_track && (
            <div className="flex items-center gap-2 p-2 bg-black/20 rounded-lg mb-3">
              <Music className="w-4 h-4 text-primary" />
              <span className="text-sm text-foreground truncate">
                Now: {party.current_track.title} - {party.current_track.artist}
              </span>
            </div>
          )}
          {party.scheduled_for && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>
                Starts {new Date(party.scheduled_for).toLocaleDateString()} at{' '}
                {new Date(party.scheduled_for).toLocaleTimeString()}
              </span>
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {party.is_live ? (
          <Button
            size="sm"
            onClick={() => handleJoinParty(party)}
            disabled={joiningParty === party.id || party.attendee_count >= party.max_attendees}
            className="text-xs"
          >
            {joiningParty === party.id ? (
              <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin mr-1" />
            ) : (
              <PlayCircle className="w-3 h-3 mr-1" />
            )}
            {party.attendee_count >= party.max_attendees ? 'Full' : 'Join'}
          </Button>
        ) : (
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleJoinParty(party)}
            className="text-xs"
          >
            <Calendar className="w-3 h-3 mr-1" />
            Schedule
          </Button>
        )}
        <Button size="sm" variant="ghost" className="text-xs">
          <Eye className="w-3 h-3 mr-1" />
          Preview
        </Button>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Dialog
        defaultOpen={false}
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open)
          if (!open) setCreateStep(1)
        }}
      >
        <DialogContent className="max-w-[560px]" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Create Party</DialogTitle>
            <DialogDescription>
              Step {createStep} of 3
            </DialogDescription>
          </DialogHeader>

          {createStep === 1 && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Party name</label>
                <Input
                  value={createForm.name}
                  onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Midnight Premiere"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={createForm.description}
                  onChange={(e) =>
                    setCreateForm((p) => ({ ...p, description: e.target.value }))
                  }
                  placeholder="What are we listening to? Any rules?"
                  className="resize-none"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Max attendees</label>
                  <Input
                    type="number"
                    min={1}
                    max={500}
                    value={createForm.maxAttendees}
                    onChange={(e) =>
                      setCreateForm((p) => ({
                        ...p,
                        maxAttendees: Number(e.target.value),
                      }))
                    }
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Primary genre</label>
                  <Select
                    value={createForm.primaryGenre}
                    onValueChange={(value) =>
                      setCreateForm((p) => ({ ...p, primaryGenre: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a genre" />
                    </SelectTrigger>
                    <SelectContent>
                      {genres.map((g) => (
                        <SelectItem key={g} value={g}>
                          {g === 'all'
                            ? 'Any'
                            : g.charAt(0).toUpperCase() + g.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Extra tags (comma separated)</label>
                <Input
                  value={createForm.extraTags}
                  onChange={(e) =>
                    setCreateForm((p) => ({ ...p, extraTags: e.target.value }))
                  }
                  placeholder="ambient, vinyl, premiere"
                />
              </div>
            </div>
          )}

          {createStep === 2 && (
            <div className="space-y-5">
              <div className="flex items-center justify-between rounded-lg border p-4 bg-accent/40">
                <div>
                  <div className="text-sm font-medium">Private party</div>
                  <div className="text-xs text-muted-foreground">
                    Require a password to join
                  </div>
                </div>
                <Switch
                  checked={createForm.isPrivate}
                  onCheckedChange={(checked) =>
                    setCreateForm((p) => ({ ...p, isPrivate: checked }))
                  }
                />
              </div>

              {createForm.isPrivate && (
                <div>
                  <label className="text-sm font-medium">Password</label>
                  <Password
                    value={createForm.password}
                    onChange={(e) =>
                      setCreateForm((p) => ({ ...p, password: e.target.value }))
                    }
                    placeholder="Set a password"
                  />
                </div>
              )}

              <div>
                <label className="text-sm font-medium">Schedule (optional)</label>
                <Input
                  type="datetime-local"
                  value={createForm.scheduledFor}
                  onChange={(e) =>
                    setCreateForm((p) => ({ ...p, scheduledFor: e.target.value }))
                  }
                />
                <div className="text-xs text-muted-foreground mt-1">
                  Leave empty for a live party starting now.
                </div>
              </div>
            </div>
          )}

          {createStep === 3 && (
            <div className="space-y-4">
              <div className="rounded-lg border p-4 bg-card/50">
                <div className="font-medium">{createForm.name || 'Untitled party'}</div>
                {createForm.description ? (
                  <div className="text-sm text-muted-foreground mt-1">
                    {createForm.description}
                  </div>
                ) : null}
                <div className="text-xs text-muted-foreground mt-3 space-y-1">
                  <div>
                    {createForm.scheduledFor
                      ? `Scheduled: ${createForm.scheduledFor}`
                      : 'Live: starts immediately'}
                  </div>
                  <div>
                    {createForm.isPrivate ? 'Private (password required)' : 'Public'}
                  </div>
                  <div>Max attendees: {createForm.maxAttendees || 50}</div>
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                Press Create to publish the party.
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (createStep === 1) {
                  setCreateOpen(false)
                } else {
                  setCreateStep((s) => (s === 1 ? 1 : ((s - 1) as 1 | 2 | 3)))
                }
              }}
            >
              {createStep === 1 ? 'Cancel' : 'Back'}
            </Button>

            {createStep < 3 ? (
              <Button
                type="button"
                onClick={() => {
                  if (createStep === 1 && createForm.name.trim().length === 0) {
                    toast.error('Party name is required')
                    return
                  }
                  if (createStep === 2 && createForm.isPrivate && createForm.password.trim().length === 0) {
                    toast.error('Password required for private parties')
                    return
                  }
                  setCreateStep((s) => ((s + 1) as 1 | 2 | 3))
                }}
              >
                Next
              </Button>
            ) : (
              <Button type="button" onClick={submitCreateParty}>
                Create
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Header */}
      <div className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 backdrop-blur-xl border-b border-border">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                <Radio className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Party Lobby</h1>
                <p className="text-muted-foreground">Join live listening parties or create your own</p>
              </div>
            </div>
            <Button onClick={handleCreateParty} className="text-sm">
              <Plus className="w-4 h-4 mr-2" />
              Create Party
            </Button>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="container mx-auto px-6 py-6">
        <div className="bg-card/50 border border-border rounded-xl p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search parties..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-black/20 border border-border rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-primary"
              />
            </div>

            {/* Status Filter */}
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={filter === 'all' ? 'default' : 'outline'}
                onClick={() => setFilter('all')}
                className="text-xs"
              >
                All ({parties.length})
              </Button>
              <Button
                size="sm"
                variant={filter === 'live' ? 'default' : 'outline'}
                onClick={() => setFilter('live')}
                className="text-xs"
              >
                Live ({parties.filter(p => p.is_live).length})
              </Button>
              <Button
                size="sm"
                variant={filter === 'scheduled' ? 'default' : 'outline'}
                onClick={() => setFilter('scheduled')}
                className="text-xs"
              >
                Scheduled ({parties.filter(p => !p.is_live && p.scheduled_for).length})
              </Button>
            </div>

            {/* Genre Filter */}
            <select
              value={selectedGenre}
              onChange={(e) => setSelectedGenre(e.target.value)}
              className="bg-black/20 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
            >
              {genres.map((genre) => (
                <option key={genre} value={genre}>
                  {genre === 'all' ? 'All Genres' : genre.charAt(0).toUpperCase() + genre.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Party Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredParties.map((party) => (
            <PartyCard key={party.id} party={party} />
          ))}
        </div>

        {filteredParties.length === 0 && (
          <div className="text-center py-12">
            <Radio className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No parties found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || selectedGenre !== 'all' || filter !== 'all'
                ? 'Try adjusting your filters or search query'
                : 'Be the first to create a party!'}
            </p>
            <Button onClick={handleCreateParty}>
              <Plus className="w-4 h-4 mr-2" />
              Create Party
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
