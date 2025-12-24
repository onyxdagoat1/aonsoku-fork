// MusicBrainz API integration for auto-tagging

interface MusicBrainzRecording {
  id: string
  title: string
  'artist-credit': {
    name: string
    artist: {
      id: string
      name: string
    }
  }[]
  releases?: {
    id: string
    title: string
    date?: string
    'release-group'?: {
      'primary-type'?: string
    }
  }[]
  length?: number
}

interface MusicBrainzSearchResponse {
  recordings: MusicBrainzRecording[]
  count: number
}

export interface AutoTagSuggestion {
  title: string
  artist: string
  album?: string
  year?: number
  duration?: number
  confidence: number
  mbid: string
}

const MUSICBRAINZ_API = 'https://musicbrainz.org/ws/2'
const USER_AGENT = 'Aonsoku/1.0.0 (https://github.com/aonsoku/aonsoku)'

async function searchByTitleAndArtist(
  title: string,
  artist: string,
): Promise<AutoTagSuggestion[]> {
  try {
    const query = `recording:"${title}" AND artist:"${artist}"`
    const url = `${MUSICBRAINZ_API}/recording?query=${encodeURIComponent(query)}&fmt=json&limit=5`

    const response = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
      },
    })

    if (!response.ok) {
      throw new Error('MusicBrainz API request failed')
    }

    const data: MusicBrainzSearchResponse = await response.json()

    return data.recordings.map((recording, index) => {
      const artistName =
        recording['artist-credit']?.[0]?.artist?.name || artist
      const release = recording.releases?.[0]
      const year = release?.date ? parseInt(release.date.split('-')[0]) : undefined

      // Simple confidence score based on position in results
      const confidence = Math.max(100 - index * 15, 50)

      return {
        title: recording.title,
        artist: artistName,
        album: release?.title,
        year,
        duration: recording.length ? Math.round(recording.length / 1000) : undefined,
        confidence,
        mbid: recording.id,
      }
    })
  } catch (error) {
    console.error('MusicBrainz search error:', error)
    return []
  }
}

async function searchByTitle(title: string): Promise<AutoTagSuggestion[]> {
  try {
    const query = `recording:"${title}"`
    const url = `${MUSICBRAINZ_API}/recording?query=${encodeURIComponent(query)}&fmt=json&limit=10`

    const response = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
      },
    })

    if (!response.ok) {
      throw new Error('MusicBrainz API request failed')
    }

    const data: MusicBrainzSearchResponse = await response.json()

    return data.recordings.map((recording, index) => {
      const artistName = recording['artist-credit']?.[0]?.artist?.name || ''
      const release = recording.releases?.[0]
      const year = release?.date ? parseInt(release.date.split('-')[0]) : undefined

      const confidence = Math.max(100 - index * 10, 30)

      return {
        title: recording.title,
        artist: artistName,
        album: release?.title,
        year,
        duration: recording.length ? Math.round(recording.length / 1000) : undefined,
        confidence,
        mbid: recording.id,
      }
    })
  } catch (error) {
    console.error('MusicBrainz search error:', error)
    return []
  }
}

export const musicbrainz = {
  searchByTitleAndArtist,
  searchByTitle,
}
