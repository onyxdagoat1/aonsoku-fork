import { Megaphone, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface Announcement {
  id: string
  title: string
  body: string
  created_at: string
}

export function AnnouncementsBanner() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [dismissedIds, setDismissedIds] = useState<string[]>([])

  useEffect(() => {
    // Load dismissed IDs from local storage
    const saved = localStorage.getItem('dismissed_announcements')
    if (saved) {
      setDismissedIds(JSON.parse(saved))
    }

    fetchAnnouncements()

    const channel = supabase
      .channel('public_announcements')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'announcements',
          filter: 'is_archived=eq.false',
        },
        () => fetchAnnouncements(),
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const fetchAnnouncements = async () => {
    const { data } = await supabase
      .from('announcements')
      .select('id,title,body,created_at')
      .eq('is_archived', false)
      .order('created_at', { ascending: false })

    if (data) {
      setAnnouncements(data)
    }
  }

  const handleDismiss = (id: string) => {
    const newDismissed = [...dismissedIds, id]
    setDismissedIds(newDismissed)
    localStorage.setItem(
      'dismissed_announcements',
      JSON.stringify(newDismissed),
    )
  }

  const visibleAnnouncements = announcements.filter(
    (a) => !dismissedIds.includes(a.id),
  )

  if (visibleAnnouncements.length === 0) return null

  return (
    <div className="space-y-4 mb-6">
      {visibleAnnouncements.map((announcement) => (
        <div
          key={announcement.id}
          className="group relative overflow-hidden rounded-xl bg-card border border-border p-4 transition-colors hover:bg-accent/5"
        >
          <div className="flex items-start gap-4">
            {/* Icon Box */}
            <div className="p-2.5 rounded-lg bg-primary/10 text-primary shrink-0">
              <Megaphone className="w-5 h-5" />
            </div>

            <div className="flex-1 min-w-0 py-0.5">
              <div className="flex items-center justify-between gap-4 mb-1">
                <h3 className="font-semibold text-foreground text-sm">
                  {announcement.title}
                </h3>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {new Date(announcement.created_at).toLocaleDateString(
                    undefined,
                    {
                      month: 'short',
                      day: 'numeric',
                    },
                  )}
                </span>
              </div>

              <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 hover:line-clamp-none transition-all">
                {announcement.body}
              </p>
            </div>

            <button
              onClick={() => handleDismiss(announcement.id)}
              className="p-1.5 -mr-1 -mt-1 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
              aria-label="Dismiss announcement"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
