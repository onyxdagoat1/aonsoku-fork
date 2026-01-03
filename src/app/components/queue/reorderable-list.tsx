import { Reorder, useDragControls } from 'framer-motion'
import { GripVertical, X } from 'lucide-react'
import { memo, useEffect, useState } from 'react'
import { Button } from '@/app/components/ui/button'
import { cn } from '@/lib/utils'
import {
  usePlayerActions,
  usePlayerCurrentList,
  usePlayerCurrentSongIndex,
  usePlayerIsPlaying,
} from '@/store/player.store'
import { ISong } from '@/types/responses/song'
import { convertSecondsToTime } from '@/utils/convertSecondsToTime'

interface Props {
  song: ISong
  index: number
  isActive: boolean
  isPlaying: boolean
  onPlay: () => void
  onRemove: () => void
}

const ReorderableItem = memo(
  ({ song, index, isActive, isPlaying, onPlay, onRemove }: Props) => {
    const controls = useDragControls()

    return (
      <Reorder.Item
        value={song}
        id={song.id}
        dragListener={false}
        dragControls={controls}
        className={cn(
          'group flex items-center w-full h-12 px-2 text-sm border-b border-border/50 hover:bg-muted/50 transition-colors select-none',
          isActive && 'bg-primary/10 text-primary',
        )}
      >
        <div
          className="flex items-center justify-center w-8 h-8 mr-2 cursor-grab touch-none text-muted-foreground hover:text-foreground"
          onPointerDown={(e) => controls.start(e)}
        >
          <GripVertical className="w-4 h-4" />
        </div>

        <div
          className="flex flex-1 items-center min-w-0 cursor-pointer h-full"
          onClick={onPlay}
        >
          <div className="w-8 flex justify-center text-xs text-muted-foreground mr-2 shrink-0">
            {isActive && isPlaying ? (
              <span className="animate-pulse">▶</span>
            ) : (
              <span>{index + 1}</span>
            )}
          </div>

          <div className="flex flex-col min-w-0 flex-1 mr-4">
            <span className="truncate font-medium">{song.title}</span>
            <span className="truncate text-xs text-muted-foreground">
              {song.artist}
            </span>
          </div>

          <div className="hidden md:block w-1/3 truncate text-xs text-muted-foreground mr-4">
            {song.album}
          </div>

          <div className="text-xs text-muted-foreground font-mono mr-2">
            {convertSecondsToTime(song.duration)}
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
        >
          <X className="w-4 h-4" />
        </Button>
      </Reorder.Item>
    )
  },
)

export function ReorderableQueueList() {
  const currentList = usePlayerCurrentList()
  const currentSongIndex = usePlayerCurrentSongIndex()
  const isPlaying = usePlayerIsPlaying()
  const { setSongList, removeSongFromQueue, reorderQueue } = usePlayerActions()
  const [items, setItems] = useState(currentList)

  useEffect(() => {
    setItems(currentList)
  }, [currentList])

  const handleReorder = (newOrder: ISong[]) => {
    setItems(newOrder)
    reorderQueue(newOrder)
  }

  return (
    <div className="w-full h-full overflow-y-auto overflow-x-hidden pb-20">
      <Reorder.Group
        axis="y"
        values={items}
        onReorder={handleReorder}
        className="flex flex-col w-full"
      >
        {items.map((song, index) => (
          <ReorderableItem
            key={song.id}
            song={song}
            index={index}
            isActive={index === currentSongIndex}
            isPlaying={isPlaying}
            onPlay={() => setSongList(items, index)}
            onRemove={() => removeSongFromQueue(song.id)}
          />
        ))}
      </Reorder.Group>
    </div>
  )
}
