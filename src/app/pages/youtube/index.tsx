import { useState, useEffect, useMemo } from 'react';
import { youtubeService } from '@/service/youtube';
import { YouTubeVideo, YouTubePlaylist, YouTubeChannelInfo } from '@/types/youtube';
import { YouTubeVideoCard } from '@/app/pages/youtube/components/VideoCard';
import { YouTubePlaylistCard } from '@/app/pages/youtube/components/PlaylistCard';
import { YouTubeChannelHeader } from '@/app/pages/youtube/components/ChannelHeader';
import { YouTubeFilters } from '@/app/pages/youtube/components/Filters';
import { YouTubeStats } from '@/app/pages/youtube/components/Stats';
import { YouTubeVideoView } from '@/app/pages/youtube/components/VideoView';
import { YouTubeAuthButton } from '@/app/pages/youtube/components/YouTubeAuthButton';
import { PlaylistImport } from '@/app/pages/youtube/components/PlaylistImport';
import { useYouTubeAuthStore } from '@/store/youtubeAuth.store';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Input } from '@/app/components/ui/input';
import { Card, CardContent } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Search, AlertCircle, Grid3x3, List, Youtube } from 'lucide-react';

type SortOption = 'date' | 'views' | 'likes' | 'title' | 'duration' | 'comments';
type FilterOption = 'all' | 'recent' | 'popular' | 'thisMonth' | 'thisYear';
type DurationFilter = 'all' | 'short' | 'medium' | 'long';
type ViewMode = 'grid' | 'list';

