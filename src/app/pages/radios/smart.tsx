import { useQuery } from '@tanstack/react-query'
import { PlayIcon, RadioIcon, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'react-toastify'
import { ShadowHeader } from '@/app/components/album/shadow-header'
import { HeaderTitle } from '@/app/components/header-title'
import { Button } from '@/app/components/ui/button'
import { Label } from '@/app/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select'
import { Slider } from '@/app/components/ui/slider'
import { subsonic } from '@/service/subsonic'
import { usePlayerActions } from '@/store/player.store'
import { queryKeys } from '@/utils/queryKeys'

export default function SmartRadio() {
  const { setSongList } = usePlayerActions()
  const [selectedGenre, setSelectedGenre] = useState<string>('all')
  const [yearRange, setYearRange] = useState<[number, number]>([1970, 2026])
  const [count, setCount] = useState<number>(50)

  const { data: genres } = useQuery({
    queryKey: [queryKeys.genres.all],
    queryFn: subsonic.genres.get,
  })

  async function handleStartRadio(isFlow = false) {
    try {
      const songs = await subsonic.songs.getRandomSongs({
        size: count,
        genre: !isFlow && selectedGenre !== 'all' ? selectedGenre : undefined,
        fromYear: !isFlow ? yearRange[0] : undefined,
        toYear: !isFlow ? yearRange[1] : undefined,
      })

      if (songs && songs.length > 0) {
        setSongList(songs, 0)
        toast.success(`Started radio with ${songs.length} songs`)
      } else {
        toast.error('No songs found for these criteria')
      }
    } catch (e) {
      console.error(e)
      toast.error('Failed to start radio')
    }
  }

  return (
    <div className="w-full h-full">
      <ShadowHeader>
        <div className="w-full flex items-center justify-between">
          <HeaderTitle title="Smart Radio" />
        </div>
      </ShadowHeader>

      <div className="p-8 max-w-4xl mx-auto flex flex-col gap-8">
        {/* Flow Mode */}
        <div className="rounded-xl border bg-card text-card-foreground shadow p-6 flex items-center justify-between gap-6">
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-primary" />
              Flow Mode
            </h2>
            <p className="text-muted-foreground">
              Instant mix of random songs from your entire library. Perfect for
              when you don't know what to play.
            </p>
          </div>
          <Button
            size="lg"
            className="shrink-0"
            onClick={() => handleStartRadio(true)}
          >
            <PlayIcon className="mr-2 h-5 w-5" />
            Play Flow
          </Button>
        </div>

        {/* Custom Radio */}
        <div className="rounded-xl border bg-card text-card-foreground shadow p-6 flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <RadioIcon className="w-6 h-6 text-primary" />
              Custom Radio
            </h2>
            <p className="text-muted-foreground">
              Tune your station by genre and year.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-3">
              <Label>Genre</Label>
              <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Genre" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  <SelectItem value="all">All Genres</SelectItem>
                  {genres?.map((g: { value: string }) => (
                    <SelectItem key={g.value} value={g.value}>
                      {g.value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-3">
              <Label>Song Count</Label>
              <Select
                value={count.toString()}
                onValueChange={(v) => setCount(Number(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="25">25 Songs</SelectItem>
                  <SelectItem value="50">50 Songs</SelectItem>
                  <SelectItem value="100">100 Songs</SelectItem>
                  <SelectItem value="200">200 Songs</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-3 md:col-span-2">
              <div className="flex justify-between">
                <Label>Year Range</Label>
                <span className="text-sm text-muted-foreground">
                  {yearRange[0]} - {yearRange[1]}
                </span>
              </div>
              <Slider
                min={1950}
                max={new Date().getFullYear()}
                step={1}
                value={yearRange}
                onValueChange={(value) =>
                  setYearRange(value as [number, number])
                }
                className="py-4"
              />
            </div>
          </div>

          <Button
            size="lg"
            className="w-full md:w-auto md:self-end mt-2"
            onClick={() => handleStartRadio(false)}
          >
            <PlayIcon className="mr-2 h-5 w-5" />
            Start Radio
          </Button>
        </div>
      </div>
    </div>
  )
}
