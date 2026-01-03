import { Loader2, Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useDebounce } from 'use-debounce'
import { Input } from '@/app/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/app/components/ui/popover'
import { ScrollArea } from '@/app/components/ui/scroll-area'
import { type TensorGif, tenorService } from '@/service/tenor'

interface GifPickerProps {
  onGifSelect: (gifUrl: string) => void
  children: React.ReactNode
}

export function GifPicker({ onGifSelect, children }: GifPickerProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [debouncedQuery] = useDebounce(query, 500)
  const [gifs, setGifs] = useState<TensorGif[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchGifsInternal = async (searchQuery: string) => {
      setLoading(true)
      setError(null)
      try {
        const results = searchQuery
          ? await tenorService.search(searchQuery)
          : await tenorService.getTrending()
        setGifs(results)
        if (results.length === 0) {
          setError('No GIFs found')
        }
      } catch {
        setError('Failed to load GIFs')
      } finally {
        setLoading(false)
      }
    }

    if (open) {
      fetchGifsInternal(debouncedQuery)
    }
  }, [debouncedQuery, open])

  const getGifUrl = (gif: TensorGif): string => {
    // Prefer smaller formats for preview, fallback to larger
    return (
      gif.media_formats?.mediumgif?.url ||
      gif.media_formats?.tinygif?.url ||
      gif.media_formats?.gif?.url ||
      ''
    )
  }

  const getPreviewUrl = (gif: TensorGif): string => {
    // Use smallest format for grid preview
    return (
      gif.media_formats?.nanogif?.url ||
      gif.media_formats?.tinygif?.url ||
      gif.media_formats?.mediumgif?.url ||
      ''
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        className="w-80 p-0 overflow-hidden bg-black/80 backdrop-blur-xl border-white/10"
        align="start"
        side="top"
      >
        <div className="p-3 border-b border-white/10">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search GIFs..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9 h-9 bg-white/5 border-white/10 focus-visible:ring-0"
            />
          </div>
        </div>
        <ScrollArea className="h-80">
          <div className="p-2 grid grid-cols-2 gap-2">
            {loading ? (
              <div className="col-span-2 flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : gifs.length > 0 ? (
              gifs.map((gif) => (
                <button
                  key={gif.id}
                  onClick={() => {
                    const url = getGifUrl(gif)
                    if (url) {
                      onGifSelect(url)
                      setOpen(false)
                    }
                  }}
                  className="relative aspect-video overflow-hidden rounded-md hover:ring-2 ring-primary transition-all group"
                >
                  <img
                    src={getPreviewUrl(gif)}
                    alt={gif.content_description || gif.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center" />
                </button>
              ))
            ) : (
              <div className="col-span-2 text-center py-8 text-muted-foreground text-sm">
                {error || 'Search for GIFs...'}
              </div>
            )}
          </div>
        </ScrollArea>
        <div className="p-2 text-[10px] text-center text-muted-foreground bg-white/5 border-t border-white/10">
          Powered by Tenor
        </div>
      </PopoverContent>
    </Popover>
  )
}
