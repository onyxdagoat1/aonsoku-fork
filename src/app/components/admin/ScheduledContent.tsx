import { useQuery } from '@tanstack/react-query'
import { Calendar, Eye, EyeOff, Plus } from 'lucide-react'
import { useState } from 'react'
import { Badge } from '@/app/components/ui/badge'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/app/components/ui/table'
import { releasesService } from '@/service/releases.service'

// Note: This is a placeholder as we haven't implemented full CRUD for releases yet in the service
export function ScheduledContent() {
  const {
    data: releases,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['upcoming-releases'],
    queryFn: releasesService.getUpcomingReleases,
  })

  const [isOpen, setIsOpen] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDate, setNewDate] = useState('')
  const [newType, setNewType] = useState<
    'album' | 'single' | 'event' | 'compilation' | 'edit'
  >('album')
  const [newHidden, setNewHidden] = useState(true)
  const [creating, setCreating] = useState(false)

  const handleCreate = async () => {
    try {
      setCreating(true)
      await releasesService.createRelease({
        title: newTitle,
        scheduled_at: new Date(newDate).toISOString(),
        release_type: newType,
        is_hidden: newHidden,
        is_active: !newHidden,
      })

      setIsOpen(false)
      setNewTitle('')
      setNewDate('')
      refetch()
    } catch (e) {
      console.error(e)
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Scheduled Releases</h3>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" /> Schedule Release
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Schedule New Content</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  placeholder="Album or Event Title"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Date & Time</Label>
                <Input
                  type="datetime-local"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <select
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as any)}
                >
                  <option value="album">Album</option>
                  <option value="single">Single</option>
                  <option value="event">Event</option>
                  <option value="compilation">Compilation</option>
                  <option value="edit">Edit</option>
                </select>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="hidden"
                  className="rounded border-gray-300"
                  checked={newHidden}
                  onChange={(e) => setNewHidden(e.target.checked)}
                />
                <Label htmlFor="hidden">
                  Hidden from public (until active)
                </Label>
              </div>
              <Button
                onClick={handleCreate}
                disabled={creating || !newTitle || !newDate}
                className="w-full"
              >
                {creating ? 'Scheduling...' : 'Schedule Content'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Scheduled For</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : releases?.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center text-muted-foreground"
                >
                  No scheduled content
                </TableCell>
              </TableRow>
            ) : (
              releases?.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.title}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="capitalize">
                      {item.release_type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      {new Date(item.scheduled_at).toLocaleString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    {item.is_hidden ? (
                      <Badge
                        variant="outline"
                        className="text-yellow-500 border-yellow-500/50"
                      >
                        Hidden
                      </Badge>
                    ) : (
                      <Badge
                        variant="default"
                        className="bg-green-500 hover:bg-green-600"
                      >
                        Active
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">
                      {item.is_hidden ? (
                        <Eye className="w-4 h-4" />
                      ) : (
                        <EyeOff className="w-4 h-4" />
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
