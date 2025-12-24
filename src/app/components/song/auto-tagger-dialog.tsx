import { useQuery } from '@tanstack/react-query'
import { Check, Loader2, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/app/components/ui/badge'
import { Button } from '@/app/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/app/components/ui/dialog'
import { ScrollArea } from '@/app/components/ui/scroll-area'
import { AutoTagSuggestion, musicbrainz } from '@/service/musicbrainz'
import { ISong } from '@/types/responses/song'
import { convertSecondsToTime } from '@/utils/convertSecondsToTime'

interface AutoTaggerDialogProps {
  song: ISong
  onApply: (suggestion: AutoTagSuggestion) => void
}

export function AutoTaggerDialog({ song, onApply }: AutoTaggerDialogProps) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [selectedSuggestion, setSelectedSuggestion] =
    useState<AutoTagSuggestion | null>(null)

  const { data: suggestions, isLoading } = useQuery({
    queryKey: ['autoTag', song.id, song.title, song.artist],
    queryFn: () => musicbrainz.searchByTitleAndArtist(song.title, song.artist),
    enabled: open,
  })

  const handleApply = () => {
    if (selectedSuggestion) {
      onApply(selectedSuggestion)
      setOpen(false)
      setSelectedSuggestion(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <Sparkles className="h-4 w-4" />
          {t('metadata.autoTag.button')}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[700px]" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>{t('metadata.autoTag.title')}</DialogTitle>
          <DialogDescription>
            {t('metadata.autoTag.description')}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[500px]">
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          )}

          {!isLoading && (!suggestions || suggestions.length === 0) && (
            <div className="text-center py-8 text-muted-foreground">
              {t('metadata.autoTag.noResults')}
            </div>
          )}

          {!isLoading && suggestions && suggestions.length > 0 && (
            <div className="space-y-2">
              {suggestions.map((suggestion, index) => (
                <button
                  key={`${suggestion.mbid}-${index}`}
                  onClick={() => setSelectedSuggestion(suggestion)}
                  className={
                    `w-full text-left p-4 rounded-lg border transition-colors ` +
                    (selectedSuggestion?.mbid === suggestion.mbid
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50 hover:bg-accent')
                  }
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold truncate">
                        {suggestion.title}
                      </div>
                      <div className="text-sm text-muted-foreground truncate">
                        {suggestion.artist}
                      </div>
                      {suggestion.album && (
                        <div className="text-sm text-muted-foreground truncate">
                          {suggestion.album}
                        </div>
                      )}
                      <div className="flex gap-2 mt-2 flex-wrap">
                        {suggestion.year && (
                          <Badge variant="neutral" className="text-xs">
                            {suggestion.year}
                          </Badge>
                        )}
                        {suggestion.duration && (
                          <Badge variant="neutral" className="text-xs">
                            {convertSecondsToTime(suggestion.duration)}
                          </Badge>
                        )}
                        <Badge
                          variant={suggestion.confidence > 80 ? 'default' : 'neutral'}
                          className="text-xs"
                        >
                          {suggestion.confidence}% {t('metadata.autoTag.match')}
                        </Badge>
                      </div>
                    </div>
                    {selectedSuggestion?.mbid === suggestion.mbid && (
                      <Check className="h-5 w-5 text-primary flex-shrink-0" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setOpen(false)
              setSelectedSuggestion(null)
            }}
          >
            {t('logout.dialog.cancel')}
          </Button>
          <Button onClick={handleApply} disabled={!selectedSuggestion}>
            {t('metadata.autoTag.apply')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
