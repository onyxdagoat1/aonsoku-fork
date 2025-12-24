import { create } from 'zustand'
import { get, set, del, entries } from 'idb-keyval'

export enum ArtworkType {
  SingleCover = 'single-cover',
  Artwork = 'artwork',
  AlbumCover = 'album-cover',
}

export interface CustomArtwork {
  id: string
  artworkName: string
  artistName: string
  editor?: string
  compEra: string // Comp/Era
  type: ArtworkType
  description: string
  imageData: string // Base64 encoded image
  uploadedAt: number
  tags?: string[]
}

interface ArtworkStore {
  artworks: CustomArtwork[]
  isLoading: boolean
  loadArtworks: () => Promise<void>
  addArtwork: (artwork: Omit<CustomArtwork, 'id' | 'uploadedAt'>) => Promise<void>
  updateArtwork: (id: string, artwork: Partial<CustomArtwork>) => Promise<void>
  deleteArtwork: (id: string) => Promise<void>
  getArtwork: (id: string) => CustomArtwork | undefined
}

const ARTWORK_STORE_KEY = 'custom-artworks'

export const useArtworkStore = create<ArtworkStore>((setState, getState) => ({
  artworks: [],
  isLoading: false,

  loadArtworks: async () => {
    setState({ isLoading: true })
    try {
      const storedArtworks = await get<CustomArtwork[]>(ARTWORK_STORE_KEY)
      setState({ artworks: storedArtworks || [], isLoading: false })
    } catch (error) {
      console.error('Failed to load artworks:', error)
      setState({ artworks: [], isLoading: false })
    }
  },

  addArtwork: async (artworkData) => {
    const newArtwork: CustomArtwork = {
      ...artworkData,
      id: `artwork-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      uploadedAt: Date.now(),
    }

    const currentArtworks = getState().artworks
    const updatedArtworks = [...currentArtworks, newArtwork]

    try {
      await set(ARTWORK_STORE_KEY, updatedArtworks)
      setState({ artworks: updatedArtworks })
    } catch (error) {
      console.error('Failed to add artwork:', error)
      throw error
    }
  },

  updateArtwork: async (id, updates) => {
    const currentArtworks = getState().artworks
    const updatedArtworks = currentArtworks.map((artwork) =>
      artwork.id === id ? { ...artwork, ...updates } : artwork
    )

    try {
      await set(ARTWORK_STORE_KEY, updatedArtworks)
      setState({ artworks: updatedArtworks })
    } catch (error) {
      console.error('Failed to update artwork:', error)
      throw error
    }
  },

  deleteArtwork: async (id) => {
    const currentArtworks = getState().artworks
    const updatedArtworks = currentArtworks.filter(
      (artwork) => artwork.id !== id
    )

    try {
      await set(ARTWORK_STORE_KEY, updatedArtworks)
      setState({ artworks: updatedArtworks })
    } catch (error) {
      console.error('Failed to delete artwork:', error)
      throw error
    }
  },

  getArtwork: (id) => {
    return getState().artworks.find((artwork) => artwork.id === id)
  },
}))
