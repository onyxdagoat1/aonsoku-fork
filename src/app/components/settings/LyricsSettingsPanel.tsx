import { Label } from '@/lib/components/ui/label'
import { Switch } from '@/lib/components/ui/switch'
import {
  useLyricsSettings,
  usePrivacySettings,
} from '@/store/player.store'
import { Info, Music2, Globe } from 'lucide-react'
import { Alert, AlertDescription } from '@/lib/components/ui/alert'

export function LyricsSettingsPanel() {
  const { preferSyncedLyrics, setPreferSyncedLyrics } = useLyricsSettings()
  const { lrcLibEnabled, setLrcLibEnabled } = usePrivacySettings()

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Lyrics Settings</h3>

      {/* Prefer Synced Lyrics */}
      <div className="flex items-center justify-between space-x-2">
        <div className="flex items-center gap-2">
          <Music2 className="h-4 w-4 text-muted-foreground" />
          <div className="space-y-0.5">
            <Label htmlFor="prefer-synced" className="text-sm font-medium">
              Prefer Synced Lyrics
            </Label>
            <p className="text-xs text-muted-foreground">
              Show time-synced lyrics when available
            </p>
          </div>
        </div>
        <Switch
          id="prefer-synced"
          checked={preferSyncedLyrics}
          onCheckedChange={setPreferSyncedLyrics}
        />
      </div>

      {/* LRCLIB API Integration */}
      <div className="flex items-center justify-between space-x-2">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-muted-foreground" />
          <div className="space-y-0.5">
            <Label htmlFor="lrclib-enabled" className="text-sm font-medium">
              Automatic Lyrics Fetching
            </Label>
            <p className="text-xs text-muted-foreground">
              Fetch missing lyrics from LRCLIB
            </p>
          </div>
        </div>
        <Switch
          id="lrclib-enabled"
          checked={lrcLibEnabled}
          onCheckedChange={setLrcLibEnabled}
        />
      </div>

      {lrcLibEnabled && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription className="text-sm">
            When enabled, the app will automatically search for lyrics on{' '}
            <a
              href="https://lrclib.net"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-primary"
            >
              LRCLIB
            </a>
            {' '}if they're not found in your music files. This sends song metadata
            (title, artist, album) to their free API.
          </AlertDescription>
        </Alert>
      )}

      <div className="rounded-lg border border-border bg-muted/50 p-4 space-y-2">
        <p className="text-sm font-medium">How Enhanced Lyrics Work:</p>
        <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
          <li>First checks your music files for embedded lyrics</li>
          <li>If not found and enabled, searches LRCLIB API</li>
          <li>Displays synced lyrics with real-time highlighting</li>
          <li>Falls back to plain text lyrics if synced unavailable</li>
        </ol>
      </div>
    </div>
  )
}
