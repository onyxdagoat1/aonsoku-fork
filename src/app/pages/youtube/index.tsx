import { useState, useEffect, useMemo } from 'react';
import { youtubeService } from '@/service/youtube';
import { YouTubeVideo, YouTubePlaylist, YouTubeChannelInfo } from '@/types/youtube';
import { YouTubeVideoCard } from '@/app/pages/youtube/components/VideoCard';
import { YouTubePlaylistCard } from '@/app/pages/youtube/components/PlaylistCard';
import { YouTubeChannelHeader } from '@/app/pages/youtube/components/ChannelHeader';
import { YouTubeFilters } from '@/app/pages/youtube/components/Filters';
import { YouTubeStats } from '@/app/pages/youtube/components/Stats';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Input } from '@/app/components/ui/input';
import { Card, CardContent } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Search, AlertCircle } from 'lucide-react';

type SortOption = 'date' | 'views' | 'likes' | 'title';
type FilterOption = 'all' | 'recent' | 'popular';

export default function YouTubePage() {
  const [channelInfo, setChannelInfo] = useState<YouTubeChannelInfo | null>(null);
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [playlists, setPlaylists] = useState<YouTubePlaylist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('videos');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('date');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');

  useEffect(() => {
    loadChannelData();
  }, []);

  const loadChannelData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Check cache first
      const cached = localStorage.getItem('youtube_cache');
      const cacheTime = localStorage.getItem('youtube_cache_time');
      const now = Date.now();
      
      // Use cache if less than 1 hour old
      if (cached && cacheTime && (now - parseInt(cacheTime)) < 3600000) {
        const data = JSON.parse(cached);
        setChannelInfo(data.channelInfo);
        setVideos(data.videos);
        setPlaylists(data.playlists);
        setLoading(false);
        return;
      }
      
      // Fetch fresh data
      const [channelData, videosData, playlistsData] = await Promise.all([
        youtubeService.getChannelInfo(),
        youtubeService.getChannelVideos(50),
        youtubeService.getChannelPlaylists(50),
      ]);
      
      // Cache the data
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

  // Filter and sort videos
  const filteredAndSortedVideos = useMemo(() => {
    let filtered = videos;
    
    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(video => 
        video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        video.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Quick filters
    const now = Date.now();
    const weekAgo = now - (7 * 24 * 60 * 60 * 1000);
    
    if (filterBy === 'recent') {
      filtered = filtered.filter(video => 
        new Date(video.publishedAt).getTime() > weekAgo
      );
    } else if (filterBy === 'popular') {
      filtered = filtered.filter(video => 
        parseInt(video.viewCount) > 10000
      );
    }
    
    // Sort
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
        case 'views':
          return parseInt(b.viewCount) - parseInt(a.viewCount);
        case 'likes':
          return parseInt(b.likeCount) - parseInt(a.likeCount);
        case 'title':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });
    
    return sorted;
  }, [videos, searchQuery, sortBy, filterBy]);

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

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {channelInfo && <YouTubeChannelHeader channel={channelInfo} />}
      
      {/* Stats Dashboard */}
      <YouTubeStats 
        videos={videos} 
        playlists={playlists}
        onRefresh={clearCache}
      />
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="videos">
            Videos ({filteredAndSortedVideos.length})
          </TabsTrigger>
          <TabsTrigger value="playlists">
            Playlists ({playlists.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="videos" className="space-y-6">
          {/* Search Bar */}
          <div className="relative max-w-2xl">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search videos by title or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {/* Filters */}
          <YouTubeFilters
            sortBy={sortBy}
            setSortBy={setSortBy}
            filterBy={filterBy}
            setFilterBy={setFilterBy}
          />
          
          {/* Video Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
            {filteredAndSortedVideos.map((video) => (
              <YouTubeVideoCard key={video.id} video={video} />
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
        
        <TabsContent value="playlists" className="mt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
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
      </Tabs>
    </div>
  );
}