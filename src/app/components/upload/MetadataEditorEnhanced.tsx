import { FileText, Image, Music, Save, Settings, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Label } from '@/app/components/ui/label'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/app/components/ui/tabs'
import { Textarea } from '@/app/components/ui/textarea'
import { ERAS } from '@/config/eras'
import type { MusicMetadata } from '@/types/upload'
import { YeditorSelector } from '../yeditor/YeditorSelector'
import { CoverArtUpload } from './CoverArtUpload'
import { GenreSelector } from './GenreSelector'

interface MetadataEditorEnhancedProps {
  initialMetadata?: MusicMetadata
  onSave: (metadata: MusicMetadata, coverArt?: File) => void
  onCancel?: () => void
  fileName?: string
}

export function MetadataEditorEnhanced({
  initialMetadata,
  onSave,
  onCancel,
  fileName,
}: MetadataEditorEnhancedProps) {
  const [metadata, setMetadata] = useState<MusicMetadata>(initialMetadata || {})
  const [coverArtFile, setCoverArtFile] = useState<File | null>(null)
  const [activeTab, setActiveTab] = useState('basic')

  useEffect(() => {
    if (initialMetadata) {
      setMetadata(initialMetadata)
    }
  }, [initialMetadata])

  const handleChange = (field: keyof MusicMetadata, value: string | number) => {
    setMetadata((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(metadata, coverArtFile || undefined)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {fileName && (
        <div className="pb-2 border-b">
          <p className="text-sm font-medium truncate">{fileName}</p>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic" className="gap-2">
            <Music className="w-4 h-4" />
            <span className="hidden sm:inline">Basic Info</span>
          </TabsTrigger>
          <TabsTrigger value="advanced" className="gap-2">
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">Advanced</span>
          </TabsTrigger>
          <TabsTrigger value="artwork" className="gap-2">
            <Image className="w-4 h-4" />
            <span className="hidden sm:inline">Artwork</span>
          </TabsTrigger>
          <TabsTrigger value="lyrics" className="gap-2">
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Lyrics</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={metadata.title || ''}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder="Song title"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="artist">Artist *</Label>
              <Input
                id="artist"
                value={metadata.artist || ''}
                onChange={(e) => handleChange('artist', e.target.value)}
                placeholder="Artist name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="album">Album</Label>
              <Input
                id="album"
                value={metadata.album || ''}
                onChange={(e) => handleChange('album', e.target.value)}
                placeholder="Album name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="albumArtist">Album Artist</Label>
              <Input
                id="albumArtist"
                value={metadata.albumArtist || ''}
                onChange={(e) => handleChange('albumArtist', e.target.value)}
                placeholder="Album artist (if different)"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="year">Year</Label>
              <Input
                id="year"
                type="number"
                min="1900"
                max="2100"
                value={metadata.year || ''}
                onChange={(e) =>
                  handleChange('year', parseInt(e.target.value) || 0)
                }
                placeholder="2024"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="genre">Genre</Label>
              <GenreSelector
                value={metadata.genre}
                onChange={(genre) => handleChange('genre', genre)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="era">Era</Label>
              <select
                id="era"
                value={metadata.era || ''}
                onChange={(e) => handleChange('era', e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Select Era</option>
                {ERAS.map((era) => (
                  <option key={era.id} value={era.id}>
                    {era.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="yeditor">Editor (Yeditor) *</Label>
              <YeditorSelector
                value={metadata.yeditorId}
                onChange={(yeditorId, yeditorName) => {
                  setMetadata((prev) => ({
                    ...prev,
                    yeditorId,
                    yeditorName,
                  }))
                }}
                required
              />
              <p className="text-xs text-muted-foreground">
                Select who edited/created this comp. Required for all uploads.
              </p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="track">Track Number</Label>
              <Input
                id="track"
                type="number"
                min="1"
                value={metadata.track || ''}
                onChange={(e) =>
                  handleChange('track', parseInt(e.target.value) || 0)
                }
                placeholder="1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="disc">Disc Number</Label>
              <Input
                id="disc"
                type="number"
                min="1"
                value={metadata.disc || ''}
                onChange={(e) =>
                  handleChange('disc', parseInt(e.target.value) || 0)
                }
                placeholder="1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="composer">Composer</Label>
              <Input
                id="composer"
                value={metadata.composer || ''}
                onChange={(e) => handleChange('composer', e.target.value)}
                placeholder="Composer name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bpm">BPM (Tempo)</Label>
              <Input
                id="bpm"
                type="number"
                min="1"
                max="300"
                value={metadata.bpm || ''}
                onChange={(e) =>
                  handleChange('bpm', parseInt(e.target.value) || 0)
                }
                placeholder="120"
              />
            </div>

            <div className="space-y-2 col-span-1 md:col-span-2">
              <Label htmlFor="comment">Comment</Label>
              <Textarea
                id="comment"
                value={metadata.comment || ''}
                onChange={(e) => handleChange('comment', e.target.value)}
                placeholder="Additional notes or comments"
                rows={4}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="artwork" className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>Album Artwork</Label>
            <p className="text-sm text-muted-foreground mb-4">
              Upload custom cover art for this track. Supports drag & drop, file
              selection, or paste from clipboard.
            </p>
            <CoverArtUpload
              onCoverArtSelected={setCoverArtFile}
              currentCoverArt={metadata.coverArt}
            />
            {coverArtFile && (
              <div className="p-3 border rounded-lg bg-muted/50">
                <p className="text-sm font-medium">
                  Selected: {coverArtFile.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  Size: {(coverArtFile.size / 1024).toFixed(2)} KB
                </p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="lyrics" className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="lyrics">Lyrics</Label>
            <p className="text-sm text-muted-foreground">
              Add or edit song lyrics. These will be embedded in the audio file.
            </p>
            <Textarea
              id="lyrics"
              value={metadata.lyrics || ''}
              onChange={(e) => handleChange('lyrics', e.target.value)}
              placeholder="Enter song lyrics here...&#10;&#10;Verse 1:&#10;...&#10;&#10;Chorus:&#10;..."
              rows={12}
              className="font-mono text-sm"
            />
            {metadata.lyrics && (
              <p className="text-xs text-muted-foreground">
                {metadata.lyrics.split('\n').length} lines
              </p>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex gap-2 justify-end pt-4 border-t">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
        )}
        <Button type="submit">
          <Save className="w-4 h-4 mr-2" />
          Save Metadata
        </Button>
      </div>
    </form>
  )
}
