import { useYouTubeAuthStore } from '@/store/youtubeAuth.store';

const YOUTUBE_CLIENT_ID = import.meta.env.VITE_YOUTUBE_OAUTH_CLIENT_ID || '';
const YOUTUBE_CLIENT_SECRET = import.meta.env.VITE_YOUTUBE_OAUTH_CLIENT_SECRET || '';
const REDIRECT_URI = `${window.location.origin}/youtube/callback`;

const SCOPES = [
  'https://www.googleapis.com/auth/youtube.readonly',
  'https://www.googleapis.com/auth/youtube.force-ssl',
  'https://www.googleapis.com/auth/youtubepartner',
].join(' ');

class YouTubeAuthService {
  /**
   * Initiate OAuth flow
   */
  initiateOAuth() {
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.append('client_id', YOUTUBE_CLIENT_ID);
    authUrl.searchParams.append('redirect_uri', REDIRECT_URI);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('scope', SCOPES);
    authUrl.searchParams.append('access_type', 'offline');
    authUrl.searchParams.append('prompt', 'consent');
    authUrl.searchParams.append('state', this.generateState());
    
    window.location.href = authUrl.toString();
  }

  /**
   * Handle OAuth callback
   */
  async handleCallback(code: string): Promise<boolean> {
    try {
      const tokenResponse = await this.exchangeCodeForToken(code);
      
      const { access_token, refresh_token, expires_in } = tokenResponse;
      
      // Store tokens
      useYouTubeAuthStore.getState().setTokens(access_token, refresh_token, expires_in);
      
      // Get user info
      const userInfo = await this.getUserInfo(access_token);
      useYouTubeAuthStore.getState().setUserInfo(userInfo);
      
      return true;
    } catch (error) {
      console.error('OAuth callback error:', error);
      return false;
    }
  }

  /**
   * Exchange authorization code for tokens
   */
  private async exchangeCodeForToken(code: string) {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: YOUTUBE_CLIENT_ID,
        client_secret: YOUTUBE_CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        grant_type: 'authorization_code',
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to exchange code for token');
    }

    return response.json();
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(): Promise<boolean> {
    const { refreshToken } = useYouTubeAuthStore.getState();
    
    if (!refreshToken) {
      return false;
    }

    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: YOUTUBE_CLIENT_ID,
          client_secret: YOUTUBE_CLIENT_SECRET,
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to refresh token');
      }

      const { access_token, expires_in } = await response.json();
      useYouTubeAuthStore.getState().setTokens(access_token, refreshToken, expires_in);
      
      return true;
    } catch (error) {
      console.error('Token refresh error:', error);
      useYouTubeAuthStore.getState().clearAuth();
      return false;
    }
  }

  /**
   * Get user info from Google
   */
  private async getUserInfo(accessToken: string) {
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get user info');
    }

    return response.json();
  }

  /**
   * Get valid access token (refresh if needed)
   */
  async getValidAccessToken(): Promise<string | null> {
    const store = useYouTubeAuthStore.getState();
    
    if (!store.isAuthenticated) {
      return null;
    }

    if (store.needsRefresh()) {
      const refreshed = await this.refreshAccessToken();
      if (!refreshed) {
        return null;
      }
    }

    return store.accessToken;
  }

  /**
   * Sign out
   */
  signOut() {
    useYouTubeAuthStore.getState().clearAuth();
  }

  /**
   * Generate random state for CSRF protection
   */
  private generateState(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }
}

export const youtubeAuthService = new YouTubeAuthService();