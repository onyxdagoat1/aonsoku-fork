import type { MusicMetadata, UploadResponse, MetadataResponse } from '@/types/upload';

const UPLOAD_SERVICE_URL = import.meta.env.VITE_UPLOAD_SERVICE_URL || 'http://localhost:3001';

export interface UploadHistoryItem {
  id: string;
  timestamp: string;
  originalName: string;
  path: string;
  size: number;
  metadata?: {
    title?: string;
    artist?: string;
    album?: string;
    [key: string]: any;
  };
}

export const uploadService = {
  /**
   * Health check
   */
  async healthCheck(): Promise<any> {
    const response = await fetch(`${UPLOAD_SERVICE_URL}/health`);
    return response.json();
  },

  /**
   * Get upload history
   */
  async getHistory(limit: number = 100): Promise<UploadHistoryItem[]> {
    const response = await fetch(`${UPLOAD_SERVICE_URL}/api/upload/history?limit=${limit}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch upload history');
    }

    const data = await response.json();
    return data.uploads;
  },

  /**
   * Read metadata from an existing file
   */
  async readMetadata(filePath: string): Promise<any> {
    const response = await fetch(`${UPLOAD_SERVICE_URL}/api/metadata/read`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filePath })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.details || error.error || 'Failed to read metadata');
    }

    const data = await response.json();
    
    // Map v2 response to expected format
    return {
      common: data.tags,
      format: data.format,
    };
  },

  /**
   * Update metadata for an existing file
   */
  async updateMetadata(
    filePath: string,
    metadata: MusicMetadata,
    coverArt?: File
  ): Promise<{ success: boolean; message?: string; newPath?: string }> {
    const formData = new FormData();
    formData.append('filePath', filePath);
    formData.append('metadata', JSON.stringify(metadata));
    
    if (coverArt) {
      formData.append('coverart', coverArt);
    }

    const response = await fetch(`${UPLOAD_SERVICE_URL}/api/metadata/update`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.details || error.error || 'Failed to update metadata');
    }

    const data = await response.json();
    return {
      success: data.success,
      message: 'Metadata updated successfully',
      newPath: data.path,
    };
  },

  /**
   * Extract metadata from an audio file (not needed in v2 - just read after upload)
   */
  async extractMetadata(file: File): Promise<MetadataResponse> {
    // V2 doesn't have this endpoint - just return basic info
    return {
      common: {
        title: file.name.replace(/\.[^/.]+$/, ''),
      },
      format: {
        container: file.name.split('.').pop() || 'unknown',
      },
    } as any;
  },

  /**
   * Upload a single file with metadata and optional cover art
   */
  async uploadFile(
    file: File,
    metadata?: MusicMetadata,
    coverArt?: File,
    onProgress?: (progress: number) => void
  ): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('audio', file); // v2 uses 'audio' not 'file'
    
    if (metadata) {
      formData.append('metadata', JSON.stringify(metadata));
    }

    if (coverArt) {
      formData.append('cover', coverArt); // v2 uses 'cover' not 'coverart'
    }

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable && onProgress) {
          const progress = (e.loaded / e.total) * 100;
          onProgress(progress);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const data = JSON.parse(xhr.responseText);
          resolve({
            success: data.success,
            message: 'File uploaded successfully',
            file: data.file,
          } as UploadResponse);
        } else {
          const error = JSON.parse(xhr.responseText);
          reject(new Error(error.error || 'Upload failed'));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Network error during upload'));
      });

      xhr.open('POST', `${UPLOAD_SERVICE_URL}/api/upload`);
      xhr.send(formData);
    });
  },

  /**
   * Upload multiple files at once
   */
  async uploadBatch(
    files: File[],
    onProgress?: (progress: number) => void
  ): Promise<any> {
    const formData = new FormData();
    
    for (const file of files) {
      formData.append('files', file);
    }

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable && onProgress) {
          const progress = (e.loaded / e.total) * 100;
          onProgress(progress);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(JSON.parse(xhr.responseText));
        } else {
          const error = JSON.parse(xhr.responseText);
          reject(new Error(error.error || 'Batch upload failed'));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Network error during upload'));
      });

      xhr.open('POST', `${UPLOAD_SERVICE_URL}/api/upload/batch`);
      xhr.send(formData);
    });
  },
};
