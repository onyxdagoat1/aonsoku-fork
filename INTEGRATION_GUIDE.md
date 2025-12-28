# Integration Guide for New Features

This guide shows you exactly how to integrate the new layout, lyrics, and background features into your existing Aonsoku app.

## Quick Start Checklist

- [ ] Add DynamicBackground component to your root layout
- [ ] Add settings panels to your Settings dialog
- [ ] Update grid/list components to use layout store
- [ ] Replace existing lyrics display with enhanced version
- [ ] Test all features

---

## 1. Dynamic Background Integration

### Step 1: Add to Root Layout

Find your main app layout file (likely `src/App.tsx` or `src/app/layout/MainLayout.tsx`) and add:

```typescript
import { DynamicBackground } from '@/components/DynamicBackground'

function App() {
  return (
    <div className="relative min-h-screen">
      {/* Add this at the top level */}
      <DynamicBackground />
      
      {/* Your existing app content */}
      <YourExistingLayout />
    </div>
  )
}
```

**That's it!** The background will now automatically extract colors from album art and animate.

---

## 2. Settings Panels Integration

### Step 2: Add to Settings Dialog

Locate your settings dialog (likely in `src/app/components/` or `src/app/features/settings/`).

Add the new settings panels:

```typescript
import { LayoutSettingsPanel } from '@/app/components/settings/LayoutSettingsPanel'
import { BackgroundSettingsPanel } from '@/app/components/settings/BackgroundSettingsPanel'
import { LyricsSettingsPanel } from '@/app/components/settings/LyricsSettingsPanel'

function SettingsDialog() {
  const [currentPage, setCurrentPage] = useState('appearance')
  
  return (
    <Dialog>
      <DialogContent>
        <Tabs value={currentPage} onValueChange={setCurrentPage}>
          <TabsList>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="playback">Playback</TabsTrigger>
            {/* ... your other tabs */}
          </TabsList>
          
          <TabsContent value="appearance">
            {/* Add these panels */}
            <LayoutSettingsPanel />
            <Separator className="my-6" />
            <BackgroundSettingsPanel />
          </TabsContent>
          
          <TabsContent value="playback">
            {/* Add lyrics settings here */}
            <LyricsSettingsPanel />
            {/* ... your other playback settings */}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
```

### Alternative: Create New Settings Sections

If you prefer separate sections:

```typescript
<Tabs>
  <TabsList>
    <TabsTrigger value="layout">Layout</TabsTrigger>
    <TabsTrigger value="backgrounds">Backgrounds</TabsTrigger>
    <TabsTrigger value="lyrics">Lyrics</TabsTrigger>
  </TabsList>
  
  <TabsContent value="layout">
    <LayoutSettingsPanel />
  </TabsContent>
  
  <TabsContent value="backgrounds">
    <BackgroundSettingsPanel />
  </TabsContent>
  
  <TabsContent value="lyrics">
    <LyricsSettingsPanel />
  </TabsContent>
</Tabs>
```

---

## 3. Layout Density Integration

### Step 3: Update Album/Artist Grids

Find your album grid component (e.g., `AlbumGrid.tsx`, `ArtistGrid.tsx`) and update:

**Before:**
```typescript
function AlbumGrid({ albums }) {
  return (
    <div className="grid grid-cols-4 md:grid-cols-6 gap-4">
      {albums.map(album => <AlbumCard key={album.id} album={album} />)}
    </div>
  )
}
```

**After:**
```typescript
import { useGridSize } from '@/store/layout.store'
import { getGridClasses } from '@/utils/layoutHelpers'

function AlbumGrid({ albums }) {
  const { size } = useGridSize()
  
  return (
    <div className={getGridClasses(size)}>
      {albums.map(album => <AlbumCard key={album.id} album={album} />)}
    </div>
  )
}
```

### Step 4: Update List/Table Views

Find your song list component and update:

**Before:**
```typescript
function SongList({ songs }) {
  return (
    <div className="space-y-1">
      {songs.map(song => (
        <div key={song.id} className="h-12 flex items-center">
          {/* Song content */}
        </div>
      ))}
    </div>
  )
}
```

