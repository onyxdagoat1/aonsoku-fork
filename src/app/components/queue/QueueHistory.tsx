import { Clock, History, Play, Save } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'react-toastify'
import { Button } from '@/app/components/ui/button'
import { ScrollArea } from '@/app/components/ui/scroll-area'
import { usePlayerStore } from '@/store/player.store'
import { ISong } from '@/types/responses/song'

// Mock history data since we don't have a real history backend yet
const MOCK_HISTORY: ISong[] = [
  {
    id: '1',
    title: 'Midnight City',
    artist: 'M83',
    album: "Hurry Up, We're Dreaming",
    duration: 243,
    coverArt: '',
  },
  {
    id: '2',
    title: 'Starboy',
    artist: 'The Weeknd',
    album: 'Starboy',
    duration: 230,
    coverArt: '',
  },
  {
    id: '3',
    title: 'Get Lucky',
    artist: 'Daft Punk',
    album: 'Random Access Memories',
    duration: 369,
    coverArt: '',
  },
]

export default function QueueHistory() {
  const { currentList } = usePlayerStore((state) => state.songlist)
  // In a real app, we would fetch history from the backend or a specific store slice
  const [history] = useState<ISong[]>(MOCK_HISTORY)

  const handlePlaySong = (song: ISong) => {
    // Logic to play song
    toast.info(`Playing ${song.title}`)
  }

  const handleSaveAsPlaylist = () => {
    toast.success('Queue history saved as "History Playlist"')
  }

  return (
    <div className="flex flex-col h-full bg-background/50 backdrop-blur-sm rounded-xl border border-border overflow-hidden">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <History className="w-5 h-5 text-primary" />
          Queue History
        </h3>
        <Button size="sm" variant="outline" onClick={handleSaveAsPlaylist}>
          <Save className="w-4 h-4 mr-2" />
          Save as Playlist
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {history.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No history available. Start listening!
            </div>
          ) : (
            <div className="space-y-1">
              {history.map((song, i) => (
                <div
                  key={`${song.id}-${i}`}
                  className="group flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-8 h-8 rounded bg-muted flex items-center justify-center text-xs font-mono text-muted-foreground">
                      {i + 1}
                    </div>
                    <div className="flex flex-col overflow-hidden">
                      <span className="font-medium truncate">{song.title}</span>
                      <span className="text-xs text-muted-foreground truncate">
                        {song.artist}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-xs text-muted-foreground flex items-center gap-1 mr-2">
                      <Clock className="w-3 h-3" /> 2m ago
                    </span>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => handlePlaySong(song)}
                    >
                      <Play className="w-4 h-4 ml-0.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
