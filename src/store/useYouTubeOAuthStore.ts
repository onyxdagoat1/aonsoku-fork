import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface YouTubeOAuthState {
  isAuthenticated: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: number | null;
  userInfo: {
    id: string;
    name: string;
    email: string;
    picture: string;
  } | null;
  
  // Actions
  setAuth: (data: {
    accessToken: string;
    refreshToken?: string;
    expiresIn: number;
  }) => void;
  setUserInfo: (userInfo: YouTubeOAuthState['userInfo']) => void;
  logout: () => void;
  isTokenExpired: () => boolean;
}

export const useYouTubeOAuthStore = create<YouTubeOAuthState>()((
  persist(
    (set, get) => ({
      isAuthenticated: false,
      accessToken: null,
      refreshToken: null,
      expiresAt: null,
      userInfo: null,

      setAuth: (data) => {
        const expiresAt = Date.now() + (data.expiresIn * 1000);
        set({
          isAuthenticated: true,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken || get().refreshToken,
          expiresAt,
        });
      },

      setUserInfo: (userInfo) => {
        set({ userInfo });
      },

      logout: () => {
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
    }),
    {
      name: 'youtube-oauth-storage',
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        expiresAt: state.expiresAt,
        userInfo: state.userInfo,
      }),
    }
  )
));
