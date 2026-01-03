import { motion } from 'framer-motion'
import { useCallback, useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { lyrics } from '@/service/lyrics'
import { usePlayerStore } from '@/store/player.store'
import { Skeleton } from '../ui/skeleton'

interface SyncedLine {
  time: number
  text: string
}

const parseLRC = (lrc: string): SyncedLine[] => {
  const lines = lrc.split('\n')
  const result: SyncedLine[] = []

  const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/

  for (const line of lines) {
    const match = line.match(timeRegex)
    if (match) {
      const minutes = parseInt(match[1])
      const seconds = parseInt(match[2])
      const milliseconds = parseInt(match[3])

      // Convert to seconds
      const time = minutes * 60 + seconds + milliseconds / 100
      const text = line.replace(timeRegex, '').trim()

      if (text) {
        result.push({ time, text })
      }
    }
  }

  return result
}

export default function SyncedLyrics() {
  const { currentSong } = usePlayerStore((state) => state.songlist)
  const { currentDuration, audioPlayerRef } = usePlayerStore(
    (state) => state.playerState,
  )

  const [syncedLines, setSyncedLines] = useState<SyncedLine[]>([])
  const [activeLineIndex, setActiveLineIndex] = useState<number>(-1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const containerRef = useRef<HTMLDivElement>(null)
  const activeLineRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchLyrics = async () => {
      if (!currentSong?.title) return

      setIsLoading(true)
      setError(null)
      setSyncedLines([])

      try {
        const data = await lyrics.getLyrics({
          title: currentSong.title,
          artist: currentSong.artist,
          album: currentSong.album,
          duration: currentSong.duration,
        })

        if (!data || !data.value) {
          setError('No lyrics found')
          setIsLoading(false)
          return
        }

        const parsed = parseLRC(data.value)
        setSyncedLines(parsed)
      } catch (err) {
        console.error('Failed to fetch lyrics', err)
        setError('Failed to load lyrics')
      } finally {
        setIsLoading(false)
      }
    }

    fetchLyrics()
  }, [
    currentSong?.title,
    currentSong?.artist,
    currentSong?.album,
    currentSong?.duration,
  ])

  const scrollToActiveLine = useCallback((index: number) => {
    if (!activeLineRef.current || !containerRef.current) return

    // Smooth scroll logic could be improved here, but simple scrollIntoView is a start
    // Using simple offset calculation for better control
    const container = containerRef.current
    const activeElement = container.children[0].children[index] as HTMLElement

    if (activeElement) {
      const offset =
        activeElement.offsetTop -
        container.offsetTop -
        container.clientHeight / 2 +
        activeElement.clientHeight / 2
      container.scrollTo({ top: offset, behavior: 'smooth' })
    }
  }, [])

  useEffect(() => {
    // Find active line based on current duration
    const index = syncedLines.findIndex((line, i) => {
      const nextLine = syncedLines[i + 1]
      return (
        currentDuration >= line.time &&
        (!nextLine || currentDuration < nextLine.time)
      )
    })

    if (index !== -1 && index !== activeLineIndex) {
      setActiveLineIndex(index)
      scrollToActiveLine(index)
    }
  }, [currentDuration, syncedLines, activeLineIndex, scrollToActiveLine])

  const handleLineClick = (time: number) => {
    if (audioPlayerRef?.current) {
      audioPlayerRef.current.currentTime = time
    } else {
      // Fallback
      const audio = document.querySelector('audio')
      if (audio) audio.currentTime = time
    }
  }

  if (isLoading) {
    return (
      <div className="h-full w-full flex flex-col justify-center items-center gap-4 p-8">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    )
  }

  if (error || syncedLines.length === 0) {
    return (
      <div className="h-full w-full flex justify-center items-center text-muted-foreground p-8 text-center">
        <div>
          <p className="text-lg font-medium mb-1">No synced lyrics available</p>
          <p className="text-sm opacity-70">
            We couldn't find time-synced lyrics for this track.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="h-full w-full overflow-y-auto no-scrollbar py-[50vh] px-8 text-center mask-image-linear-to-b"
      style={{
        maskImage:
          'linear-gradient(to bottom, transparent, black 10%, black 90%, transparent)',
      }}
    >
      <div className="flex flex-col gap-6">
        {syncedLines.map((line, index) => {
          const isActive = index === activeLineIndex
          const isPast = index < activeLineIndex

          return (
            <motion.p
              key={index}
              ref={isActive ? activeLineRef : null}
              initial={false}
              animate={{
                scale: isActive ? 1.05 : 1,
                opacity: isActive ? 1 : isPast ? 0.4 : 0.6,
                color: isActive ? 'var(--primary)' : 'currentColor',
                filter: isActive ? 'blur(0px)' : 'blur(0.5px)',
              }}
              className={cn(
                'text-2xl md:text-3xl font-bold transition-all duration-300 cursor-pointer hover:opacity-80 py-2',
                isActive && 'text-primary drop-shadow-md',
              )}
              onClick={() => handleLineClick(line.time)}
            >
              {line.text}
            </motion.p>
          )
        })}
      </div>
    </div>
  )
}
