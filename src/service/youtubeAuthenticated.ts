import { youtubeAuthService } from './youtubeAuth';

interface ImportPlaylistResult {
  success: boolean;
  playlistId?: string;
  error?: string;
}

interface LikeVideoResult {
  success: boolean;
  error?: string;
}

interface CommentResult {
  success: boolean;
  commentId?: string;
  error?: string;
}

interface UserPlaylist {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  itemCount: number;
  privacy: string;
}

class YouTubeAuthenticatedService {
  private async makeAuthenticatedRequest(url: string, options: RequestInit = {}) {
    const accessToken = await youtubeAuthService.getValidAccessToken();
    
    if (!accessToken) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error?.message || 'Request failed');
    }

    return response.json();
  }

  /**
   * Get user's playlists
   */
  async getUserPlaylists(): Promise<UserPlaylist[]> {
    try {
      const data = await this.makeAuthenticatedRequest(
        'https://www.googleapis.com/youtube/v3/playlists?part=snippet,contentDetails&mine=true&maxResults=50'
      );

      return data.items.map((item: any) => ({
        id: item.id,
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnailUrl: item.snippet.thumbnails.medium.url,
        itemCount: item.contentDetails.itemCount,
        privacy: item.status?.privacyStatus || 'public',
      }));
    } catch (error) {
      console.error('Error fetching user playlists:', error);
      return [];
    }
  }

  /**
   * Create a new playlist
   */
  async createPlaylist(title: string, description: string = '', privacyStatus: 'public' | 'private' | 'unlisted' = 'public'): Promise<string | null> {
    try {
      const data = await this.makeAuthenticatedRequest(
        'https://www.googleapis.com/youtube/v3/playlists?part=snippet,status',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            snippet: {
              title,
              description,
            },
            status: {
              privacyStatus,
            },
          }),
        }
      );

      return data.id;
    } catch (error) {
      console.error('Error creating playlist:', error);
      return null;
    }
  }

  /**
   * Add video to playlist
   */
  async addVideoToPlaylist(playlistId: string, videoId: string): Promise<boolean> {
    try {
      await this.makeAuthenticatedRequest(
        'https://www.googleapis.com/youtube/v3/playlistItems?part=snippet',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            snippet: {
              playlistId,
              resourceId: {
                kind: 'youtube#video',
                videoId,
              },
            },
          }),
        }
      );

      return true;
    } catch (error) {
      console.error('Error adding video to playlist:', error);
      return false;
    }
  }

  /**
   * Like a video
   */
  async likeVideo(videoId: string): Promise<LikeVideoResult> {
    try {
      await this.makeAuthenticatedRequest(
        `https://www.googleapis.com/youtube/v3/videos/rate?id=${videoId}&rating=like`,
        { method: 'POST' }
      );

      return { success: true };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.message || 'Failed to like video' 
      };
    }
  }

  /**
   * Unlike a video
   */
  async unlikeVideo(videoId: string): Promise<LikeVideoResult> {
    try {
      await this.makeAuthenticatedRequest(
        `https://www.googleapis.com/youtube/v3/videos/rate?id=${videoId}&rating=none`,
        { method: 'POST' }
      );

      return { success: true };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.message || 'Failed to unlike video' 
      };
    }
  }

  /**
   * Dislike a video
   */
  async dislikeVideo(videoId: string): Promise<LikeVideoResult> {
    try {
      await this.makeAuthenticatedRequest(
        `https://www.googleapis.com/youtube/v3/videos/rate?id=${videoId}&rating=dislike`,
        { method: 'POST' }
      );

      return { success: true };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.message || 'Failed to dislike video' 
      };
    }
  }

  /**
   * Post a comment on a video
   */
  async commentOnVideo(videoId: string, text: string): Promise<CommentResult> {
    try {
      const data = await this.makeAuthenticatedRequest(
        'https://www.googleapis.com/youtube/v3/commentThreads?part=snippet',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            snippet: {
              videoId,
              topLevelComment: {
                snippet: {
                  textOriginal: text,
                },
              },
            },
          }),
        }
      );

      return { 
        success: true, 
        commentId: data.id 
      };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.message || 'Failed to post comment' 
      };
    }
  }

  /**
   * Reply to a comment
   */
  async replyToComment(commentId: string, text: string): Promise<CommentResult> {
    try {
      const data = await this.makeAuthenticatedRequest(
        'https://www.googleapis.com/youtube/v3/comments?part=snippet',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            snippet: {
              parentId: commentId,
              textOriginal: text,
            },
          }),
        }
      );

      return { 
        success: true, 
        commentId: data.id 
      };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.message || 'Failed to reply to comment' 
      };
    }
  }

  /**
   * Get user's liked videos
   */
  async getLikedVideos(maxResults: number = 50) {
    try {
      const data = await this.makeAuthenticatedRequest(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&myRating=like&maxResults=${maxResults}`
      );

      return data.items || [];
    } catch (error) {
      console.error('Error fetching liked videos:', error);
      return [];
    }
  }

  /**
   * Subscribe to a channel
   */
  async subscribeToChannel(channelId: string): Promise<boolean> {
    try {
      await this.makeAuthenticatedRequest(
        'https://www.googleapis.com/youtube/v3/subscriptions?part=snippet',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            snippet: {
              resourceId: {
                kind: 'youtube#channel',
                channelId,
              },
            },
          }),
        }
      );

      return true;
    } catch (error) {
      console.error('Error subscribing to channel:', error);
      return false;
    }
  }
}

export const youtubeAuthenticatedService = new YouTubeAuthenticatedService();