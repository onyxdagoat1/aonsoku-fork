import {
  Calendar,
  Check,
  Edit,
  Link,
  Loader2,
  Plus,
  Search,
  Star,
  Trash2,
  Unlink,
  User,
  Users,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import { Badge } from '@/app/components/ui/badge'
import { Button } from '@/app/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/app/components/ui/card'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/app/components/ui/table'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/app/components/ui/tabs'
import { Textarea } from '@/app/components/ui/textarea'
import { supabase } from '@/lib/supabase'
import {
  type CreateHighlightData,
  type Highlight,
  type HighlightType,
  highlightsService,
} from '@/service/highlightsService'
import { type Yeditor, yeditorService } from '@/service/yeditorService'

interface UserProfile {
  id: string
  username: string
  display_name: string | null
}

export function YeditorManagement() {
  const [yeditors, setYeditors] = useState<Yeditor[]>([])
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  // Link dialog
  const [linkDialogOpen, setLinkDialogOpen] = useState(false)
  const [selectedYeditor, setSelectedYeditor] = useState<Yeditor | null>(null)
  const [selectedUserId, setSelectedUserId] = useState<string>('')
  const [linking, setLinking] = useState(false)

  // Create dialog
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [newBio, setNewBio] = useState('')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [yeditorsData, usersData] = await Promise.all([
        yeditorService.getAllYeditors(),
        supabase
          .from('profiles')
          .select('id, username, display_name')
          .order('username'),
      ])
      setYeditors(yeditorsData)
      if (usersData.data) {
        setUsers(usersData.data)
      }
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateYeditor = async () => {
    if (!newName.trim()) return
    setCreating(true)
    try {
      const yeditor = await yeditorService.createYeditor(
        newName.trim(),
        newBio.trim() || undefined,
      )
      if (yeditor) {
        setYeditors((prev) => [...prev, yeditor])
        setCreateDialogOpen(false)
        setNewName('')
        setNewBio('')
        toast.success('Yeditor created successfully')
      }
    } catch (error) {
      console.error('Error creating yeditor:', error)
      toast.error('Failed to create yeditor')
    } finally {
      setCreating(false)
    }
  }

  const handleLinkUser = async () => {
    if (!selectedYeditor || !selectedUserId) return
    setLinking(true)
    try {
      const success = await yeditorService.linkYeditorToUser(
        selectedYeditor.id,
        selectedUserId,
      )
      if (success) {
        setYeditors((prev) =>
          prev.map((y) =>
            y.id === selectedYeditor.id ? { ...y, user_id: selectedUserId } : y,
          ),
        )
        setLinkDialogOpen(false)
        setSelectedYeditor(null)
        setSelectedUserId('')
        toast.success('User linked to yeditor')
      }
    } catch (error) {
      console.error('Error linking user:', error)
      toast.error('Failed to link user')
    } finally {
      setLinking(false)
    }
  }

  const handleUnlinkUser = async (yeditor: Yeditor) => {
    try {
      const success = await yeditorService.unlinkYeditorFromUser(yeditor.id)
      if (success) {
        setYeditors((prev) =>
          prev.map((y) => (y.id === yeditor.id ? { ...y, user_id: null } : y)),
        )
        toast.success('User unlinked from yeditor')
      }
    } catch (error) {
      console.error('Error unlinking user:', error)
      toast.error('Failed to unlink user')
    }
  }

  const handleVerify = async (yeditor: Yeditor) => {
    try {
      const success = await yeditorService.setYeditorVerified(
        yeditor.id,
        !yeditor.is_verified,
      )
      if (success) {
        setYeditors((prev) =>
          prev.map((y) =>
            y.id === yeditor.id ? { ...y, is_verified: !y.is_verified } : y,
          ),
        )
        toast.success(
          yeditor.is_verified ? 'Verification removed' : 'Yeditor verified',
        )
      }
    } catch (error) {
      console.error('Error updating verification:', error)
      toast.error('Failed to update verification')
    }
  }

  const filteredYeditors = yeditors.filter(
    (y) =>
      y.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      y.bio?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const getUserName = (userId: string | null) => {
    if (!userId) return null
    const user = users.find((u) => u.id === userId)
    return user?.display_name || user?.username || 'Unknown User'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search yeditors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Yeditor
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Yeditors ({filteredYeditors.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Linked User</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredYeditors.map((yeditor) => (
                <TableRow key={yeditor.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {yeditor.avatar_url ? (
                        <img
                          src={yeditor.avatar_url}
                          alt=""
                          className="w-8 h-8 rounded-full"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                          <User className="w-4 h-4 text-muted-foreground" />
                        </div>
                      )}
                      <div>
                        <div className="font-medium">{yeditor.name}</div>
                        {yeditor.bio && (
                          <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {yeditor.bio}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {yeditor.user_id ? (
                      <Badge variant="secondary">
                        {getUserName(yeditor.user_id)}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">
                        Not linked
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {yeditor.is_verified && (
                      <Badge variant="default" className="bg-green-500">
                        <Check className="w-3 h-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(yeditor.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {yeditor.user_id ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUnlinkUser(yeditor)}
                        >
                          <Unlink className="w-3 h-3 mr-1" />
                          Unlink
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedYeditor(yeditor)
                            setLinkDialogOpen(true)
                          }}
                        >
                          <Link className="w-3 h-3 mr-1" />
                          Link User
                        </Button>
                      )}
                      <Button
                        variant={yeditor.is_verified ? 'outline' : 'default'}
                        size="sm"
                        onClick={() => handleVerify(yeditor)}
                      >
                        <Check className="w-3 h-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Yeditor Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Yeditor</DialogTitle>
            <DialogDescription>
              Add a new editor to the system. You can link them to a user
              account later.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Editor name"
              />
            </div>
            <div className="space-y-2">
              <Label>Bio</Label>
              <Textarea
                value={newBio}
                onChange={(e) => setNewBio(e.target.value)}
                placeholder="Brief description..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateYeditor}
              disabled={!newName.trim() || creating}
            >
              {creating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Link User Dialog */}
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Link User to {selectedYeditor?.name}</DialogTitle>
            <DialogDescription>
              Select a user account to link to this yeditor profile.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label>Select User</Label>
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Choose a user..." />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.display_name || user.username}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleLinkUser}
              disabled={!selectedUserId || linking}
            >
              {linking && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Link User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export function HighlightsManagement() {
  const [highlights, setHighlights] = useState<Highlight[]>([])
  const [loading, setLoading] = useState(true)
  const [activeType, setActiveType] = useState<HighlightType | 'all'>('all')

  // Create/Edit dialog
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingHighlight, setEditingHighlight] = useState<Highlight | null>(
    null,
  )
  const [formData, setFormData] = useState<CreateHighlightData>({
    type: 'featured',
    content_id: '',
    content_type: 'album',
    title: '',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadHighlights()
  }, [])

  const loadHighlights = async () => {
    setLoading(true)
    try {
      const data = await highlightsService.getAllHighlights()
      setHighlights(data)
    } catch (error) {
      console.error('Error loading highlights:', error)
      toast.error('Failed to load highlights')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingHighlight(null)
    setFormData({
      type: 'featured',
      content_id: '',
      content_type: 'album',
      title: '',
    })
    setDialogOpen(true)
  }

  const handleEdit = (highlight: Highlight) => {
    setEditingHighlight(highlight)
    setFormData({
      type: highlight.type,
      content_id: highlight.content_id,
      content_type: highlight.content_type,
      title: highlight.title,
      subtitle: highlight.subtitle || undefined,
      description: highlight.description || undefined,
      image_url: highlight.image_url || undefined,
      countdown_date: highlight.countdown_date || undefined,
      is_active: highlight.is_active,
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!formData.title || !formData.content_id) {
      toast.error('Title and Content ID are required')
      return
    }

    setSaving(true)
    try {
      if (editingHighlight) {
        const updated = await highlightsService.updateHighlight(
          editingHighlight.id,
          formData,
        )
        if (updated) {
          setHighlights((prev) =>
            prev.map((h) => (h.id === editingHighlight.id ? updated : h)),
          )
          toast.success('Highlight updated')
        }
      } else {
        const created = await highlightsService.createHighlight(formData)
        if (created) {
          setHighlights((prev) => [...prev, created])
          toast.success('Highlight created')
        }
      }
      setDialogOpen(false)
    } catch (error) {
      console.error('Error saving highlight:', error)
      toast.error('Failed to save highlight')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this highlight?')) return

    try {
      const success = await highlightsService.deleteHighlight(id)
      if (success) {
        setHighlights((prev) => prev.filter((h) => h.id !== id))
        toast.success('Highlight deleted')
      }
    } catch (error) {
      console.error('Error deleting highlight:', error)
      toast.error('Failed to delete highlight')
    }
  }

  const handleToggleActive = async (highlight: Highlight) => {
    try {
      const success = await highlightsService.toggleHighlightActive(
        highlight.id,
      )
      if (success) {
        setHighlights((prev) =>
          prev.map((h) =>
            h.id === highlight.id ? { ...h, is_active: !h.is_active } : h,
          ),
        )
      }
    } catch (error) {
      console.error('Error toggling active:', error)
      toast.error('Failed to toggle active status')
    }
  }

  const filteredHighlights =
    activeType === 'all'
      ? highlights
      : highlights.filter((h) => h.type === activeType)

  const typeLabels: Record<HighlightType, string> = {
    eotw: 'Edit of the Week',
    definitive: 'Definitive Edit',
    featured: 'Featured',
    upcoming: 'Upcoming',
    collection: 'Collection',
    playlist: 'Playlist',
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Tabs
          value={activeType}
          onValueChange={(v) => setActiveType(v as HighlightType | 'all')}
        >
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="eotw">EOTW</TabsTrigger>
            <TabsTrigger value="definitive">Definitive</TabsTrigger>
            <TabsTrigger value="featured">Featured</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          </TabsList>
        </Tabs>
        <Button onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Create Highlight
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="w-5 h-5" />
            Highlights ({filteredHighlights.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Content</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredHighlights.map((highlight) => (
                <TableRow key={highlight.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{highlight.title}</div>
                      {highlight.subtitle && (
                        <div className="text-xs text-muted-foreground">
                          {highlight.subtitle}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {typeLabels[highlight.type]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {highlight.content_type}:{' '}
                    {highlight.content_id.substring(0, 8)}...
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={highlight.is_active ? 'default' : 'secondary'}
                    >
                      {highlight.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleActive(highlight)}
                      >
                        {highlight.is_active ? 'Deactivate' : 'Activate'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(highlight)}
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(highlight.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredHighlights.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center text-muted-foreground py-8"
                  >
                    No highlights found. Create one to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingHighlight ? 'Edit Highlight' : 'Create Highlight'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(v) =>
                    setFormData({ ...formData, type: v as HighlightType })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="eotw">Edit of the Week</SelectItem>
                    <SelectItem value="definitive">Definitive Edit</SelectItem>
                    <SelectItem value="featured">Featured</SelectItem>
                    <SelectItem value="upcoming">Upcoming Release</SelectItem>
                    <SelectItem value="collection">Collection</SelectItem>
                    <SelectItem value="playlist">Playlist</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Content Type *</Label>
                <Select
                  value={formData.content_type}
                  onValueChange={(v) =>
                    setFormData({ ...formData, content_type: v as any })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="album">Album</SelectItem>
                    <SelectItem value="single">Single</SelectItem>
                    <SelectItem value="compilation">Comp</SelectItem>
                    <SelectItem value="song">Song</SelectItem>
                    <SelectItem value="artwork">Artwork</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Content ID *</Label>
              <Input
                value={formData.content_id}
                onChange={(e) =>
                  setFormData({ ...formData, content_id: e.target.value })
                }
                placeholder="Album/Song ID from Server"
              />
            </div>
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="Display title"
              />
            </div>
            <div className="space-y-2">
              <Label>Subtitle</Label>
              <Input
                value={formData.subtitle || ''}
                onChange={(e) =>
                  setFormData({ ...formData, subtitle: e.target.value })
                }
                placeholder="Optional subtitle"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description || ''}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Optional description"
                rows={2}
              />
            </div>
            {formData.type === 'upcoming' && (
              <div className="space-y-2">
                <Label>Countdown Date</Label>
                <Input
                  type="datetime-local"
                  value={formData.countdown_date?.substring(0, 16) || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      countdown_date: e.target.value
                        ? new Date(e.target.value).toISOString()
                        : undefined,
                    })
                  }
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingHighlight ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
