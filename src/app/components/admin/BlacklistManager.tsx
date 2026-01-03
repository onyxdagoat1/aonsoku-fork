import { Plus, ShieldAlert, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import { Badge } from '@/app/components/ui/badge'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select'
import { Skeleton } from '@/app/components/ui/skeleton'
import { Database } from '@/lib/database.types'
import { supabase } from '@/lib/supabase'

type BlacklistWord = Database['public']['Tables']['blacklisted_words']['Row']

export function BlacklistManager() {
  const [words, setWords] = useState<BlacklistWord[]>([])
  const [loading, setLoading] = useState(true)
  const [newWord, setNewWord] = useState('')
  const [newSeverity, setNewSeverity] = useState<
    'warn' | 'block' | 'shadow_ban'
  >('warn')
  const [isAdding, setIsAdding] = useState(false)

  const fetchBlacklist = useCallback(async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('blacklisted_words')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setWords(data || [])
    } catch (error) {
      console.error('Error fetching blacklist:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBlacklist()
  }, [fetchBlacklist])

  const handleAddWord = async () => {
    if (!newWord.trim()) return

    try {
      setIsAdding(true)
      const { error } = await supabase.from('blacklisted_words').insert({
        word: newWord.trim().toLowerCase(),
        severity: newSeverity,
      })

      if (error) throw error

      toast.success(`"${newWord}" added to blacklist`)
      setNewWord('')
      fetchBlacklist()
    } catch (error) {
      console.error('Error adding word:', error)
      toast.error('Failed to add word')
    } finally {
      setIsAdding(false)
    }
  }

  const handleDeleteWord = async (id: string) => {
    try {
      const { error } = await supabase
        .from('blacklisted_words')
        .delete()
        .eq('id', id)

      if (error) throw error

      setWords(words.filter((w) => w.id !== id))
      toast.success('Word removed from blacklist')
    } catch (error) {
      console.error('Error removing word:', error)
      toast.error('Failed to remove word')
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-destructive" />
          Blacklist Management
        </h2>
        <p className="text-muted-foreground text-sm">
          Content containing these words will be automatically moderated based
          on severity settings.
        </p>
      </div>

      <div className="bg-card border border-border rounded-xl p-4 flex flex-col md:flex-row gap-4 items-end">
        <div className="w-full md:flex-1 space-y-2">
          <label className="text-sm font-medium">Word or Phrase</label>
          <Input
            value={newWord}
            onChange={(e) => setNewWord(e.target.value)}
            placeholder="e.g. spam"
          />
        </div>

        <div className="w-full md:w-48 space-y-2">
          <label className="text-sm font-medium">Severity</label>
          <Select
            value={newSeverity}
            onValueChange={(v: 'warn' | 'block' | 'shadow_ban') =>
              setNewSeverity(v)
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="warn">Warn User</SelectItem>
              <SelectItem value="block">Block Content</SelectItem>
              <SelectItem value="shadow_ban">Shadow Ban</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={handleAddWord}
          disabled={!newWord.trim() || isAdding}
          className="w-full md:w-auto"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add to Blacklist
        </Button>
      </div>

      <div className="bg-card/50 border border-border rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : words.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            No blacklisted words found.
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {words.map((item) => (
              <div
                key={item.id}
                className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <span className="font-mono font-medium">{item.word}</span>
                  <Badge
                    variant={
                      item.severity === 'block'
                        ? 'destructive'
                        : item.severity === 'shadow_ban'
                          ? 'secondary'
                          : 'outline'
                    }
                    className="capitalize opacity-80"
                  >
                    {item.severity.replace('_', ' ')}
                  </Badge>
                </div>

                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{new Date(item.created_at).toLocaleDateString()}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteWord(item.id)}
                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
