import type { MusicMetadata, UploadResponse, MetadataResponse } from '@/types/upload';

const UPLOAD_SERVICE_URL = import.meta.env.VITE_UPLOAD_SERVICE_URL || 'http://localhost:3002';

export const uploadService = {
  /**
   * Extract metadata from an audio file
   */
  async extractMetadata(file: File): Promise<MetadataResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${UPLOAD_SERVICE_URL}/api/upload/metadata`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to extract metadata');
    }

    return response.json();
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
    formData.append('file', file);
    
    if (metadata) {
      formData.append('metadata', JSON.stringify(metadata));
    }

    if (coverArt) {
      formData.append('coverart', coverArt);
    }

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      // Progress tracking
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
