import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { format, formatDistanceToNow } from 'date-fns'
import { Crown, Loader2, Trophy, Vote } from 'lucide-react'
import { Link } from 'react-router-dom'
import { toast } from 'react-toastify'
import { getCoverArtUrl } from '@/api/httpClient'
import { Button } from '@/app/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import { ROUTES } from '@/routes/routesList'
import {
  EOTWNominee,
  EOTWWeekWithResults,
  eotwService,
} from '@/service/eotwService'

export default function EOTWPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  // Fetch current week
  const { data: currentWeek, isLoading: isLoadingCurrent } = useQuery({
    queryKey: ['eotw', 'current'],
    queryFn: () => eotwService.getCurrentWeek(),
  })

  // Fetch nominees for current week
  const { data: nominees } = useQuery({
    queryKey: ['eotw', 'nominees', currentWeek?.id],
    queryFn: () => (currentWeek ? eotwService.getNominees(currentWeek.id) : []),
    enabled: !!currentWeek,
  })

  // Fetch user's vote
  const { data: userVote } = useQuery({
    queryKey: ['eotw', 'user-vote', currentWeek?.id],
    queryFn: () =>
      currentWeek ? eotwService.getUserVote(currentWeek.id) : null,
    enabled: !!currentWeek && !!user,
  })

  // Fetch past weeks
  const { data: pastWeeks, isLoading: isLoadingPast } = useQuery({
    queryKey: ['eotw', 'past'],
    queryFn: () => eotwService.getPastWeeks(10),
  })

  // Vote mutation
  const voteMutation = useMutation({
    mutationFn: (nomineeId: string) => eotwService.vote(nomineeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['eotw'] })
      toast.success('Vote submitted! 🗳️')
    },
    onError: () => toast.error('Failed to vote'),
  })

  if (isLoadingCurrent) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4 space-y-12">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-3 mb-4">
          <Trophy className="w-10 h-10 text-amber-400" />
          <h1 className="text-4xl font-bold">Edit of the Week</h1>
        </div>
        <p className="text-muted-foreground text-lg">
          Vote for the best edit each week!
        </p>
      </div>

      {/* Current Week Voting */}
      {currentWeek && currentWeek.status === 'voting' && (
        <div className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Vote className="w-6 h-6 text-green-400" />
                Vote Now!
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Voting ends{' '}
                {formatDistanceToNow(new Date(currentWeek.voting_ends_at), {
                  addSuffix: true,
                })}
              </p>
              {currentWeek.description && (
                <p className="text-sm text-muted-foreground mt-2 italic">
                  "{currentWeek.description}"
                </p>
              )}
              {currentWeek.credits && (
                <p className="text-xs text-muted-foreground mt-1">
                  Curated by {currentWeek.credits}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {nominees?.map((nominee) => (
              <NomineeCard
                key={nominee.id}
                nominee={nominee}
                isVoted={userVote === nominee.id}
                onVote={() => voteMutation.mutate(nominee.id)}
                isVoting={voteMutation.isPending}
                canVote={!!user && !userVote}
              />
            ))}
          </div>

          {!user && (
            <p className="text-center text-muted-foreground mt-6">
              <Link to={ROUTES.AUTH.LOGIN} className="text-primary underline">
                Sign in
              </Link>{' '}
              to vote!
            </p>
          )}
        </div>
      )}

      {/* No Active Week */}
      {!currentWeek && (
        <div className="text-center py-12 text-muted-foreground">
          No active voting this week. Check back later!
        </div>
      )}

      {/* Past Winners */}
      <div>
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Crown className="w-6 h-6 text-amber-400" />
          Past Winners
        </h2>

        {isLoadingPast ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : pastWeeks?.length ? (
          <div className="space-y-8">
            {pastWeeks.map((week) => (
              <PodiumDisplay key={week.id} week={week} />
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8">
            No past winners yet
          </p>
        )}
      </div>
    </div>
  )
}

// Nominee Card for voting
function NomineeCard({
  nominee,
  isVoted,
  onVote,
  isVoting,
  canVote,
}: {
  nominee: EOTWNominee
  isVoted: boolean
  onVote: () => void
  isVoting: boolean
  canVote: boolean
}) {
  return (
    <div
      className={`relative p-4 rounded-xl border transition-all ${
        isVoted
          ? 'bg-primary/10 border-primary'
          : 'bg-white/5 border-white/10 hover:bg-white/10'
      }`}
    >
      <div className="flex items-center gap-4">
        <Link to={ROUTES.ALBUM.PAGE(nominee.content_id)}>
          <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
            {nominee.content_cover && (
              <img
                src={getCoverArtUrl(nominee.content_cover, 'album', '200')}
                alt={nominee.content_name || ''}
                className="w-full h-full object-cover"
              />
            )}
          </div>
        </Link>
        <div className="flex-1 min-w-0">
          <Link
            to={ROUTES.ALBUM.PAGE(nominee.content_id)}
            className="font-bold text-lg hover:underline truncate block"
          >
            {nominee.content_name || nominee.content_id}
          </Link>
          <p className="text-sm text-muted-foreground truncate">
            {nominee.content_artist}
          </p>
          {nominee.description && (
            <p className="text-xs text-muted-foreground italic mt-1 line-clamp-2">
              {nominee.description}
            </p>
          )}
          {nominee.credits && (
            <p className="text-xs text-muted-foreground mt-1">
              Edit by {nominee.credits}
            </p>
          )}
          <p className="text-sm text-primary mt-1">
            {nominee.vote_count || 0} votes
          </p>
        </div>
        <Button
          onClick={onVote}
          disabled={!canVote || isVoting}
          variant={isVoted ? 'default' : 'outline'}
          className="flex-shrink-0"
        >
          {isVoted ? '✓ Voted' : 'Vote'}
        </Button>
      </div>
    </div>
  )
}

// Podium display for past winners
function PodiumDisplay({ week }: { week: EOTWWeekWithResults }) {
  const { winner, runnerUps = [] } = week

  if (!winner) return null

  return (
    <div className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
      <div className="text-center mb-6">
        <p className="text-sm text-muted-foreground">
          Week of {format(new Date(week.week_start), 'MMMM d, yyyy')}
        </p>
        {week.description && (
          <p className="text-sm text-muted-foreground italic mt-1">
            "{week.description}"
          </p>
        )}
        {week.credits && (
          <p className="text-xs text-muted-foreground mt-1">
            Curated by {week.credits}
          </p>
        )}
      </div>

      {/* Podium */}
      <div className="flex items-end justify-center gap-4">
        {/* 2nd Place */}
        {runnerUps[0] && (
          <div className="text-center flex-1 max-w-[140px]">
            <Link to={ROUTES.ALBUM.PAGE(runnerUps[0].content_id)}>
              <div className="w-24 h-24 mx-auto rounded-lg overflow-hidden border-2 border-zinc-400 bg-muted">
                {runnerUps[0].content_cover && (
                  <img
                    src={getCoverArtUrl(
                      runnerUps[0].content_cover,
                      'album',
                      '200',
                    )}
                    alt={runnerUps[0].content_name || ''}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
            </Link>
            <div className="mt-2 bg-zinc-400 text-white text-xs font-bold py-1 rounded">
              2nd
            </div>
            <p className="text-xs font-medium mt-2 truncate">
              {runnerUps[0].content_name}
            </p>
          </div>
        )}

        {/* 1st Place (Winner) */}
        <div className="text-center flex-1 max-w-[180px]">
          <Link to={ROUTES.ALBUM.PAGE(winner.content_id)}>
            <div className="relative">
              <Crown className="absolute -top-6 left-1/2 -translate-x-1/2 w-8 h-8 text-amber-400 z-10" />
              <div className="w-32 h-32 mx-auto rounded-xl overflow-hidden border-4 border-amber-400 bg-muted shadow-lg shadow-amber-400/20">
                {winner.content_cover && (
                  <img
                    src={getCoverArtUrl(winner.content_cover, 'album', '300')}
                    alt={winner.content_name || ''}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
            </div>
          </Link>
          <div className="mt-2 bg-amber-400 text-black text-sm font-bold py-1.5 rounded">
            🏆 1st Place
          </div>
          <p className="font-bold mt-2 truncate">{winner.content_name}</p>
          <p className="text-xs text-muted-foreground truncate">
            {winner.content_artist}
          </p>
        </div>

        {/* 3rd Place */}
        {runnerUps[1] && (
          <div className="text-center flex-1 max-w-[140px]">
            <Link to={ROUTES.ALBUM.PAGE(runnerUps[1].content_id)}>
              <div className="w-20 h-20 mx-auto rounded-lg overflow-hidden border-2 border-amber-700 bg-muted">
                {runnerUps[1].content_cover && (
                  <img
                    src={getCoverArtUrl(
                      runnerUps[1].content_cover,
                      'album',
                      '200',
                    )}
                    alt={runnerUps[1].content_name || ''}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
            </Link>
            <div className="mt-2 bg-amber-700 text-white text-xs font-bold py-1 rounded">
              3rd
            </div>
            <p className="text-xs font-medium mt-2 truncate">
              {runnerUps[1].content_name}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
