import { Check, ChevronsUpDown, Loader2, Plus, User } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/app/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/app/components/ui/command'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog'
import { Input } from '@/app/components/ui/input'
import { Label } from '@/app/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/app/components/ui/popover'
import { Textarea } from '@/app/components/ui/textarea'
import { cn } from '@/lib/utils'
import { type Yeditor, yeditorService } from '@/service/yeditorService'

interface YeditorSelectorProps {
  value?: string
  onChange: (yeditorId: string | undefined, yeditorName?: string) => void
  required?: boolean
  disabled?: boolean
  className?: string
}

export function YeditorSelector({
  value,
  onChange,
  required = false,
  disabled = false,
  className,
}: YeditorSelectorProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [yeditors, setYeditors] = useState<Yeditor[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedYeditor, setSelectedYeditor] = useState<Yeditor | null>(null)

  // Create new yeditor dialog
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [newYeditorName, setNewYeditorName] = useState('')
  const [newYeditorBio, setNewYeditorBio] = useState('')
  const [creating, setCreating] = useState(false)

  // Load yeditors on mount and search
  const loadYeditors = useCallback(async (query: string) => {
    setLoading(true)
    try {
      const results = query
        ? await yeditorService.searchYeditors(query, 20)
        : await yeditorService.getAllYeditors()
      setYeditors(results)
    } catch (error) {
      console.error('Error loading yeditors:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  // Load initial yeditors
  useEffect(() => {
    loadYeditors('')
  }, [loadYeditors])

  // Load selected yeditor if value is set
  useEffect(() => {
    if (value && !selectedYeditor) {
      yeditorService.getYeditor(value).then((yeditor) => {
        if (yeditor) {
          setSelectedYeditor(yeditor)
        }
      })
    }
  }, [value, selectedYeditor])

  // Search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      loadYeditors(search)
    }, 300)
    return () => clearTimeout(timer)
  }, [search, loadYeditors])

  const handleSelect = (yeditor: Yeditor) => {
    setSelectedYeditor(yeditor)
    onChange(yeditor.id, yeditor.name)
    setOpen(false)
  }

  const handleClear = () => {
    setSelectedYeditor(null)
    onChange(undefined)
  }

  const handleCreateYeditor = async () => {
    if (!newYeditorName.trim()) return

    setCreating(true)
    try {
      const newYeditor = await yeditorService.createYeditor(
        newYeditorName.trim(),
        newYeditorBio.trim() || undefined,
      )
      if (newYeditor) {
        setYeditors((prev) => [...prev, newYeditor])
        handleSelect(newYeditor)
        setCreateDialogOpen(false)
        setNewYeditorName('')
        setNewYeditorBio('')
      }
    } catch (error) {
      console.error('Error creating yeditor:', error)
    } finally {
      setCreating(false)
    }
  }

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className={cn(
              'w-full justify-between',
              !selectedYeditor && 'text-muted-foreground',
              className,
            )}
          >
            <div className="flex items-center gap-2 truncate">
              {selectedYeditor ? (
                <>
                  {selectedYeditor.avatar_url ? (
                    <img
                      src={selectedYeditor.avatar_url}
                      alt=""
                      className="w-5 h-5 rounded-full"
                    />
                  ) : (
                    <User className="w-4 h-4" />
                  )}
                  <span className="truncate">{selectedYeditor.name}</span>
                  {selectedYeditor.is_verified && (
                    <Check className="w-3 h-3 text-primary" />
                  )}
                </>
              ) : (
                <span>Select editor{required && ' *'}</span>
              )}
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0" align="start">
          <Command>
            <CommandInput
              placeholder="Search editors..."
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              {loading && (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="w-4 h-4 animate-spin" />
                </div>
              )}
              {!loading && yeditors.length === 0 && (
                <CommandEmpty>No editors found.</CommandEmpty>
              )}
              {!loading && yeditors.length > 0 && (
                <CommandGroup heading="Editors">
                  {yeditors.map((yeditor) => (
                    <CommandItem
                      key={yeditor.id}
                      value={yeditor.name}
                      onSelect={() => handleSelect(yeditor)}
                    >
                      <div className="flex items-center gap-2 flex-1">
                        {yeditor.avatar_url ? (
                          <img
                            src={yeditor.avatar_url}
                            alt=""
                            className="w-5 h-5 rounded-full"
                          />
                        ) : (
                          <User className="w-4 h-4 text-muted-foreground" />
                        )}
                        <span>{yeditor.name}</span>
                        {yeditor.is_verified && (
                          <Check className="w-3 h-3 text-primary" />
                        )}
                      </div>
                      {selectedYeditor?.id === yeditor.id && (
                        <Check className="w-4 h-4" />
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              <CommandSeparator />
              <CommandGroup>
                <CommandItem
                  onSelect={() => {
                    setCreateDialogOpen(true)
                    setOpen(false)
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create new editor
                </CommandItem>
                {selectedYeditor && !required && (
                  <CommandItem onSelect={handleClear}>
                    Clear selection
                  </CommandItem>
                )}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Create New Yeditor Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Editor</DialogTitle>
            <DialogDescription>
              Add a new editor (Yeditor) to the system. This can be linked to a
              user account later.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="yeditor-name">Name *</Label>
              <Input
                id="yeditor-name"
                value={newYeditorName}
                onChange={(e) => setNewYeditorName(e.target.value)}
                placeholder="Enter editor name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="yeditor-bio">Bio (optional)</Label>
              <Textarea
                id="yeditor-bio"
                value={newYeditorBio}
                onChange={(e) => setNewYeditorBio(e.target.value)}
                placeholder="Brief description..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateDialogOpen(false)}
              disabled={creating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateYeditor}
              disabled={!newYeditorName.trim() || creating}
            >
              {creating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create Editor
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
