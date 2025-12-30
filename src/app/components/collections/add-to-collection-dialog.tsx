import { Plus } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import { Button } from '@/app/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog'
import { Input } from '@/app/components/ui/input'
import { ScrollArea } from '@/app/components/ui/scroll-area'
import { useAuth } from '@/contexts/AuthContext'
import { type Collection, collectionService } from '@/service/collectionService'
import { ContentType } from '@/service/highlightsService'

interface AddToCollectionDialogProps {
  contentId: string
  contentType: ContentType
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddToCollectionDialog({
  contentId,
  contentType,
  open,
  onOpenChange,
}: AddToCollectionDialogProps) {
  const { user } = useAuth()
  const [collections, setCollections] = useState<Collection[]>([])
  const [loading, setLoading] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [showCreate, setShowCreate] = useState(false)

  const loadCollections = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const data = await collectionService.getCollectionsByUser(user.id)
      setCollections(data)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (open && user) {
      loadCollections()
    }
  }, [open, user, loadCollections])

  const handleAddToCollection = async (collectionId: string) => {
    setLoading(true)
    try {
      const success = await collectionService.addItem(
        collectionId,
        contentId,
        contentType,
      )
      if (success) {
        toast.success('Added to collection')
        onOpenChange(false)
      } else {
        toast.error('Failed to add to collection')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAndAdd = async () => {
    if (!newTitle.trim()) return
    setLoading(true)
    try {
      const collection = await collectionService.createCollection({
        title: newTitle,
        is_public: true,
      })
      if (collection) {
        await handleAddToCollection(collection.id)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add to Collection</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4">
          <ScrollArea className="h-64 pr-4">
            <div className="space-y-2">
              {collections.map((collection) => (
                <button
                  type="button"
                  key={collection.id}
                  onClick={() => handleAddToCollection(collection.id)}
                  disabled={loading}
                  className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-accent text-left transition-colors border"
                >
                  <span className="font-medium">{collection.title}</span>
                  <span className="text-xs text-muted-foreground">
                    {collection.item_count} items
                  </span>
                </button>
              ))}
              {collections.length === 0 && !loading && (
                <p className="text-center text-muted-foreground py-8">
                  No collections found.
                </p>
              )}
            </div>
          </ScrollArea>

          <div className="border-t pt-4">
            {!showCreate ? (
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() => setShowCreate(true)}
              >
                <Plus className="w-4 h-4" />
                Create New Collection
              </Button>
            ) : (
              <div className="space-y-3">
                <Input
                  placeholder="Collection Title"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  autoFocus
                />
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    onClick={() => setShowCreate(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateAndAdd}
                    disabled={!newTitle.trim() || loading}
                    className="flex-1"
                  >
                    Create & Add
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
