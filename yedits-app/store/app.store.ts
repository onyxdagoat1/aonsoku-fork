import AsyncStorage from '@react-native-async-storage/async-storage'
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { AuthType, IAppData } from '@/types/serverConfig'

interface IAppState {
  data: IAppData
  theme: 'dark' | 'light' | 'system'
  initialized: boolean

  // Actions
  init: () => Promise<void>
  setTheme: (theme: 'dark' | 'light' | 'system') => void
  setServerConfig: (
    url: string,
    username: string,
    password: string,
    authType: AuthType,
  ) => Promise<void>
  setConnecting: (isConnecting: boolean, error?: string | null) => void
  clearConfig: () => Promise<void>
}

const STORAGE_KEY = 'app-store'

export const useAppStore = create<IAppState>()(
  immer((set, get) => ({
    data: {
      isServerConfigured: false,
      url: '',
      username: '',
      password: '',
      authType: AuthType.TOKEN,
      protocolVersion: '1.16.0',
      serverType: 'navidrome',
      isConnecting: false,
      connectionError: null,
    },
    theme: 'dark',
    initialized: false,

    init: async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY)
        if (stored) {
          const parsed = JSON.parse(stored)
          set((state) => {
            if (parsed.data) {
              state.data = { ...state.data, ...parsed.data }
            }
            if (parsed.theme) {
              state.theme = parsed.theme
            }
          })
        }
      } catch (e) {
        console.error('Failed to load app state:', e)
      }
      set((state) => {
        state.initialized = true
      })
    },

    setTheme: (theme) => {
      set((state) => {
        state.theme = theme
      })
      // Persist
      const { data, theme: currentTheme } = get()
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ data, theme })).catch(
        console.error,
      )
    },

    setServerConfig: async (url, username, password, authType) => {
      set((state) => {
        state.data.url = url
        state.data.username = username
        state.data.password = password
        state.data.authType = authType
        state.data.isServerConfigured = true
        state.data.isConnecting = false
        state.data.connectionError = null
      })
      // Persist
      const { data, theme } = get()
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ data, theme }))
    },

    setConnecting: (isConnecting, error = null) => {
      set((state) => {
        state.data.isConnecting = isConnecting
        state.data.connectionError = error
      })
    },

    clearConfig: async () => {
      set((state) => {
        state.data = {
          isServerConfigured: false,
          url: '',
          username: '',
          password: '',
          authType: AuthType.TOKEN,
          protocolVersion: '1.16.0',
          serverType: 'navidrome',
          isConnecting: false,
          connectionError: null,
        }
      })
      const { data, theme } = get()
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ data, theme }))
    },
  })),
)

// Selectors
export const useServerConfig = () => useAppStore((state) => state.data)
export const useTheme = () => useAppStore((state) => state.theme)
export const useIsServerConfigured = () =>
  useAppStore((state) => state.data.isServerConfigured)
export const useIsInitialized = () => useAppStore((state) => state.initialized)
