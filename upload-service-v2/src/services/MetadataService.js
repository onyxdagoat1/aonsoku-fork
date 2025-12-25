import NodeID3 from 'node-id3';
import { parseFile } from 'music-metadata';
import { extname } from 'path';
import FileService from './FileService.js';

/**
 * MetadataService - Handles reading and writing audio metadata
 */
class MetadataService {
  /**
   * Read metadata from file
   */
  async read(filePath) {
    const resolved = await FileService.resolvePath(filePath);
    const ext = extname(resolved).toLowerCase();

    // Parse with music-metadata (reads all formats)
    const metadata = await parseFile(resolved);
    
    return {
      format: {
        container: ext.slice(1),
        codec: metadata.format.codec,
        duration: metadata.format.duration,
        bitrate: metadata.format.bitrate,
      },
      tags: {
        title: metadata.common.title,
        artist: metadata.common.artist,
        album: metadata.common.album,
        albumArtist: metadata.common.albumArtist,
        year: metadata.common.year,
        genre: metadata.common.genre ? (Array.isArray(metadata.common.genre) ? metadata.common.genre : [metadata.common.genre]) : undefined,
        trackNumber: metadata.common.track?.no,
        trackTotal: metadata.common.track?.of,
        discNumber: metadata.common.disk?.no,
        discTotal: metadata.common.disk?.of,
        comment: metadata.common.comment ? (Array.isArray(metadata.common.comment) ? metadata.common.comment[0] : metadata.common.comment) : undefined,
      },
      coverArt: metadata.common.picture?.[0] ? {
        format: metadata.common.picture[0].format,
        data: metadata.common.picture[0].data,
      } : null,
      path: resolved,
      relativePath: FileService.getRelativePath(resolved),
    };
  }

  /**
   * Write metadata to file
   */
  async write(filePath, tags, coverArt = null) {
    const resolved = await FileService.resolvePath(filePath);
    const ext = extname(resolved).toLowerCase();

    switch (ext) {
      case '.mp3':
        return this._writeMp3(resolved, tags, coverArt);
      
      default:
        throw new Error(`Metadata writing not supported for ${ext} files yet`);
    }
  }

  /**
   * Update metadata (merge with existing)
   */
  async update(filePath, tags, coverArt = null) {
    const current = await this.read(filePath);
    
    // Merge new tags with existing
    const merged = {
      ...current.tags,
      ...tags,
    };

    // Use new cover art if provided, otherwise keep existing
    const finalCoverArt = coverArt || current.coverArt;

    return this.write(filePath, merged, finalCoverArt);
  }

  // Format-specific writers

  async _writeMp3(filePath, tags, coverArt) {
    const id3Tags = {
      title: tags.title,
      artist: tags.artist,
      album: tags.album,
      performerInfo: tags.albumArtist || tags.artist,
      year: tags.year?.toString(),
      trackNumber: tags.trackNumber?.toString(),
      genre: Array.isArray(tags.genre) ? tags.genre.join('/') : tags.genre,
      comment: {
        language: 'eng',
        text: tags.comment || '',
      },
    };

    // Handle cover art
    if (coverArt) {
      if (Buffer.isBuffer(coverArt.data)) {
        id3Tags.image = {
          mime: coverArt.format || 'image/jpeg',
          type: { id: 3, name: 'front cover' },
          description: 'Cover',
          imageBuffer: coverArt.data,
        };
      } else if (coverArt instanceof Buffer) {
        id3Tags.image = {
          mime: 'image/jpeg',
          type: { id: 3, name: 'front cover' },
          description: 'Cover',
          imageBuffer: coverArt,
        };
      }
    }

    // Write tags
    const success = NodeID3.write(id3Tags, filePath);
    
    if (!success) {
      throw new Error('Failed to write MP3 tags');
    }

    return { success: true };
  }
}

// Export singleton
export default new MetadataService();
