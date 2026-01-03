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
          className="relative overflow-hidden rounded-xl bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 p-4"
        >
          <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-indigo-500 to-purple-500"></div>
          <div className="flex items-start gap-4">
            <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400">
              <Megaphone className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                {announcement.title}
                <span className="text-[10px] font-normal text-muted-foreground bg-accent/50 px-2 py-0.5 rounded-full">
                  {new Date(announcement.created_at).toLocaleDateString()}
                </span>
              </h3>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                {announcement.body}
              </p>
            </div>
            <button
              onClick={() => handleDismiss(announcement.id)}
              className="p-1 text-muted-foreground hover:text-foreground hover:bg-black/10 rounded-full transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
