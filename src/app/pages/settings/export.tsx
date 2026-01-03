import {
  Database,
  Download,
  FileJson,
  FileText,
  Settings,
  ShieldCheck,
  Upload,
} from 'lucide-react'
import { useState } from 'react'
import { toast } from 'react-toastify'
import { Button } from '@/app/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/app/components/ui/card'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

export default function ExportSettings() {
  const { user } = useAuth()
  const [isExporting, setIsExporting] = useState<string | null>(null)

  const downloadFile = (
    filename: string,
    content: string,
    type = 'application/json',
  ) => {
    const blob = new Blob([content], { type })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleExport = async (type: 'backup' | 'history' | 'metadata') => {
    if (!user?.id) return
    setIsExporting(type)

    try {
      let data: any = {}
      const filename = `aonsoku-export-${type}-${new Date().toISOString().split('T')[0]}.json`

      if (type === 'backup') {
        const [prefs, searches, tags] = await Promise.all([
          supabase
            .from('user_preferences')
            .select('*')
            .eq('user_id', user.id)
            .single(),
          supabase.from('saved_searches').select('*').eq('user_id', user.id),
          supabase.from('custom_tags').select('*').eq('created_by', user.id),
        ])

        data = {
          preferences: prefs.data,
          saved_searches: searches.data,
          custom_tags: tags.data,
          exported_at: new Date().toISOString(),
          version: '1.0',
        }
      } else if (type === 'history') {
        const [queue, streams] = await Promise.all([
          supabase.from('queue_history').select('*').eq('user_id', user.id),
          supabase
            .from('stream_counts')
            .select('*')
            .eq('user_id', user.id)
            .range(0, 1000), // Limit to recent 1000 for now
        ])

        data = {
          queue_history: queue.data,
          stream_history: streams.data,
          note: 'Stream history limited to last 1000 entries',
        }
      } else if (type === 'metadata') {
        const [playlists, favorites, collections] = await Promise.all([
          supabase.from('playlists').select('*').eq('owner_id', user.id),
          supabase
            .from('profile_favorites')
            .select('*')
            .eq('profile_id', user.id),
          supabase.from('collections').select('*').eq('created_by', user.id),
        ])

        data = {
          playlists: playlists.data,
          favorites: favorites.data,
          collections: collections.data,
        }
      }

      downloadFile(filename, JSON.stringify(data, null, 2))
      toast.success(`${type} export complete!`)
    } catch (error) {
      console.error('Export failed:', error)
      toast.error('Export failed. Please try again.')
    } finally {
      setIsExporting(null)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <Database className="w-8 h-8 text-primary" />
          Data & Backup
        </h1>
        <p className="text-muted-foreground">
          Export your data, manage backups, and take control of your library
          information.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Settings Backup */}
        <Card className="md:col-span-2 bg-gradient-to-br from-card to-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" /> Full System Backup
            </CardTitle>
            <CardDescription>
              Create a complete JSON snapshot of your settings, saved searches,
              and custom tags.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex gap-4">
            <Button
              size="lg"
              onClick={() => handleExport('backup')}
              disabled={!!isExporting}
            >
              {isExporting === 'backup' ? (
                <span className="animate-spin mr-2">⏳</span>
              ) : (
                <Download className="w-5 h-5 mr-2" />
              )}
              Download Backup
            </Button>
            <Button size="lg" variant="outline" disabled>
              <Upload className="w-5 h-5 mr-2" />
              Restore from File (Coming Soon)
            </Button>
          </CardContent>
        </Card>

        {/* Listening History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-500" />
              Listening History
            </CardTitle>
            <CardDescription>
              Export your listening log and queue history as JSON.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              className="w-full"
              variant="secondary"
              onClick={() => handleExport('history')}
              disabled={!!isExporting}
            >
              <Download className="w-4 h-4 mr-2" />
              Export History
            </Button>
          </CardContent>
        </Card>

        {/* Library Metadata */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileJson className="w-5 h-5 text-orange-500" />
              Library Metadata
            </CardTitle>
            <CardDescription>
              Export your playlists, collections, and favorites.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              className="w-full"
              variant="secondary"
              onClick={() => handleExport('metadata')}
              disabled={!!isExporting}
            >
              <Download className="w-4 h-4 mr-2" />
              Export Metadata
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Privacy Note */}
      <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 flex gap-4 items-start">
        <ShieldCheck className="w-6 h-6 text-green-500 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="font-semibold text-green-700 dark:text-green-400">
            Your Data is Yours
          </h4>
          <p className="text-sm text-muted-foreground">
            All exports are generated locally. We do not store your export files
            on our servers. You can verify the contents of the JSON files with
            any text editor.
          </p>
        </div>
      </div>
    </div>
  )
}
