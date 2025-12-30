import { Check, Edit, Loader2, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import { Button } from '@/app/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/app/components/ui/dialog'
import { Label } from '@/app/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select'
import { ERAS, getEraColor, getEraLabel } from '@/config/eras'
import { useAuth } from '@/contexts/AuthContext'
import { eraService } from '@/service/eraService'

interface EditAlbumEraProps {
  albumId: string
  albumName: string
  currentEra?: string
  onEraChange?: (newEra: string) => void
}

export function EditAlbumEra({
  albumId,
  albumName,
  currentEra,
  onEraChange,
}: EditAlbumEraProps) {
  const { profile } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [selectedEra, setSelectedEra] = useState<string>(currentEra || '')
  const [isLoading, setIsLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      loadEra()
    }
  }, [isOpen])

  const loadEra = async () => {
    setInitialLoading(true)
    try {
      // If we don't have currentEra passed in, or we want to double check
      const era = await eraService.getEra(albumId, 'album')
      if (era) setSelectedEra(era)
    } catch (error) {
      console.warn('Failed to load era', error)
    } finally {
      setInitialLoading(false)
    }
  }

  const handleSave = async () => {
    setIsLoading(true)
    try {
      await eraService.setEra(albumId, 'album', selectedEra)
      toast.success('Era updated successfully')
      if (onEraChange) onEraChange(selectedEra)
      setIsOpen(false)
    } catch (error) {
      console.error('Failed to update era', error)
      toast.error('Failed to update era')
    } finally {
      setIsLoading(false)
    }
  }

  if (!profile?.is_admin) return null

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Edit className="w-3 h-3" />
          Edit Era
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Era for {albumName}</DialogTitle>
          <DialogDescription>
            Assign an Era tag to this comp. This will be visible in the gallery
            and used for filtering.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <Label htmlFor="era-select">Select Era</Label>
          {initialLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
              <Loader2 className="w-3 h-3 animate-spin" /> Loading...
            </div>
          ) : (
            <Select value={selectedEra} onValueChange={setSelectedEra}>
              <SelectTrigger className="w-full mt-2">
                <SelectValue placeholder="Select an Era" />
              </SelectTrigger>
              <SelectContent>
                {ERAS.map((era) => (
                  <SelectItem key={era.id} value={era.id}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: era.color }}
                      />
                      {era.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            onClick={() => setIsOpen(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading || initialLoading}>
            {isLoading && <Loader2 className="w-3 h-3 mr-2 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
