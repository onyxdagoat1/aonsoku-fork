import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface YouTubeAuthState {
  isAuthenticated: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: number | null;
  userInfo: {
    id: string;
    email: string;
    name: string;
    picture: string;
  } | null;
  
  // Actions
  setTokens: (accessToken: string, refreshToken: string, expiresIn: number) => void;
  setUserInfo: (userInfo: YouTubeAuthState['userInfo']) => void;
  clearAuth: () => void;
  isTokenExpired: () => boolean;
  needsRefresh: () => boolean;
}

export const useYouTubeAuthStore = create<YouTubeAuthState>()(  
  persist(
    (set, get) => ({
      isAuthenticated: false,
      accessToken: null,
      refreshToken: null,
      expiresAt: null,
      userInfo: null,

      setTokens: (accessToken, refreshToken, expiresIn) => {
        const expiresAt = Date.now() + (expiresIn * 1000);
        set({ 
          accessToken, 
          refreshToken, 
          expiresAt,
          isAuthenticated: true 
        });
      },

      setUserInfo: (userInfo) => {
        set({ userInfo });
      },

      clearAuth: () => {
        set({
          isAuthenticated: false,
          accessToken: null,
          refreshToken: null,
          expiresAt: null,
          userInfo: null,
        });
      },

      isTokenExpired: () => {
        const { expiresAt } = get();
        if (!expiresAt) return true;
        return Date.now() >= expiresAt;
      },

      needsRefresh: () => {
        const { expiresAt } = get();
        if (!expiresAt) return true;
        // Refresh if token expires in less than 5 minutes
        return Date.now() >= (expiresAt - 5 * 60 * 1000);
      },
    }),
    {
      name: 'youtube-auth-storage',
    }
  )
);