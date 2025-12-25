import { httpClient } from './httpClient';
import type { MusicMetadata } from '@/types/upload';

export interface Song {
  id: string;
  title: string;
  artist: string;
  album?: string;
  albumId?: string;
  artistId?: string;
  year?: number;
  genre?: string;
  duration?: number;
  bitRate?: number;
  size?: number;
  path?: string;
  coverArt?: string;
  track?: number;
  discNumber?: number;
  created?: string;
  albumArtist?: string;
  type?: string;
  suffix?: string;
  contentType?: string;
}

export interface SearchResult {
  song?: Song[];
  album?: Array<{
    id: string;
    name: string;
    artist: string;
    artistId: string;
    coverArt?: string;
    songCount: number;
    duration: number;
    created: string;
    year?: number;
    genre?: string;
  }>;
  artist?: Array<{
    id: string;
    name: string;
    albumCount: number;
    coverArt?: string;
  }>;
}

class SongService {
  async searchSongs(query: string, songCount = 50): Promise<Song[]> {
    try {
      const response = await httpClient<{ searchResult3: SearchResult }>(
        'search3',
        {
          query: {
            query,
            songCount,
            albumCount: 0,
            artistCount: 0,
          },
        }
      );

      if (response?.data?.searchResult3?.song) {
        return response.data.searchResult3.song;
      }

      return [];
    } catch (error) {
      console.error('Failed to search songs:', error);
      throw error;
    }
  }

  async getSong(id: string): Promise<Song | null> {
    try {
      const response = await httpClient<{ song: Song }>('getSong', {
        query: { id },
      });

      if (response?.data?.song) {
        return response.data.song;
      }

      return null;
    } catch (error) {
      console.error('Failed to get song:', error);
      throw error;
    }
  }

  async getRecentSongs(count = 50): Promise<Song[]> {
    try {
      const response = await httpClient<{ albumList2: { album: Song[] } }>(
        'getAlbumList2',
        {
          query: {
            type: 'recent',
            size: count,
          },
        }
      );

      if (response?.data?.albumList2?.album) {
        // Get songs from recent albums
        const songs: Song[] = [];
        for (const album of response.data.albumList2.album.slice(0, 10)) {
          const albumSongs = await this.getAlbumSongs(album.id);
          songs.push(...albumSongs);
        }
        return songs.slice(0, count);
      }

      return [];
    } catch (error) {
      console.error('Failed to get recent songs:', error);
      return [];
    }
  }

  async getAlbumSongs(albumId: string): Promise<Song[]> {
    try {
      const response = await httpClient<{ album: { song: Song[] } }>(
        'getAlbum',
        {
          query: { id: albumId },
        }
      );

      if (response?.data?.album?.song) {
        return response.data.album.song;
      }

      return [];
    } catch (error) {
      console.error('Failed to get album songs:', error);
      return [];
    }
  }

  async startScan(): Promise<{ scanning: boolean; count?: number }> {
    try {
      const response = await httpClient<{ scanStatus: { scanning: boolean; count?: number } }>(
        'startScan',
        {
          method: 'GET',
        }
      );

      if (response?.data?.scanStatus) {
        return response.data.scanStatus;
      }

      return { scanning: false };
    } catch (error) {
      console.error('Failed to start scan:', error);
      throw error;
    }
  }

  async getScanStatus(): Promise<{ scanning: boolean; count?: number }> {
    try {
      const response = await httpClient<{ scanStatus: { scanning: boolean; count?: number } }>(
        'getScanStatus',
        {
          method: 'GET',
        }
      );

      if (response?.data?.scanStatus) {
        return response.data.scanStatus;
      }

      return { scanning: false };
    } catch (error) {
      console.error('Failed to get scan status:', error);
      return { scanning: false };
    }
  }

  // Download song file for external editing
  getDownloadUrl(songId: string): string {
    // This uses the existing download endpoint from httpClient
    return `/api/download?id=${songId}`;
  }

  // Convert Song to MusicMetadata format
  songToMetadata(song: Song): MusicMetadata {
    return {
      title: song.title,
      artist: song.artist,
      album: song.album,
      albumArtist: song.albumArtist,
      year: song.year,
      genre: song.genre,
      track: song.track,
      disc: song.discNumber,
      coverArt: song.coverArt,
    };
  }
}

export const songService = new SongService();