export default function YouTubePage() {
  const { isAuthenticated } = useYouTubeAuthStore();
  const [channelInfo, setChannelInfo] = useState<YouTubeChannelInfo | null>(null);
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [playlists, setPlaylists] = useState<YouTubePlaylist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('videos');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('date');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [durationFilter, setDurationFilter] = useState<DurationFilter>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedVideo, setSelectedVideo] = useState<YouTubeVideo | null>(null);

  useEffect(() => {
    loadChannelData();
  }, []);

  const loadChannelData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const cached = localStorage.getItem('youtube_cache');
      const cacheTime = localStorage.getItem('youtube_cache_time');
      const now = Date.now();
      
      if (cached && cacheTime && (now - parseInt(cacheTime)) < 3600000) {
        const data = JSON.parse(cached);
        setChannelInfo(data.channelInfo);
        setVideos(data.videos);
        setPlaylists(data.playlists);
        setLoading(false);
        return;
      }
      
      const [channelData, videosData, playlistsData] = await Promise.all([
        youtubeService.getChannelInfo(),
        youtubeService.getChannelVideos(50),
        youtubeService.getChannelPlaylists(50),
      ]);
      
      localStorage.setItem('youtube_cache', JSON.stringify({
        channelInfo: channelData,
        videos: videosData,
        playlists: playlistsData,
      }));
      localStorage.setItem('youtube_cache_time', now.toString());
      
      setChannelInfo(channelData);
      setVideos(videosData);
      setPlaylists(playlistsData);
    } catch (err) {
      console.error('Error loading YouTube data:', err);
      setError('Failed to load YouTube data. Please check your API key and try again.');
    } finally {
      setLoading(false);
    }
  };

  const clearCache = () => {
    localStorage.removeItem('youtube_cache');
    localStorage.removeItem('youtube_cache_time');
    loadChannelData();
  };

  const parseDuration = (duration: string): number => {
    const parts = duration.split(':');
    if (parts.length === 2) return parseInt(parts[0]) * 60 + parseInt(parts[1]);
    if (parts.length === 3) return parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);
    return 0;
  };

  const filteredAndSortedVideos = useMemo(() => {
    let filtered = videos;
    
    if (searchQuery) {
      filtered = filtered.filter(video => 
        video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        video.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    const now = Date.now();
    const weekAgo = now - (7 * 24 * 60 * 60 * 1000);
    const monthAgo = now - (30 * 24 * 60 * 60 * 1000);
    const yearAgo = now - (365 * 24 * 60 * 60 * 1000);
    
    if (filterBy === 'recent') {
      filtered = filtered.filter(video => 
        new Date(video.publishedAt).getTime() > weekAgo
      );
    } else if (filterBy === 'popular') {
      filtered = filtered.filter(video => 
        parseInt(video.viewCount) > 10000
      );
    } else if (filterBy === 'thisMonth') {
      filtered = filtered.filter(video => 
        new Date(video.publishedAt).getTime() > monthAgo
      );
    } else if (filterBy === 'thisYear') {
      filtered = filtered.filter(video => 
        new Date(video.publishedAt).getTime() > yearAgo
      );
    }
    
    if (durationFilter !== 'all') {
      filtered = filtered.filter(video => {
        const seconds = parseDuration(video.duration);
        if (durationFilter === 'short') return seconds < 240; // < 4 min
        if (durationFilter === 'medium') return seconds >= 240 && seconds < 1200; // 4-20 min
        if (durationFilter === 'long') return seconds >= 1200; // > 20 min
        return true;
      });
    }
    
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
        case 'views':
          return parseInt(b.viewCount) - parseInt(a.viewCount);
        case 'likes':
          return parseInt(b.likeCount) - parseInt(a.likeCount);
        case 'comments':
          return parseInt(b.commentCount) - parseInt(a.commentCount);
        case 'duration':
          return parseDuration(b.duration) - parseDuration(a.duration);
        case 'title':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });
    
    return sorted;
  }, [videos, searchQuery, sortBy, filterBy, durationFilter]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary"></div>
        <p className="text-muted-foreground">Loading YouTube content...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-destructive font-medium mb-2">Error Loading YouTube Data</p>
                <p className="text-sm text-muted-foreground mb-4">{error}</p>
                <Button onClick={clearCache} variant="outline" size="sm">
                  Retry
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (selectedVideo) {
    return (
      <div className="h-screen overflow-hidden">
        <YouTubeVideoView
          video={selectedVideo}
          onClose={() => setSelectedVideo(null)}
        />
      </div>
    );
  }

  return (
    <div className="w-full px-6 py-6 space-y-6">
      {channelInfo && <YouTubeChannelHeader channel={channelInfo} />}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <YouTubeStats 
            videos={videos} 
            playlists={playlists}
            onRefresh={clearCache}
          />
        </div>
        <div>
          <YouTubeAuthButton />
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
          <TabsList>
            <TabsTrigger value="videos">
              Videos ({filteredAndSortedVideos.length})
            </TabsTrigger>
            <TabsTrigger value="playlists">
              Playlists ({playlists.length})
            </TabsTrigger>
            {isAuthenticated && (
              <TabsTrigger value="myaccount">
                <Youtube className="w-4 h-4 mr-1" />
                My Account
              </TabsTrigger>
            )}
          </TabsList>
          
          <div className="flex gap-2">
            {isAuthenticated && activeTab === 'playlists' && (
              <PlaylistImport onImportComplete={(ids) => console.log('Imported:', ids)} />
            )}
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid3x3 className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        <TabsContent value="videos" className="space-y-4 mt-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search videos by title or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <YouTubeFilters
            sortBy={sortBy}
            setSortBy={setSortBy}
            filterBy={filterBy}
            setFilterBy={setFilterBy}
            durationFilter={durationFilter}
            setDurationFilter={setDurationFilter}
          />
          
          <div className={viewMode === 'grid' 
            ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4" 
            : "flex flex-col gap-3"
          }>
            {filteredAndSortedVideos.map((video) => (
              <YouTubeVideoCard 
                key={video.id} 
                video={video} 
                viewMode={viewMode}
                onClick={() => setSelectedVideo(video)}
              />
            ))}
          </div>
          
          {filteredAndSortedVideos.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              {searchQuery ? (
                <p>No videos found matching "{searchQuery}"</p>
              ) : (
                <p>No videos found. Please configure your YouTube API key.</p>
              )}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="playlists" className="mt-0">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
            {playlists.map((playlist) => (
              <YouTubePlaylistCard key={playlist.id} playlist={playlist} />
            ))}
          </div>
          {playlists.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              No playlists found.
            </div>
          )}
        </TabsContent>

        {isAuthenticated && (
          <TabsContent value="myaccount" className="mt-0">
            <div className="space-y-4">
              <Card>
                <CardContent className="pt-6">
                  <h3 className="text-lg font-semibold mb-4">YouTube Account Features</h3>
                  <div className="space-y-3 text-sm text-muted-foreground">
                    <p>With your YouTube account connected, you can:</p>
                    <ul className="list-disc list-inside space-y-2 ml-2">
                      <li>Like and dislike videos directly from yedits.net</li>
                      <li>Comment on videos and engage with the community</li>
                      <li>Import your YouTube playlists</li>
                      <li>Add videos to your YouTube playlists</li>
                      <li>Create new playlists on YouTube</li>
                      <li>Subscribe to channels</li>
                    </ul>
                    <p className="mt-4 text-xs">
                      Click on any video to watch it and access interactive features like liking, commenting, and saving to playlists.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}