**After:**
```typescript
import { useListDensity } from '@/store/layout.store'
import { getListClasses } from '@/utils/layoutHelpers'

function SongList({ songs }) {
  const { density } = useListDensity()
  
  return (
    <div className="space-y-1">
      {songs.map(song => (
        <div key={song.id} className={getListClasses(density, 'row', 'flex items-center')}>
          {/* Song content */}
        </div>
      ))}
    </div>
  )
}
```

### Step 5: Update Sidebar

Find your sidebar component:

**Before:**
```typescript
function Sidebar() {
  return (
    <aside className="w-64 bg-background border-r">
      {/* Sidebar content */}
    </aside>
  )
}
```

**After:**
```typescript
import { useSidebarLayout } from '@/store/layout.store'
import { getSidebarClasses } from '@/utils/layoutHelpers'

function Sidebar() {
  const { width, isCollapsed } = useSidebarLayout()
  
  if (isCollapsed) return null
  
  return (
    <aside className={getSidebarClasses(width, 'bg-background border-r transition-all')}>
      {/* Sidebar content */}
    </aside>
  )
}
```

---

## 4. Enhanced Lyrics Integration

### Step 6: Replace Existing Lyrics Component

Find your lyrics display component and update:

**Before:**
```typescript
import { Lrc } from 'react-lrc'

function LyricsDisplay() {
  const currentSong = usePlayerCurrentSong()
  const progress = usePlayerProgress()
  
  return currentSong.lyrics ? (
    <Lrc lrc={currentSong.lyrics} currentTime={progress} />
  ) : (
    <div>No lyrics available</div>
  )
}
```

**After:**
```typescript
import { Lrc } from 'react-lrc'
import { useEnhancedLyrics } from '@/hooks/useEnhancedLyrics'
import { usePlayerProgress } from '@/store/player.store'
import { useLyricsSettings } from '@/store/player.store'
import { Loader2, Music } from 'lucide-react'

function LyricsDisplay() {
  const { lyrics, isLoading, error, hasLyrics } = useEnhancedLyrics()
  const progress = usePlayerProgress()
  const { preferSyncedLyrics } = useLyricsSettings()
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2">Loading lyrics...</span>
      </div>
    )
  }
  
  if (error || !hasLyrics) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-muted-foreground">
        <Music className="h-12 w-12 mb-2" />
        <p>{error || 'No lyrics available'}</p>
        {lyrics.source === 'none' && (
          <p className="text-sm mt-2">
            Enable automatic lyrics fetching in settings
          </p>
        )}
      </div>
    )
  }
  
  if (lyrics.isInstrumental) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <Music className="h-12 w-12 mb-2 text-muted-foreground" />
        <p className="text-lg font-medium">Instrumental Track</p>
      </div>
    )
  }
  
  // Show synced lyrics if available and preferred
  const shouldShowSynced = lyrics.synced && preferSyncedLyrics
  
  return (
    <div className="lyrics-container p-4">
      {/* Source indicator */}
      <div className="mb-4 text-xs text-muted-foreground">
        {lyrics.source === 'lrclib' && 'Lyrics from LRCLIB'}
        {lyrics.source === 'navidrome' && 'Embedded lyrics'}
      </div>
      
      {shouldShowSynced ? (
        <Lrc
          lrc={lyrics.synced}
          currentTime={progress}
          lineRenderer={({ line, active }) => (
            <div
              className={`transition-all duration-300 py-2 ${
                active
                  ? 'text-primary text-lg font-semibold scale-105'
                  : 'text-muted-foreground text-base'
              }`}
            >
              {line.content}
            </div>
          )}
        />
      ) : (
        <pre className="whitespace-pre-wrap text-sm leading-relaxed">
          {lyrics.plain}
        </pre>
      )}
    </div>
  )
}

export default LyricsDisplay
```

---

## 5. Missing UI Components

If you don't have these shadcn/ui components yet, install them:

```bash
# If using the shadcn CLI
npx shadcn-ui@latest add select
npx shadcn-ui@latest add slider
npx shadcn-ui@latest add switch
npx shadcn-ui@latest add label
npx shadcn-ui@latest add alert
npx shadcn-ui@latest add separator
```

These are already configured in your `components.json` file.

---

## 6. TypeScript Types

If you get TypeScript errors, ensure these are imported:

