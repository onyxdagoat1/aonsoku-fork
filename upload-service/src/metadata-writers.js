import NodeID3 from 'node-id3';
import fs from 'fs/promises';
import { parseFile } from 'music-metadata';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Write metadata to MP3 file using node-id3
 */
export async function writeMp3Metadata(filePath, metadata, imageBuffer, imageMime) {
  const tags = {
    title: metadata.title,
    artist: metadata.artist,
    album: metadata.album,
    year: metadata.year,
    trackNumber: metadata.track?.toString(),
    genre: metadata.genre,
    comment: { text: metadata.comment || '' },
    albumArtist: metadata.albumArtist,
  };

  if (imageBuffer) {
    tags.image = {
      mime: imageMime || 'image/jpeg',
      type: { id: 3, name: 'front cover' },
      description: 'Cover',
      imageBuffer: imageBuffer
    };
  }

  NodeID3.write(tags, filePath);
}

/**
 * Write metadata to FLAC file using metaflac command line tool
 * Falls back to Node implementation if metaflac is not available
 */
export async function writeFlacMetadata(filePath, metadata, imageBuffer, imageMime) {
  try {
    // Try using metaflac command line tool first (most reliable)
    const commands = [];
    
    // Remove all existing tags first
    commands.push(`metaflac --remove-all-tags "${filePath}"`);
    
    // Add new tags
    if (metadata.title) commands.push(`metaflac --set-tag="TITLE=${metadata.title}" "${filePath}"`);
    if (metadata.artist) commands.push(`metaflac --set-tag="ARTIST=${metadata.artist}" "${filePath}"`);
    if (metadata.album) commands.push(`metaflac --set-tag="ALBUM=${metadata.album}" "${filePath}"`);
    if (metadata.albumArtist) commands.push(`metaflac --set-tag="ALBUMARTIST=${metadata.albumArtist}" "${filePath}"`);
    if (metadata.year) commands.push(`metaflac --set-tag="DATE=${metadata.year}" "${filePath}"`);
    if (metadata.track) commands.push(`metaflac --set-tag="TRACKNUMBER=${metadata.track}" "${filePath}"`);
    if (metadata.genre) commands.push(`metaflac --set-tag="GENRE=${metadata.genre}" "${filePath}"`);
    if (metadata.comment) commands.push(`metaflac --set-tag="COMMENT=${metadata.comment}" "${filePath}"`);
    
    // Add cover art if provided
    if (imageBuffer) {
      const tempImagePath = `/tmp/cover-${Date.now()}.jpg`;
      await fs.writeFile(tempImagePath, imageBuffer);
      commands.push(`metaflac --import-picture-from="${tempImagePath}" "${filePath}"`);
      // Clean up temp file after
      commands.push(`rm "${tempImagePath}"`);
    }
    
    // Execute all commands
    for (const cmd of commands) {
      await execAsync(cmd);
    }
    
    return true;
  } catch (error) {
    console.warn('metaflac not available or failed, FLAC metadata update limited:', error.message);
    return false;
  }
}

/**
 * Write metadata to M4A file using ffmpeg
 */
export async function writeM4aMetadata(filePath, metadata, imageBuffer, imageMime) {
  try {
    const tempOutput = `${filePath}.tmp.m4a`;
    const metadataArgs = [];
    
    if (metadata.title) metadataArgs.push('-metadata', `title=${metadata.title}`);
    if (metadata.artist) metadataArgs.push('-metadata', `artist=${metadata.artist}`);
    if (metadata.album) metadataArgs.push('-metadata', `album=${metadata.album}`);
    if (metadata.albumArtist) metadataArgs.push('-metadata', `album_artist=${metadata.albumArtist}`);
    if (metadata.year) metadataArgs.push('-metadata', `date=${metadata.year}`);
    if (metadata.track) metadataArgs.push('-metadata', `track=${metadata.track}`);
    if (metadata.genre) metadataArgs.push('-metadata', `genre=${metadata.genre}`);
    if (metadata.comment) metadataArgs.push('-metadata', `comment=${metadata.comment}`);
    
    let coverArgs = [];
    let tempImagePath = null;
    
    if (imageBuffer) {
      tempImagePath = `/tmp/cover-${Date.now()}.jpg`;
      await fs.writeFile(tempImagePath, imageBuffer);
      coverArgs = ['-i', tempImagePath, '-map', '0', '-map', '1', '-c', 'copy', '-disposition:v:0', 'attached_pic'];
    }
    
    const ffmpegCmd = [
      'ffmpeg',
      '-i', `"${filePath}"`,
      ...coverArgs,
      ...metadataArgs,
      '-c:a', 'copy',
      '-c:v', imageBuffer ? 'copy' : 'copy',
      `"${tempOutput}"`,
      '-y'
    ].join(' ');
    
    await execAsync(ffmpegCmd);
    
    // Replace original with updated file
    await fs.rename(tempOutput, filePath);
    
    // Clean up temp cover image
    if (tempImagePath) {
      await fs.unlink(tempImagePath).catch(() => {});
    }
    
    return true;
  } catch (error) {
    console.warn('ffmpeg not available or failed, M4A metadata update limited:', error.message);
    return false;
  }
}

/**
 * Write metadata to OGG file using ffmpeg
 */
export async function writeOggMetadata(filePath, metadata, imageBuffer, imageMime) {
  try {
    const tempOutput = `${filePath}.tmp.ogg`;
    const metadataArgs = [];
    
    if (metadata.title) metadataArgs.push('-metadata', `title=${metadata.title}`);
    if (metadata.artist) metadataArgs.push('-metadata', `artist=${metadata.artist}`);
    if (metadata.album) metadataArgs.push('-metadata', `album=${metadata.album}`);
    if (metadata.albumArtist) metadataArgs.push('-metadata', `album_artist=${metadata.albumArtist}`);
    if (metadata.year) metadataArgs.push('-metadata', `date=${metadata.year}`);
    if (metadata.track) metadataArgs.push('-metadata', `track=${metadata.track}`);
    if (metadata.genre) metadataArgs.push('-metadata', `genre=${metadata.genre}`);
    if (metadata.comment) metadataArgs.push('-metadata', `comment=${metadata.comment}`);
    
    const ffmpegCmd = [
      'ffmpeg',
      '-i', `"${filePath}"`,
      ...metadataArgs,
      '-c:a', 'copy',
      `"${tempOutput}"`,
      '-y'
    ].join(' ');
    
    await execAsync(ffmpegCmd);
    await fs.rename(tempOutput, filePath);
    
    return true;
  } catch (error) {
    console.warn('ffmpeg not available or failed, OGG metadata update limited:', error.message);
    return false;
  }
}
