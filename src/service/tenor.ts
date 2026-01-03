// Backend proxy URL (Tag Service runs on 3001)
const PROXY_BASE_URL = 'http://localhost:3001/api/proxy/tenor'

// Tenor API v2 format
export interface TensorGif {
  id: string
  title: string
  content_description: string
  media_formats: {
    tinygif?: {
      url: string
      dims: number[]
      size: number
    }
    gif?: {
      url: string
      dims: number[]
      size: number
    }
    mediumgif?: {
      url: string
      dims: number[]
      size: number
    }
    nanogif?: {
      url: string
      dims: number[]
      size: number
    }
  }
  itemurl: string
}

export const tenorService = {
  async search(query: string, limit = 20): Promise<TensorGif[]> {
    try {
      const params = new URLSearchParams({
        q: query,
        limit: limit.toString(),
      })

      const response = await fetch(
        `${PROXY_BASE_URL}/search?${params.toString()}`,
      )

      if (!response.ok) {
        throw new Error('Network response was not ok')
      }

      const data = await response.json()
      return data.results || []
    } catch (error) {
      console.error('Error searching Tenor:', error)
      return []
    }
  },

  async getTrending(limit = 20): Promise<TensorGif[]> {
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
      })

      const response = await fetch(
        `${PROXY_BASE_URL}/trending?${params.toString()}`,
      )

      if (!response.ok) {
        throw new Error('Network response was not ok')
      }

      const data = await response.json()
      return data.results || []
    } catch (error) {
      console.error('Error fetching trending GIFs:', error)
      return []
    }
  },
}
