import axios from 'axios';
import { useYouTubeOAuthStore } from '@/store/useYouTubeOAuthStore';

// Google OAuth configuration
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = import.meta.env.VITE_GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = import.meta.env.VITE_GOOGLE_REDIRECT_URI || `${window.location.origin}/youtube/callback`;

// YouTube API scopes
const SCOPES = [
  'https://www.googleapis.com/auth/youtube.readonly',
  'https://www.googleapis.com/auth/youtube.force-ssl', // For comments and likes
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email',
].join(' ');

class YouTubeOAuthService {
  private readonly YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';
  private readonly OAUTH_BASE = 'https://oauth2.googleapis.com';

  /**
   * Initiates OAuth flow by redirecting to Google consent screen
   */
  initiateAuth() {
    const state = this.generateRandomState();
    localStorage.setItem('oauth_state', state);

    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      response_type: 'code',
      scope: SCOPES,
      state,
      access_type: 'offline',
      prompt: 'consent',
    });

    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  /**
   * Handles OAuth callback and exchanges code for tokens
   */
  async handleCallback(code: string, state: string): Promise<void> {
    const savedState = localStorage.getItem('oauth_state');
    
    if (state !== savedState) {
      throw new Error('Invalid state parameter');
    }

    try {
      const response = await axios.post(`${this.OAUTH_BASE}/token`, {
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        grant_type: 'authorization_code',
      });

      const { access_token, refresh_token, expires_in } = response.data;

      useYouTubeOAuthStore.getState().setAuth({
        accessToken: access_token,
        refreshToken: refresh_token,
        expiresIn: expires_in,
      });

      // Fetch user info
      await this.fetchUserInfo(access_token);
      
      localStorage.removeItem('oauth_state');
    } catch (error) {
      console.error('OAuth callback error:', error);
      throw error;
    }
  }

  /**
   * Fetches user profile information
   */
  private async fetchUserInfo(accessToken: string) {
    try {
      const response = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      useYouTubeOAuthStore.getState().setUserInfo({
        id: response.data.id,
        name: response.data.name,
        email: response.data.email,
        picture: response.data.picture,
      });
    } catch (error) {
      console.error('Failed to fetch user info:', error);
    }
  }

  /**
   * Refreshes the access token using refresh token
   */
  async refreshAccessToken(): Promise<string | null> {
    const { refreshToken } = useYouTubeOAuthStore.getState();
    
    if (!refreshToken) {
      return null;
    }

    try {
      const response = await axios.post(`${this.OAUTH_BASE}/token`, {
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      });

      const { access_token, expires_in } = response.data;

      useYouTubeOAuthStore.getState().setAuth({
        accessToken: access_token,
        expiresIn: expires_in,
      });

      return access_token;
    } catch (error) {
      console.error('Token refresh failed:', error);
      useYouTubeOAuthStore.getState().logout();
      return null;
    }
  }

  /**
   * Gets valid access token, refreshing if necessary
   */
  private async getValidToken(): Promise<string | null> {
    const store = useYouTubeOAuthStore.getState();
    
    if (!store.isAuthenticated) {
      return null;
    }

    if (store.isTokenExpired()) {
      return await this.refreshAccessToken();
    }

    return store.accessToken;
  }

  /**
   * Makes authenticated API request
   */
  private async makeAuthRequest<T>(endpoint: string, params: Record<string, any> = {}): Promise<T> {
    const token = await this.getValidToken();
    
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await axios.get(`${this.YOUTUBE_API_BASE}${endpoint}`, {
      params,
      headers: { Authorization: `Bearer ${token}` },
    });

    return response.data;
  }

  /**
   * Get user's YouTube playlists
   */
  async getUserPlaylists(pageToken?: string) {
    return this.makeAuthRequest('/playlists', {
      part: 'snippet,contentDetails',
      mine: true,
      maxResults: 50,
      pageToken,
    });
  }

  /**
   * Get user's liked videos
   */
  async getLikedVideos(pageToken?: string) {
    return this.makeAuthRequest('/videos', {
      part: 'snippet,statistics',
      myRating: 'like',
      maxResults: 50,
      pageToken,
    });
  }

  /**
   * Search user's YouTube content
   */
  async searchMyContent(query: string, pageToken?: string) {
    return this.makeAuthRequest('/search', {
      part: 'snippet',
      forMine: true,
      q: query,
      type: 'video',
      maxResults: 25,
      pageToken,
    });
  }

  /**
   * Like a video
   */
  async likeVideo(videoId: string) {
    const token = await this.getValidToken();
    
    if (!token) {
      throw new Error('Not authenticated');
    }

    await axios.post(
      `${this.YOUTUBE_API_BASE}/videos/rate`,
      null,
      {
        params: { id: videoId, rating: 'like' },
        headers: { Authorization: `Bearer ${token}` },
      }
    );
  }

  /**
   * Remove like from a video
   */
  async unlikeVideo(videoId: string) {
    const token = await this.getValidToken();
    
    if (!token) {
      throw new Error('Not authenticated');
    }

    await axios.post(
      `${this.YOUTUBE_API_BASE}/videos/rate`,
      null,
      {
        params: { id: videoId, rating: 'none' },
        headers: { Authorization: `Bearer ${token}` },
      }
    );
  }

  /**
   * Post a comment on a video
   */
  async postComment(videoId: string, text: string) {
    const token = await this.getValidToken();
    
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await axios.post(
      `${this.YOUTUBE_API_BASE}/commentThreads`,
      {
        snippet: {
          videoId,
          topLevelComment: {
            snippet: {
              textOriginal: text,
            },
          },
        },
      },
      {
        params: { part: 'snippet' },
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    return response.data;
  }

  /**
   * Reply to a comment
   */
  async replyToComment(parentId: string, text: string) {
    const token = await this.getValidToken();
    
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await axios.post(
      `${this.YOUTUBE_API_BASE}/comments`,
      {
        snippet: {
          parentId,
          textOriginal: text,
        },
      },
      {
        params: { part: 'snippet' },
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    return response.data;
  }

  /**
   * Add video to playlist
   */
  async addToPlaylist(playlistId: string, videoId: string) {
    const token = await this.getValidToken();
    
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await axios.post(
      `${this.YOUTUBE_API_BASE}/playlistItems`,
      {
        snippet: {
          playlistId,
          resourceId: {
            kind: 'youtube#video',
            videoId,
          },
        },
      },
      {
        params: { part: 'snippet' },
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    return response.data;
  }

  /**
   * Create a new playlist
   */
  async createPlaylist(title: string, description?: string, privacyStatus: 'public' | 'private' | 'unlisted' = 'private') {
    const token = await this.getValidToken();
    
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await axios.post(
      `${this.YOUTUBE_API_BASE}/playlists`,
      {
        snippet: {
          title,
          description,
        },
        status: {
          privacyStatus,
        },
      },
      {
        params: { part: 'snippet,status' },
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    return response.data;
  }

  /**
   * Generate random state for CSRF protection
   */
  private generateRandomState(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Logout user
   */
  logout() {
    useYouTubeOAuthStore.getState().logout();
  }
}

export const youtubeOAuthService = new YouTubeOAuthService();
