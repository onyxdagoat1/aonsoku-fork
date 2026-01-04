import * as Haptics from 'expo-haptics'
import { Platform, Share } from 'react-native'
import { subsonic } from '@/service/subsonic'
import { IAlbum, IArtist, IPlaylist, ISong } from '@/types/responses'

interface ShareOptions {
  title: string
  message: string
  url?: string
}

class ShareService {
  async share(options: ShareOptions): Promise<boolean> {
    Haptics.selectionAsync()

    try {
      const result = await Share.share({
        title: options.title,
        message:
          Platform.OS === 'ios'
            ? options.message
            : `${options.message}${options.url ? `\n\n${options.url}` : ''}`,
        url: Platform.OS === 'ios' ? options.url : undefined,
      })

      return result.action === Share.sharedAction
    } catch (error) {
      console.error('Share failed:', error)
      return false
    }
  }

  async shareSong(song: ISong): Promise<boolean> {
    const streamUrl = subsonic.getStreamUrl(song.id)

    return this.share({
      title: song.title,
      message: `🎵 Listen to "${song.title}" by ${song.artist || 'Unknown Artist'}`,
      url: streamUrl,
    })
  }

  async shareAlbum(album: IAlbum): Promise<boolean> {
    return this.share({
      title: album.name,
      message: `💿 Check out "${album.name}" by ${album.artist || 'Unknown Artist'}`,
    })
  }

  async shareArtist(artist: IArtist): Promise<boolean> {
    return this.share({
      title: artist.name,
      message: `🎤 Check out ${artist.name} on yedits.net`,
    })
  }

  async sharePlaylist(playlist: IPlaylist): Promise<boolean> {
    return this.share({
      title: playlist.name,
      message: `🎶 Check out my playlist "${playlist.name}" with ${playlist.songCount || 0} songs`,
    })
  }

  async shareNowPlaying(song: ISong): Promise<boolean> {
    return this.share({
      title: 'Now Playing',
      message: `🎧 Currently listening to "${song.title}" by ${song.artist || 'Unknown Artist'} on yedits.net`,
    })
  }
}

export const shareService = new ShareService()
