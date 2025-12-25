import { useState, useEffect } from 'react';
import { Input } from '@/app/components/ui/input';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { songService, type Song } from '@/api/songService';
import {
  Search,
  Music,
  Eye,
  Loader2,
  Clock,
  AlertCircle,
  X,
  Download,
  RefreshCw,
  ExternalLink,
  Info,
  FolderOpen,
} from 'lucide-react';
import { toast } from 'react-toastify';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';
import { getCoverArtUrl, getDownloadUrl } from '@/api/httpClient';
import { cn } from '@/lib/utils';
import { Label } from '@/app/components/ui/label';

export function ExistingSongEditor() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Song[]>([]);
  const [recentSongs, setRecentSongs] = useState<Song[]>([]);
  const [viewingSong, setViewingSong] = useState<Song | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    loadRecentSongs();
    checkScanStatus();
  }, []);

  const loadRecentSongs = async () => {
    try {
      const songs = await songService.getRecentSongs(20);
      setRecentSongs(songs);
    } catch (error) {
      console.error('Failed to load recent songs:', error);
    }
  };

  const checkScanStatus = async () => {
    try {
      const status = await songService.getScanStatus();
      setIsScanning(status.scanning);
    } catch (error) {
      console.error('Failed to check scan status:', error);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const results = await songService.searchSongs(searchQuery, 50);
      setSearchResults(results);
      
      if (results.length === 0) {
        toast.info('No songs found matching your search');
      }
    } catch (error) {
      toast.error('Failed to search songs');
    } finally {
      setIsSearching(false);
    }
  };

  const handleViewSong = (song: Song) => {
    setViewingSong(song);
    setIsViewerOpen(true);
  };

  const handleDownloadSong = (song: Song) => {
    const url = getDownloadUrl(song.id);
    window.open(url, '_blank');
    toast.info(
      <div>
        <strong>Download started</strong>
        <p className="text-xs mt-1">
          Edit with external tag editor, then trigger rescan
        </p>
      </div>
    );
  };

  const handleStartRescan = async () => {
    try {
      setIsScanning(true);
      await songService.startScan();
      toast.success(
        <div>
          <strong>Library scan started</strong>
          <p className="text-xs mt-1">
            Navidrome will refresh metadata from your files
          </p>
        </div>
      );
      
      // Poll scan status
      const interval = setInterval(async () => {
        const status = await songService.getScanStatus();
        if (!status.scanning) {
          setIsScanning(false);
          clearInterval(interval);
          toast.success('Library scan completed!');
          // Refresh the lists
          loadRecentSongs();
          if (searchQuery.trim()) {
            handleSearch();
          }
        }
      }, 3000);
    } catch (error) {
      setIsScanning(false);
      toast.error('Failed to start library scan');
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const SongCard = ({ song }: { song: Song }) => {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            {/* Cover Art */}
            <div className="flex-shrink-0">
              <div className="w-16 h-16 rounded bg-muted flex items-center justify-center overflow-hidden">
                {song.coverArt ? (
                  <img
                    src={getCoverArtUrl(song.coverArt, 'album', '100')}
                    alt="Cover art"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Music className="w-8 h-8 text-muted-foreground" />
                )}
              </div>
            </div>

            {/* Song Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium truncate text-sm">
                    {song.title}
                  </h4>
                  <p className="text-sm text-muted-foreground truncate">
                    {song.artist}
                    {song.album && ` • ${song.album}`}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleViewSong(song)}
                  >
                    <Eye className="w-3 h-3 mr-1" />
                    View
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownloadSong(song)}
                  >
                    <Download className="w-3 h-3 mr-1" />
                    Download
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                {song.year && <span>{song.year}</span>}
                {song.genre && (
                  <Badge variant="outline" className="text-xs">
                    {song.genre}
                  </Badge>
                )}
                {song.duration && <span>{formatDuration(song.duration)}</span>}
                {song.bitRate && (
                  <span>{Math.round(song.bitRate / 1000)} kbps</span>
                )}
                {song.size && <span>{formatFileSize(song.size)}</span>}
              </div>

              {(song.track || song.path) && (
                <div className="text-xs text-muted-foreground mt-1 space-y-1">
                  {song.track && (
                    <p>
                      Track {song.track}
                      {song.discNumber && ` • Disc ${song.discNumber}`}
                    </p>
                  )}
                  {song.path && (
                    <p className="truncate font-mono" title={song.path}>
                      <FolderOpen className="w-3 h-3 inline mr-1" />
                      {song.path}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const displaySongs = searchQuery.trim() ? searchResults : recentSongs;

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <div className="p-4 border rounded-lg bg-blue-500/10 border-blue-500/20">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h4 className="font-medium mb-2">How to Edit Song Tags</h4>
            <div className="text-sm text-muted-foreground space-y-2">
              <p>
                Navidrome reads metadata from your audio files but doesn't write changes back.
                To edit tags, you need to use external tag editing tools.
              </p>
              <div className="mt-3">
                <p className="font-medium text-foreground mb-1">Recommended workflow:</p>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>Find the song you want to edit using search</li>
                  <li>Download the file or note the file path</li>
                  <li>Edit tags using tools like:
                    <ul className="list-disc list-inside ml-6 mt-1">
                      <li><strong>MusicBrainz Picard</strong> - Advanced auto-tagging</li>
                      <li><strong>Mp3tag</strong> - Windows/Mac tag editor</li>
                      <li><strong>Kid3</strong> - Cross-platform editor</li>
                      <li><strong>Yate</strong> - macOS tag editor</li>
                    </ul>
                  </li>
                  <li>Save the edited file back to your music library</li>
                  <li>Click "Rescan Library" to refresh metadata in Navidrome</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Rescan Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleStartRescan}
          disabled={isScanning}
          variant="default"
        >
          {isScanning ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Scanning Library...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4 mr-2" />
              Rescan Library
            </>
          )}
        </Button>
      </div>

      {/* Search Bar */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by title, artist, or album..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-10"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSearchResults([]);
                }}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <Button
            onClick={handleSearch}
            disabled={isSearching || !searchQuery.trim()}
          >
            {isSearching ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Search className="w-4 h-4 mr-2" />
            )}
            Search
          </Button>
        </div>
      </div>

      {/* Results Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            {searchQuery.trim() ? (
              <>
                <Search className="w-5 h-5" />
                Search Results
              </>
            ) : (
              <>
                <Clock className="w-5 h-5" />
                Recently Added
              </>
            )}
          </h3>
          {displaySongs.length > 0 && (
            <Badge variant="secondary">
              {displaySongs.length} song{displaySongs.length !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>

        {isSearching ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : displaySongs.length > 0 ? (
          <div className="grid gap-3">
            {displaySongs.map((song) => (
              <SongCard key={song.id} song={song} />
            ))}
          </div>
        ) : searchQuery.trim() ? (
          <div className="text-center py-12 text-muted-foreground">
            <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No songs found matching "{searchQuery}"</p>
            <p className="text-sm mt-1">Try a different search term</p>
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <Music className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No recent songs to display</p>
            <p className="text-sm mt-1">Search for songs to view their metadata</p>
          </div>
        )}
      </div>

      {/* Metadata Viewer Dialog */}
      <Dialog open={isViewerOpen} onOpenChange={setIsViewerOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Song Metadata</DialogTitle>
            <DialogDescription>
              Read-only view of current metadata from Navidrome
            </DialogDescription>
          </DialogHeader>
          {viewingSong && (
            <div className="space-y-4">
              {/* Cover Art Preview */}
              {viewingSong.coverArt && (
                <div className="flex justify-center">
                  <img
                    src={getCoverArtUrl(viewingSong.coverArt, 'album', '300')}
                    alt="Cover art"
                    className="w-48 h-48 rounded-lg object-cover"
                  />
                </div>
              )}

              {/* Metadata Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <div className="p-2 border rounded bg-muted/50">
                    {viewingSong.title}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Artist</Label>
                  <div className="p-2 border rounded bg-muted/50">
                    {viewingSong.artist}
                  </div>
                </div>
                {viewingSong.album && (
                  <div className="space-y-2">
                    <Label>Album</Label>
                    <div className="p-2 border rounded bg-muted/50">
                      {viewingSong.album}
                    </div>
                  </div>
                )}
                {viewingSong.albumArtist && (
                  <div className="space-y-2">
                    <Label>Album Artist</Label>
                    <div className="p-2 border rounded bg-muted/50">
                      {viewingSong.albumArtist}
                    </div>
                  </div>
                )}
                {viewingSong.year && (
                  <div className="space-y-2">
                    <Label>Year</Label>
                    <div className="p-2 border rounded bg-muted/50">
                      {viewingSong.year}
                    </div>
                  </div>
                )}
                {viewingSong.genre && (
                  <div className="space-y-2">
                    <Label>Genre</Label>
                    <div className="p-2 border rounded bg-muted/50">
                      {viewingSong.genre}
                    </div>
                  </div>
                )}
                {viewingSong.track && (
                  <div className="space-y-2">
                    <Label>Track #</Label>
                    <div className="p-2 border rounded bg-muted/50">
                      {viewingSong.track}
                    </div>
                  </div>
                )}
                {viewingSong.discNumber && (
                  <div className="space-y-2">
                    <Label>Disc #</Label>
                    <div className="p-2 border rounded bg-muted/50">
                      {viewingSong.discNumber}
                    </div>
                  </div>
                )}
              </div>

              {/* File Info */}
              <div className="space-y-2 pt-4 border-t">
                <Label>File Information</Label>
                <div className="space-y-1 text-sm text-muted-foreground">
                  {viewingSong.path && (
                    <p className="font-mono text-xs break-all">
                      <strong>Path:</strong> {viewingSong.path}
                    </p>
                  )}
                  {viewingSong.duration && (
                    <p><strong>Duration:</strong> {formatDuration(viewingSong.duration)}</p>
                  )}
                  {viewingSong.bitRate && (
                    <p><strong>Bitrate:</strong> {Math.round(viewingSong.bitRate / 1000)} kbps</p>
                  )}
                  {viewingSong.size && (
                    <p><strong>Size:</strong> {formatFileSize(viewingSong.size)}</p>
                  )}
                  {viewingSong.suffix && (
                    <p><strong>Format:</strong> {viewingSong.suffix.toUpperCase()}</p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4 border-t">
                <Button
                  onClick={() => handleDownloadSong(viewingSong)}
                  className="flex-1"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download to Edit
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsViewerOpen(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
