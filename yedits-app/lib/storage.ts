// Storage abstraction that works with Expo Go (AsyncStorage fallback)
import AsyncStorage from '@react-native-async-storage/async-storage'

// Helper functions for typed storage access
export const mmkvStorage = {
  // String
  getString: async (key: string): Promise<string | null> => {
    return AsyncStorage.getItem(key)
  },
  setString: async (key: string, value: string) => {
    await AsyncStorage.setItem(key, value)
  },

  // Number
  getNumber: async (key: string): Promise<number | null> => {
    const value = await AsyncStorage.getItem(key)
    return value ? parseFloat(value) : null
  },
  setNumber: async (key: string, value: number) => {
    await AsyncStorage.setItem(key, value.toString())
  },

  // Boolean
  getBoolean: async (key: string): Promise<boolean | null> => {
    const value = await AsyncStorage.getItem(key)
    return value ? value === 'true' : null
  },
  setBoolean: async (key: string, value: boolean) => {
    await AsyncStorage.setItem(key, value.toString())
  },

  // JSON objects
  getObject: async <T>(key: string): Promise<T | null> => {
    const value = await AsyncStorage.getItem(key)
    if (value) {
      try {
        return JSON.parse(value) as T
      } catch {
        return null
      }
    }
    return null
  },
  setObject: async <T>(key: string, value: T) => {
    await AsyncStorage.setItem(key, JSON.stringify(value))
  },

  // Delete
  delete: async (key: string) => {
    await AsyncStorage.removeItem(key)
  },

  // Clear all
  clearAll: async () => {
    await AsyncStorage.clear()
  },

  // Check if key exists
  contains: async (key: string): Promise<boolean> => {
    const value = await AsyncStorage.getItem(key)
    return value !== null
  },

  // Get all keys
  getAllKeys: async (): Promise<string[]> => {
    const keys = await AsyncStorage.getAllKeys()
    return keys as string[]
  },
}

// Storage keys
export const STORAGE_KEYS = {
  SERVER_URL: 'server_url',
  USERNAME: 'username',
  AUTH_TOKEN: 'auth_token',
  AUTH_TYPE: 'auth_type',
  PLAYER_STATE: 'player_state',
  THEME: 'theme',
  VOLUME: 'volume',
  DOWNLOADS: 'downloads',
  QUEUE: 'queue',
  RECENT_SEARCHES: 'recent_searches',
} as const

// Synchronous storage for zustand (using a simple in-memory cache with AsyncStorage backup)
class SyncStorage {
  private cache: Map<string, string> = new Map()
  private initialized = false

  async init() {
    if (this.initialized) return
    try {
      const keys = await AsyncStorage.getAllKeys()
      const items = await AsyncStorage.multiGet(keys)
      items.forEach(([key, value]) => {
        if (value) this.cache.set(key, value)
      })
      this.initialized = true
    } catch (e) {
      console.error('Failed to initialize storage:', e)
    }
  }

  getString(key: string): string | undefined {
    return this.cache.get(key)
  }

  setString(key: string, value: string) {
    this.cache.set(key, value)
    AsyncStorage.setItem(key, value).catch(console.error)
  }

  delete(key: string) {
    this.cache.delete(key)
    AsyncStorage.removeItem(key).catch(console.error)
  }
}

export const syncStorage = new SyncStorage()
