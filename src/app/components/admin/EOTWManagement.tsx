import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { format, formatDistanceToNow } from 'date-fns'
import {
  Archive,
  ArchiveRestore,
  Calendar,
  Crown,
  Edit,
  Loader2,
  Plus,
  Search,
  Trash2,
  Trophy,
  Vote,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { toast } from 'react-toastify'
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
import { Label } from '@/app/components/ui/label'
import { ScrollArea } from '@/app/components/ui/scroll-area'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/app/components/ui/tabs'
import { Textarea } from '@/app/components/ui/textarea'
import { EOTWNominee, EOTWWeek, eotwService } from '@/service/eotwService'
import { subsonic } from '@/service/subsonic'
import { Albums } from '@/types/responses/album'

export function EOTWManagement() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('current')
  const [showAddNominee, setShowAddNominee] = useState(false)
  const [editingWeek, setEditingWeek] = useState<EOTWWeek | null>(null)
  const [editingNominee, setEditingNominee] = useState<EOTWNominee | null>(null)

  // Fetch current week
  const { data: currentWeek, isLoading } = useQuery({
    queryKey: ['eotw', 'current'],
    queryFn: () => eotwService.getCurrentWeek(),
  })

  // Fetch all weeks
  const { data: allWeeks } = useQuery({
    queryKey: ['eotw', 'all'],
    queryFn: () => eotwService.getAllWeeks(false),
  })

  // Fetch archived weeks
  const { data: archivedWeeks } = useQuery({
    queryKey: ['eotw', 'archived'],
    queryFn: () => eotwService.getArchivedWeeks(50),
  })

  // Fetch nominees for current week
  const { data: nominees } = useQuery({
    queryKey: ['eotw', 'nominees', currentWeek?.id],
    queryFn: () => (currentWeek ? eotwService.getNominees(currentWeek.id) : []),
    enabled: !!currentWeek,
  })

  // Mutations
  const createWeekMutation = useMutation({
    mutationFn: async () => {
      const weekStart = new Date()
      const votingEnds = new Date()
      votingEnds.setDate(votingEnds.getDate() + 7)
      return eotwService.createWeek(weekStart, votingEnds)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['eotw'] })
      toast.success('New EOTW week created!')
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to create week')
    },
  })

  const startVotingMutation = useMutation({
    mutationFn: (weekId: string) => eotwService.startVoting(weekId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['eotw'] })
      toast.success('Voting started!')
    },
  })

  const crownWinnerMutation = useMutation({
    mutationFn: async (nominee: EOTWNominee) => {
      if (!currentWeek) return
      return eotwService.crownWinner(
        currentWeek.id,
        nominee.content_id,
        nominee.content_type,
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['eotw'] })
      toast.success('Winner crowned! 🏆')
    },
  })

  const removeNomineeMutation = useMutation({
    mutationFn: (nomineeId: string) => eotwService.removeNominee(nomineeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['eotw'] })
      toast.success('Nominee removed')
    },
  })

  const archiveWeekMutation = useMutation({
    mutationFn: (weekId: string) => eotwService.archiveWeek(weekId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['eotw'] })
      toast.success('Week archived')
    },
  })

  const unarchiveWeekMutation = useMutation({
    mutationFn: (weekId: string) => eotwService.unarchiveWeek(weekId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['eotw'] })
      toast.success('Week restored')
    },
  })

  const deleteWeekMutation = useMutation({
    mutationFn: (weekId: string) => eotwService.deleteWeek(weekId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['eotw'] })
      toast.success('Week deleted')
    },
    onError: () => toast.error('Failed to delete week'),
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Trophy className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-bold">Edit of the Week</h2>
        </div>
        {!currentWeek && (
          <Button
            onClick={() => createWeekMutation.mutate()}
            disabled={createWeekMutation.isPending}
            size="sm"
          >
            {createWeekMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Plus className="w-4 h-4 mr-2" />
            )}
            Create New Week
          </Button>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="current">Current Week</TabsTrigger>
          <TabsTrigger value="past">Past Weeks</TabsTrigger>
          <TabsTrigger value="archived">Archived</TabsTrigger>
        </TabsList>

        {/* Current Week Tab */}
        <TabsContent value="current" className="space-y-4 mt-4">
          {currentWeek ? (
            <WeekCard
              week={currentWeek}
              nominees={nominees || []}
              onEdit={() => setEditingWeek(currentWeek)}
              onStartVoting={() => startVotingMutation.mutate(currentWeek.id)}
              onCrownWinner={(nominee) => crownWinnerMutation.mutate(nominee)}
              onRemoveNominee={(id) => removeNomineeMutation.mutate(id)}
              onEditNominee={setEditingNominee}
              onAddNominee={() => setShowAddNominee(true)}
              onArchive={() => archiveWeekMutation.mutate(currentWeek.id)}
              isStartingVoting={startVotingMutation.isPending}
            />
          ) : (
            <div className="text-center py-12 text-muted-foreground bg-card/30 rounded-xl border border-dashed border-white/10">
              <p>
                No active EOTW week. Create one to start accepting nominations.
              </p>
            </div>
          )}
        </TabsContent>

        {/* Past Weeks Tab */}
        <TabsContent value="past" className="space-y-3 mt-4">
          <ScrollArea className="h-[600px] pr-4">
            {allWeeks && allWeeks.length > 0 ? (
              allWeeks.map((week) => (
                <PastWeekCard
                  key={week.id}
                  week={week}
                  onEdit={() => setEditingWeek(week)}
                  onArchive={() => archiveWeekMutation.mutate(week.id)}
                  onDelete={() => {
                    if (
                      confirm(
                        'Permanently delete this week? This cannot be undone.',
                      )
                    ) {
                      deleteWeekMutation.mutate(week.id)
                    }
                  }}
                />
              ))
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                No past weeks yet
              </div>
            )}
          </ScrollArea>
        </TabsContent>

        {/* Archived Tab */}
        <TabsContent value="archived" className="space-y-3 mt-4">
          <ScrollArea className="h-[600px] pr-4">
            {archivedWeeks && archivedWeeks.length > 0 ? (
              archivedWeeks.map((week) => (
                <ArchivedWeekCard
                  key={week.id}
                  week={week}
                  onRestore={() => unarchiveWeekMutation.mutate(week.id)}
                  onDelete={() => {
                    if (
                      confirm(
                        'Permanently delete this week? This cannot be undone.',
                      )
                    ) {
                      deleteWeekMutation.mutate(week.id)
                    }
                  }}
                />
              ))
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                No archived weeks
              </div>
            )}
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <Dialog open={showAddNominee} onOpenChange={setShowAddNominee}>
        <DialogContent>
          <AddNomineeDialog
            weekId={currentWeek?.id || ''}
            onSuccess={() => {
              setShowAddNominee(false)
              queryClient.invalidateQueries({ queryKey: ['eotw'] })
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingWeek} onOpenChange={() => setEditingWeek(null)}>
        <DialogContent>
          {editingWeek && (
            <EditWeekDialog
              week={editingWeek}
              onSuccess={() => {
                setEditingWeek(null)
                queryClient.invalidateQueries({ queryKey: ['eotw'] })
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!editingNominee}
        onOpenChange={() => setEditingNominee(null)}
      >
        <DialogContent>
          {editingNominee && (
            <EditNomineeDialog
              nominee={editingNominee}
              onSuccess={() => {
                setEditingNominee(null)
                queryClient.invalidateQueries({ queryKey: ['eotw'] })
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Week Card Component
function WeekCard({
  week,
  nominees,
  onEdit,
  onStartVoting,
  onCrownWinner,
  onRemoveNominee,
  onEditNominee,
  onAddNominee,
  onArchive,
  isStartingVoting,
}: {
  week: EOTWWeek
  nominees: EOTWNominee[]
  onEdit: () => void
  onStartVoting: () => void
  onCrownWinner: (nominee: EOTWNominee) => void
  onRemoveNominee: (id: string) => void
  onEditNominee: (nominee: EOTWNominee) => void
  onAddNominee: () => void
  onArchive: () => void
  isStartingVoting: boolean
}) {
  return (
    <div className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-xl p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Week of {format(new Date(week.week_start), 'MMM d, yyyy')}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Status:{' '}
            <span
              className={
                week.status === 'voting'
                  ? 'text-green-400'
                  : week.status === 'completed'
                    ? 'text-amber-400'
                    : 'text-blue-400'
              }
            >
              {week.status.charAt(0).toUpperCase() + week.status.slice(1)}
            </span>
          </p>
          <p className="text-xs text-muted-foreground">
            Voting ends:{' '}
            {formatDistanceToNow(new Date(week.voting_ends_at), {
              addSuffix: true,
            })}
          </p>
          {week.description && (
            <p className="text-sm text-muted-foreground mt-2 italic">
              "{week.description}"
            </p>
          )}
          {week.credits && (
            <p className="text-xs text-muted-foreground mt-1">
              Credits: {week.credits}
            </p>
          )}
        </div>

        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={onEdit}>
            <Edit className="w-4 h-4" />
          </Button>
          {week.status === 'completed' && (
            <Button variant="ghost" size="sm" onClick={onArchive}>
              <Archive className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      {week.status === 'nominations' && (
        <div className="flex gap-2 mb-3">
          <Button variant="outline" size="sm" onClick={onAddNominee}>
            <Plus className="w-4 h-4 mr-2" />
            Add Nominee
          </Button>
          <Button
            onClick={onStartVoting}
            disabled={!nominees.length || isStartingVoting}
            size="sm"
          >
            <Vote className="w-4 h-4 mr-2" />
            Start Voting
          </Button>
        </div>
      )}

      {/* Nominees */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-muted-foreground">
          Nominees ({nominees.length})
        </h4>
        {nominees.length > 0 ? (
          <div className="grid grid-cols-1 gap-2">
            {nominees.map((nominee) => (
              <NomineeCard
                key={nominee.id}
                nominee={nominee}
                canEdit={week.status === 'nominations'}
                canCrown={week.status === 'voting'}
                onRemove={() => onRemoveNominee(nominee.id)}
                onEdit={() => onEditNominee(nominee)}
                onCrown={() => onCrownWinner(nominee)}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No nominees yet. Add some to get started!
          </p>
        )}
      </div>
    </div>
  )
}

// Nominee Card Component
function NomineeCard({
  nominee,
  canEdit,
  canCrown,
  onRemove,
  onEdit,
  onCrown,
}: {
  nominee: EOTWNominee
  canEdit: boolean
  canCrown: boolean
  onRemove: () => void
  onEdit: () => void
  onCrown: () => void
}) {
  return (
    <div className="flex items-center gap-3 p-3 bg-black/30 rounded-lg border border-white/5 hover:border-white/10 transition-colors">
      <img
        src={getCoverArtUrl(nominee.content_cover || '', 'album', '100')}
        alt={nominee.content_name || ''}
        className="w-12 h-12 rounded object-cover"
      />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{nominee.content_name}</p>
        <p className="text-xs text-muted-foreground truncate">
          {nominee.content_artist}
        </p>
        {nominee.vote_count !== undefined && (
          <p className="text-xs text-primary mt-1">
            {nominee.vote_count} votes
          </p>
        )}
        {nominee.credits && (
          <p className="text-xs text-muted-foreground italic mt-1">
            Credits: {nominee.credits}
          </p>
        )}
      </div>
      <div className="flex gap-1">
        {canEdit && (
          <>
            <Button variant="ghost" size="sm" onClick={onEdit}>
              <Edit className="w-3 h-3" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onRemove}>
              <Trash2 className="w-3 h-3 text-destructive" />
            </Button>
          </>
        )}
        {canCrown && (
          <Button variant="outline" size="sm" onClick={onCrown}>
            <Crown className="w-3 h-3 mr-1" />
            Crown
          </Button>
        )}
      </div>
    </div>
  )
}

// Past Week Card Component
function PastWeekCard({
  week,
  onEdit,
  onArchive,
  onDelete,
}: {
  week: EOTWWeek
  onEdit: () => void
  onArchive: () => void
  onDelete: () => void
}) {
  return (
    <div className="mb-3 p-3 bg-black/20 rounded-lg border border-white/5 hover:border-white/10 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="font-medium">
            {format(new Date(week.week_start), 'MMM d, yyyy')}
          </p>
          <p className="text-xs text-muted-foreground">
            Status: {week.status} •{' '}
            {week.winner_content_id ? 'Winner crowned' : 'No winner'}
          </p>
          {week.description && (
            <p className="text-xs text-muted-foreground mt-1 italic">
              "{week.description}"
            </p>
          )}
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={onEdit}>
            <Edit className="w-3 h-3" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onArchive}>
            <Archive className="w-3 h-3" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onDelete}>
            <Trash2 className="w-3 h-3 text-destructive" />
          </Button>
        </div>
      </div>
    </div>
  )
}

// Archived Week Card Component
function ArchivedWeekCard({
  week,
  onRestore,
  onDelete,
}: {
  week: EOTWWeek
  onRestore: () => void
  onDelete: () => void
}) {
  return (
    <div className="mb-3 p-3 bg-black/10 rounded-lg border border-white/5">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="font-medium text-muted-foreground">
            {format(new Date(week.week_start), 'MMM d, yyyy')}
          </p>
          <p className="text-xs text-muted-foreground">Archived</p>
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={onRestore}>
            <ArchiveRestore className="w-3 h-3" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onDelete}>
            <Trash2 className="w-3 h-3 text-destructive" />
          </Button>
        </div>
      </div>
    </div>
  )
}

// Edit Week Dialog
function EditWeekDialog({
  week,
  onSuccess,
}: {
  week: EOTWWeek
  onSuccess: () => void
}) {
  const [weekStart, setWeekStart] = useState(week.week_start)
  const [votingEnds, setVotingEnds] = useState(
    week.voting_ends_at.split('T')[0] +
      'T' +
      week.voting_ends_at.split('T')[1].substring(0, 5),
  )
  const [description, setDescription] = useState(week.description || '')
  const [credits, setCredits] = useState(week.credits || '')

  const updateMutation = useMutation({
    mutationFn: async () => {
      await eotwService.updateWeek(week.id, {
        week_start: new Date(weekStart),
        voting_ends_at: new Date(votingEnds),
        description,
        credits,
      })
    },
    onSuccess: () => {
      toast.success('Week updated!')
      onSuccess()
    },
    onError: () => toast.error('Failed to update week'),
  })

  return (
    <>
      <DialogHeader>
        <DialogTitle>Edit Week</DialogTitle>
      </DialogHeader>
      <div className="space-y-4 pt-4">
        <div>
          <Label>Week Start Date</Label>
          <Input
            type="date"
            value={weekStart}
            onChange={(e) => setWeekStart(e.target.value)}
          />
        </div>
        <div>
          <Label>Voting Ends At</Label>
          <Input
            type="datetime-local"
            value={votingEnds}
            onChange={(e) => setVotingEnds(e.target.value)}
          />
        </div>
        <div>
          <Label>Description / Theme</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional week theme or description"
            rows={3}
          />
        </div>
        <div>
          <Label>Credits</Label>
          <Input
            value={credits}
            onChange={(e) => setCredits(e.target.value)}
            placeholder="Optional credits (e.g., curator name)"
          />
        </div>
        <Button
          onClick={() => updateMutation.mutate()}
          disabled={updateMutation.isPending}
          className="w-full"
        >
          {updateMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : null}
          Save Changes
        </Button>
      </div>
    </>
  )
}

// Edit Nominee Dialog
function EditNomineeDialog({
  nominee,
  onSuccess,
}: {
  nominee: EOTWNominee
  onSuccess: () => void
}) {
  const [description, setDescription] = useState(nominee.description || '')
  const [credits, setCredits] = useState(nominee.credits || '')

  const updateMutation = useMutation({
    mutationFn: async () => {
      await eotwService.updateNominee(nominee.id, {
        description,
        credits,
      })
    },
    onSuccess: () => {
      toast.success('Nominee updated!')
      onSuccess()
    },
    onError: () => toast.error('Failed to update nominee'),
  })

  return (
    <>
      <DialogHeader>
        <DialogTitle>Edit Nominee</DialogTitle>
      </DialogHeader>
      <div className="space-y-4 pt-4">
        <div className="flex items-center gap-3 p-3 bg-black/20 rounded-lg">
          <img
            src={getCoverArtUrl(nominee.content_cover || '', 'album', '100')}
            alt={nominee.content_name || ''}
            className="w-12 h-12 rounded object-cover"
          />
          <div>
            <p className="font-medium text-sm">{nominee.content_name}</p>
            <p className="text-xs text-muted-foreground">
              {nominee.content_artist}
            </p>
          </div>
        </div>
        <div>
          <Label>Description</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional description"
            rows={3}
          />
        </div>
        <div>
          <Label>Credits</Label>
          <Input
            value={credits}
            onChange={(e) => setCredits(e.target.value)}
            placeholder="Optional credits (e.g., editor name)"
          />
        </div>
        <Button
          onClick={() => updateMutation.mutate()}
          disabled={updateMutation.isPending}
          className="w-full"
        >
          {updateMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : null}
          Save Changes
        </Button>
      </div>
    </>
  )
}

// Add Nominee Dialog (keeping existing implementation)
function AddNomineeDialog({
  weekId,
  onSuccess,
}: {
  weekId: string
  onSuccess: () => void
}) {
  const [search, setSearch] = useState('')
  const [debouncedSearch] = useDebounce(search, 500)
  const [selectedAlbum, setSelectedAlbum] = useState<Albums | null>(null)

  const { data: searchResults, isLoading: isSearching } = useQuery({
    queryKey: ['album-search', debouncedSearch],
    queryFn: async () => {
      if (!debouncedSearch) return []
      const results = await subsonic.search.search3(debouncedSearch)
      return results?.album || []
    },
    enabled: debouncedSearch.length > 0,
  })

  const addNomineeMutation = useMutation({
    mutationFn: async (album: Albums) => {
      await eotwService.addNominee(
        weekId,
        album.id,
        'album',
        album.name,
        album.artist,
        album.coverArt,
      )
    },
    onSuccess: () => {
      toast.success('Nominee added!')
      onSuccess()
    },
    onError: () => toast.error('Failed to add nominee'),
  })

  return (
    <>
      <DialogHeader>
        <DialogTitle>Add Nominee</DialogTitle>
      </DialogHeader>
      <div className="space-y-4 pt-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search for an album..."
            className="pl-10"
          />
        </div>

        <ScrollArea className="h-[400px]">
          {isSearching ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : searchResults && searchResults.length > 0 ? (
            <div className="space-y-2">
              {searchResults.map((album) => (
                <button
                  key={album.id}
                  onClick={() => setSelectedAlbum(album)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                    selectedAlbum?.id === album.id
                      ? 'bg-primary/20 border-primary'
                      : 'bg-black/20 border-white/5 hover:border-white/10'
                  }`}
                >
                  <img
                    src={getCoverArtUrl(album.coverArt, 'album', '100')}
                    alt={album.name}
                    className="w-12 h-12 rounded object-cover"
                  />
                  <div className="flex-1 text-left">
                    <p className="font-medium text-sm">{album.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {album.artist}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          ) : debouncedSearch ? (
            <p className="text-center text-muted-foreground py-8">
              No results found
            </p>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              Start typing to search for albums
            </p>
          )}
        </ScrollArea>

        <Button
          onClick={() =>
            selectedAlbum && addNomineeMutation.mutate(selectedAlbum)
          }
          disabled={!selectedAlbum || addNomineeMutation.isPending}
          className="w-full"
        >
          {addNomineeMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : null}
          Add Nominee
        </Button>
      </div>
    </>
  )
}
