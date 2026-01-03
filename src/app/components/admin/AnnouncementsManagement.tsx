import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'react-toastify'
import { Megaphone, Archive, ArchiveRestore, Trash2, RefreshCcw } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Textarea } from '@/app/components/ui/textarea'

interface AnnouncementRow {
  id: string
  title: string
  body: string
  created_by: string
  created_at: string
  is_archived?: boolean
  archived_at?: string | null
}

export function AnnouncementsManagement() {
  const { profile } = useAuth()
  const [view, setView] = useState<'current' | 'archived'>('current')
  const [loading, setLoading] = useState(true)
  const [announcements, setAnnouncements] = useState<AnnouncementRow[]>([])
  const [authorNames, setAuthorNames] = useState<Map<string, string>>(new Map())

  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [posting, setPosting] = useState(false)

  const canManage = !!profile?.is_admin

  const loadAnnouncements = useCallback(async () => {
    setLoading(true)
    try {
      const base = supabase
        .from('announcements')
        .select('id,title,body,created_by,created_at,is_archived,archived_at')
        .order('created_at', { ascending: false })

      const filtered = view === 'archived' ? base.eq('is_archived', true) : base.eq('is_archived', false)

      let res: any = await filtered.limit(100)
      if (res.error && (res.error as any).code === '42703') {
        res = await supabase
          .from('announcements')
          .select('id,title,body,created_by,created_at')
          .order('created_at', { ascending: false })
          .limit(100)
      }

      if (res.error) throw res.error

      const rows: AnnouncementRow[] = res.data || []
      setAnnouncements(rows)

      const ids = Array.from(new Set(rows.map((r) => r.created_by).filter(Boolean)))
      if (ids.length) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id,username,display_name')
          .in('id', ids)

        const mapped = new Map<string, string>()
        for (const p of profiles || []) {
          mapped.set(p.id, p.display_name || p.username || 'Unknown')
        }
        setAuthorNames(mapped)
      } else {
        setAuthorNames(new Map())
      }
    } catch (e) {
      console.error('Error loading announcements:', e)
      toast.error('Failed to load announcements')
    } finally {
      setLoading(false)
    }
  }, [view])

  useEffect(() => {
    void loadAnnouncements()
  }, [loadAnnouncements])

  const postAnnouncement = async () => {
    if (!canManage || !profile?.id) return
    const t = title.trim()
    const b = body.trim()
    if (!t || !b) return

    setPosting(true)
    try {
      const { error } = await supabase.from('announcements').insert({
        title: t,
        body: b,
        created_by: profile.id,
      })
      if (error) throw error
      setTitle('')
      setBody('')
      toast.success('Announcement posted')
      void loadAnnouncements()
    } catch (e) {
      console.error('Error posting announcement:', e)
      toast.error('Failed to post announcement')
    } finally {
      setPosting(false)
    }
  }

  const archiveAnnouncement = async (id: string) => {
    if (!canManage) return
    try {
      const { error } = await supabase
        .from('announcements')
        .update({ is_archived: true, archived_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
      toast.success('Announcement archived')
      void loadAnnouncements()
    } catch (e) {
      console.error('Error archiving announcement:', e)
      toast.error('Failed to archive announcement')
    }
  }

  const unarchiveAnnouncement = async (id: string) => {
    if (!canManage) return
    try {
      const { error } = await supabase
        .from('announcements')
        .update({ is_archived: false, archived_at: null })
        .eq('id', id)
      if (error) throw error
      toast.success('Announcement restored')
      void loadAnnouncements()
    } catch (e) {
      console.error('Error restoring announcement:', e)
      toast.error('Failed to restore announcement')
    }
  }

  const deleteAnnouncement = async (id: string) => {
    if (!canManage) return
    if (!window.confirm('Delete this announcement? This cannot be undone.')) return

    try {
      const { error } = await supabase.from('announcements').delete().eq('id', id)
      if (error) throw error
      toast.success('Announcement deleted')
      void loadAnnouncements()
    } catch (e) {
      console.error('Error deleting announcement:', e)
      toast.error('Failed to delete announcement')
    }
  }

  const emptyLabel = useMemo(() => {
    return view === 'archived' ? 'No archived announcements' : 'No current announcements'
  }, [view])

  if (!canManage) {
    return (
      <div className="bg-card border border-border rounded-2xl p-8">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Megaphone className="w-4 h-4" />
          <span>Admin access required.</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Megaphone className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Announcements</h2>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={view === 'current' ? 'default' : 'outline'}
            onClick={() => setView('current')}
            className="text-xs"
          >
            Current
          </Button>
          <Button
            size="sm"
            variant={view === 'archived' ? 'default' : 'outline'}
            onClick={() => setView('archived')}
            className="text-xs"
          >
            Archived
          </Button>
          <Button size="sm" variant="outline" onClick={() => void loadAnnouncements()} className="text-xs">
            <RefreshCcw className="w-3 h-3 mr-1" />
            Refresh
          </Button>
        </div>
      </div>

      {view === 'current' && (
        <div className="bg-card border border-border rounded-2xl p-6 space-y-3">
          <div className="text-sm font-medium">Post announcement</div>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" />
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write an announcement visible to everyone..."
            className="resize-none"
          />
          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={postAnnouncement}
              disabled={posting || !title.trim() || !body.trim()}
            >
              {posting ? 'Posting…' : 'Post'}
            </Button>
          </div>
        </div>
      )}

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-muted-foreground">Loading…</div>
        ) : announcements.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground">{emptyLabel}</div>
        ) : (
          <div className="divide-y divide-border">
            {announcements.map((a) => (
              <div key={a.id} className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="font-semibold text-foreground truncate">{a.title}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {new Date(a.created_at).toLocaleString()} · By {authorNames.get(a.created_by) || 'Unknown'}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {view === 'current' ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => void archiveAnnouncement(a.id)}
                        className="text-xs"
                      >
                        <Archive className="w-3 h-3 mr-1" />
                        Archive
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => void unarchiveAnnouncement(a.id)}
                        className="text-xs"
                      >
                        <ArchiveRestore className="w-3 h-3 mr-1" />
                        Restore
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => void deleteAnnouncement(a.id)}
                      className="text-xs"
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground mt-3 whitespace-pre-wrap">{a.body}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