```typescript
// Add to your src/types/index.ts or create if missing
export type { GridSize, ListDensity, SidebarWidth } from './layoutContext'
```

---

## 7. Example: Full Page Implementation

Here's a complete example of an albums page using all features:

```typescript
import { useState } from 'react'
import { useGridSize } from '@/store/layout.store'
import { getGridClasses } from '@/utils/layoutHelpers'
import { useQuery } from '@tanstack/react-query'

function AlbumsPage() {
  const { size } = useGridSize()
  const [viewType, setViewType] = useState<'grid' | 'list'>('grid')
  
  const { data: albums, isLoading } = useQuery({
    queryKey: ['albums'],
    queryFn: fetchAlbums,
  })
  
  if (isLoading) return <Loading />
  
  return (
    <div className="p-6 space-y-4">
      {/* Header with view toggle */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Albums</h1>
        <div className="flex gap-2">
          <Button
            variant={viewType === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewType('grid')}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewType === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewType('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Content with dynamic layout */}
      {viewType === 'grid' ? (
        <div className={getGridClasses(size)}>
          {albums?.map(album => (
            <AlbumCard key={album.id} album={album} />
          ))}
        </div>
      ) : (
        <AlbumList albums={albums} />
      )}
    </div>
  )
}
```

---

## 8. Testing Checklist

After integration, test these scenarios:

### Layout Density
- [ ] Change grid size - albums should resize
- [ ] Change list density - row heights should adjust
- [ ] Change sidebar width - sidebar should resize
- [ ] Settings should persist on page reload

### Enhanced Lyrics
- [ ] Play song with embedded lyrics - should display immediately
- [ ] Play song without lyrics - should fetch from LRCLIB
- [ ] Toggle synced/plain lyrics preference
- [ ] Disable LRCLIB - should only show embedded lyrics
- [ ] Check instrumental tracks show appropriate message

### Dynamic Backgrounds
- [ ] Play different songs - background should change colors
- [ ] Adjust intensity - colors should get stronger/weaker
- [ ] Adjust blur - gradients should get sharper/softer
- [ ] Disable feature - background should disappear
- [ ] Check performance with rapid song changes

---

## 9. Troubleshooting

### "Module not found" errors

```bash
# Ensure all imports are correct
# Check that files are in the right locations
ls src/store/layout.store.ts
ls src/hooks/useEnhancedLyrics.ts
ls src/components/DynamicBackground.tsx
```

### TypeScript errors

```typescript
// Add to tsconfig.json if needed
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### Styles not applying

```bash
# Restart dev server
npm run dev

# Clear browser cache
# Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
```

### LRCLIB API not working

```typescript
// Check in browser console:
// 1. Network tab - should see requests to lrclib.net
// 2. Console - should see [LyricsAPI] logs
// 3. Enable LRCLIB in settings
```

---

## 10. Performance Tips

### For Large Libraries (10,000+ tracks)

1. **Use React.memo for list items:**
```typescript
import { memo } from 'react'

const SongListItem = memo(function SongListItem({ song }) {
  return <div>{/* ... */}</div>
})
```

2. **Virtual scrolling for long lists:**
```typescript
import { useVirtualizer } from '@tanstack/react-virtual'

// Already in your dependencies!
```

3. **Debounce background color changes:**
```typescript
import { useDebouncedCallback } from 'use-debounce'

// Already in your dependencies!
```

---

## 11. Next Steps

After successful integration:

1. **Customize styling** - Adjust colors, spacing to match your theme
2. **Add keyboard shortcuts** - Quick toggles for layout density
3. **Export/import settings** - Let users share their configurations
4. **Add more lyrics sources** - Genius, Musixmatch APIs
5. **Enhance backgrounds** - Add particle effects, audio reactivity

---

## Support

If you encounter issues:

1. Check the `FEATURES.md` file for detailed documentation
2. Review error messages in browser console
3. Verify all files are in correct locations
4. Ensure dependencies are installed
5. Check that settings are properly persisted

---

**Happy Coding!** 🎵✨

All features are designed to be:
- **Non-breaking**: Won't affect existing functionality
- **Performant**: Optimized for large libraries
- **Accessible**: Keyboard navigation and screen reader support
- **Customizable**: Extensive settings and theming options
