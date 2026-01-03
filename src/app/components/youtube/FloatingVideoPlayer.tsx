import { GripVertical, Maximize2, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Button } from '@/app/components/ui/button'
import { cn } from '@/lib/utils'
import { useYouTubePlayerStore } from '@/store/youtubePlayer.store'

export function FloatingVideoPlayer() {
  const { activeVideo, isMinimized, closeVideo, maximize } =
    useYouTubePlayerStore()
  const [position, setPosition] = useState({
    x: window.innerWidth - 420,
    y: window.innerHeight - 260,
  })
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const playerRef = useRef<HTMLDivElement>(null)

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return

    setIsDragging(true)
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    })
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return

      const newX = Math.max(
        0,
        Math.min(e.clientX - dragOffset.x, window.innerWidth - 400),
      )
      const newY = Math.max(
        0,
        Math.min(e.clientY - dragOffset.y, window.innerHeight - 240),
      )

      setPosition({ x: newX, y: newY })
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, dragOffset])

  const handleMaximize = () => {
    maximize()
    window.location.hash = '#/youtube'
  }

  // Don't render if no video or not minimized
  if (!activeVideo || !isMinimized) return null

  return (
    <div
      ref={playerRef}
      className={cn(
        'fixed z-[9999] bg-black/95 backdrop-blur-xl rounded-lg shadow-2xl border border-white/10 overflow-hidden',
        isDragging && 'cursor-grabbing',
      )}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: '400px',
      }}
    >
      {/* Draggable Header */}
      <div
        className="h-10 bg-black/60 backdrop-blur-md border-b border-white/10 flex items-center justify-between px-3 cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <GripVertical className="w-4 h-4 text-white/40 flex-shrink-0" />
          <span className="text-xs font-medium text-white/90 truncate">
            {activeVideo.title}
          </span>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMaximize}
            className="h-7 w-7 p-0 hover:bg-white/10"
          >
            <Maximize2 className="w-3.5 h-3.5 text-white/70" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={closeVideo}
            className="h-7 w-7 p-0 hover:bg-white/10 hover:text-red-400"
          >
            <X className="w-3.5 h-3.5 text-white/70" />
          </Button>
        </div>
      </div>

      {/* Video Player */}
      <div className="aspect-video bg-black">
        <iframe
          className="w-full h-full"
          src={`https://www.youtube.com/embed/${activeVideo.id}?autoplay=1`}
          title={activeVideo.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    </div>
  )
}
