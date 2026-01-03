import { SlidersHorizontal } from 'lucide-react'
import { Card, CardContent } from '@/app/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select'

type SortOption = 'date' | 'views' | 'likes' | 'title' | 'duration' | 'comments'
type FilterOption = 'all' | 'recent' | 'popular' | 'thisMonth' | 'thisYear'
type DurationFilter = 'all' | 'short' | 'medium' | 'long'

interface FiltersProps {
  sortBy: SortOption
  setSortBy: (sort: SortOption) => void
  filterBy: FilterOption
  setFilterBy: (filter: FilterOption) => void
  durationFilter: DurationFilter
  setDurationFilter: (duration: DurationFilter) => void
}

export function YouTubeFilters({
  sortBy,
  setSortBy,
  filterBy,
  setFilterBy,
  durationFilter,
  setDurationFilter,
}: FiltersProps) {
  return (
    <Card className="bg-transparent border-none shadow-none p-0">
      <CardContent className="p-0">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
            <SlidersHorizontal className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-white">Filters:</span>
          </div>

          <div className="flex flex-wrap gap-3 flex-1">
            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground whitespace-nowrap hidden sm:block">
                Sort by:
              </label>
              <Select
                value={sortBy}
                onValueChange={(value) => setSortBy(value as SortOption)}
              >
                <SelectTrigger className="w-[130px] h-9 text-sm bg-white/5 border-white/10 text-white focus:ring-primary/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Latest</SelectItem>
                  <SelectItem value="views">Most Viewed</SelectItem>
                  <SelectItem value="likes">Most Liked</SelectItem>
                  <SelectItem value="comments">Most Comments</SelectItem>
                  <SelectItem value="duration">Duration</SelectItem>
                  <SelectItem value="title">Title (A-Z)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground whitespace-nowrap hidden sm:block">
                Time:
              </label>
              <Select
                value={filterBy}
                onValueChange={(value) => setFilterBy(value as FilterOption)}
              >
                <SelectTrigger className="w-[130px] h-9 text-sm bg-white/5 border-white/10 text-white focus:ring-primary/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="recent">This Week</SelectItem>
                  <SelectItem value="thisMonth">This Month</SelectItem>
                  <SelectItem value="thisYear">This Year</SelectItem>
                  <SelectItem value="popular">Popular (10K+)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground whitespace-nowrap hidden sm:block">
                Duration:
              </label>
              <Select
                value={durationFilter}
                onValueChange={(value) =>
                  setDurationFilter(value as DurationFilter)
                }
              >
                <SelectTrigger className="w-[130px] h-9 text-sm bg-white/5 border-white/10 text-white focus:ring-primary/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any Length</SelectItem>
                  <SelectItem value="short">Short (&lt; 4 min)</SelectItem>
                  <SelectItem value="medium">Medium (4-20 min)</SelectItem>
                  <SelectItem value="long">Long (&gt; 20 min)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
