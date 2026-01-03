import { Music2, Play, Plus, Save, Trash2 } from 'lucide-react'
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
import { Input } from '@/app/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select'

type RuleField = 'genre' | 'artist' | 'year' | 'bpm' | 'added'
type RuleOperator = 'equals' | 'contains' | 'gt' | 'lt' | 'between'

interface PlaylistRule {
  id: string
  field: RuleField
  operator: RuleOperator
  value: string
}

export default function SmartPlaylistBuilder() {
  const [rules, setRules] = useState<PlaylistRule[]>([
    { id: '1', field: 'genre', operator: 'equals', value: '' },
  ])
  const [playlistName, setPlaylistName] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

  const addRule = () => {
    setRules([
      ...rules,
      {
        id: Math.random().toString(36).substr(2, 9),
        field: 'genre',
        operator: 'equals',
        value: '',
      },
    ])
  }

  const removeRule = (id: string) => {
    if (rules.length === 1) return
    setRules(rules.filter((r) => r.id !== id))
  }

  const updateRule = (id: string, updates: Partial<PlaylistRule>) => {
    setRules(rules.map((r) => (r.id === id ? { ...r, ...updates } : r)))
  }

  const handleSave = async () => {
    if (!playlistName.trim()) {
      toast.error('Please enter a playlist name')
      return
    }

    setIsGenerating(true)
    // Mock save delay
    await new Promise((resolve) => setTimeout(resolve, 1000))
    toast.success(`Smart playlist "${playlistName}" created!`)
    setIsGenerating(false)
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
          Smart Playlist Builder
        </h1>
        <p className="text-muted-foreground">
          Create dynamic playlists that automatically update based on your
          rules.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Rules</CardTitle>
              <CardDescription>
                Define criteria for your playlist.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {rules.map((rule, index) => (
                <div key={rule.id} className="flex gap-3 items-end group">
                  <div className="flex-1 space-y-2">
                    {index === 0 && (
                      <label className="text-xs font-medium text-muted-foreground">
                        Field
                      </label>
                    )}
                    <Select
                      value={rule.field}
                      onValueChange={(v: RuleField) =>
                        updateRule(rule.id, { field: v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="genre">Genre</SelectItem>
                        <SelectItem value="artist">Artist</SelectItem>
                        <SelectItem value="year">Year</SelectItem>
                        <SelectItem value="bpm">BPM</SelectItem>
                        <SelectItem value="added">Date Added</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="w-[140px] space-y-2">
                    {index === 0 && (
                      <label className="text-xs font-medium text-muted-foreground">
                        Operator
                      </label>
                    )}
                    <Select
                      value={rule.operator}
                      onValueChange={(v: RuleOperator) =>
                        updateRule(rule.id, { operator: v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="equals">Is</SelectItem>
                        <SelectItem value="contains">Contains</SelectItem>
                        <SelectItem value="gt">Greater Than</SelectItem>
                        <SelectItem value="lt">Less Than</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex-1 space-y-2">
                    {index === 0 && (
                      <label className="text-xs font-medium text-muted-foreground">
                        Value
                      </label>
                    )}
                    <Input
                      value={rule.value}
                      onChange={(e) =>
                        updateRule(rule.id, { value: e.target.value })
                      }
                      placeholder={rule.field === 'year' ? '2023' : 'Value...'}
                    />
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeRule(rule.id)}
                    className="mb-[2px] text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}

              <Button
                variant="outline"
                size="sm"
                onClick={addRule}
                className="mt-2"
              >
                <Plus className="w-4 h-4 mr-2" /> Add Rule
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Save Playlist</CardTitle>
            </CardHeader>
            <CardContent className="flex gap-4">
              <Input
                placeholder="My Awesome Mix"
                value={playlistName}
                onChange={(e) => setPlaylistName(e.target.value)}
              />
              <Button onClick={handleSave} disabled={isGenerating}>
                {isGenerating ? (
                  <span className="animate-spin mr-2">⏳</span>
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save Playlist
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="h-full bg-muted/20 border-dashed">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Play className="w-4 h-4" /> Live Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground space-y-4">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                  <Music2 className="w-8 h-8 opacity-50" />
                </div>
                <div className="text-sm">
                  <p className="font-medium text-foreground">
                    Defining Rules...
                  </p>
                  <p>Tracks matching your criteria will appear here.</p>
                </div>
                <p className="text-xs opacity-50 italic">
                  (Mock preview: ~42 tracks found)
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
