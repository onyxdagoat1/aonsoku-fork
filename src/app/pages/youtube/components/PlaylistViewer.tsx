import { useState, useEffect } from 'react';
import { YouTubePlaylist, YouTubeVideo } from '@/types/youtube';
import { youtubeService } from '@/service/youtube';
import { YouTubeVideoCard } from './VideoCard';

interface PlaylistViewerProps {
  playlist: YouTubePlaylist;
  onVideoSelect?: (video: YouTubeVideo) => void;
}

export function YouTubePlaylistViewer({ playlist, onVideoSelect }: PlaylistViewerProps) {
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPlaylistVideos();
  }, [playlist.id]);

  const loadPlaylistVideos = async () => {
    setLoading(true);
    try {
      const videosData = await youtubeService.getPlaylistVideos(playlist.id);
      setVideos(videosData);
    } catch (error) {
      console.error('Error loading playlist videos:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {playlist.description && (
        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
          {playlist.description}
        </p>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {videos.map((video) => (
          <YouTubeVideoCard 
            key={video.id} 
            video={video} 
            onClick={() => onVideoSelect?.(video)}
          />
        ))}
      </div>
    </div>
  );
}