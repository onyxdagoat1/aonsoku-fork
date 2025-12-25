import axios from 'axios';
import type { MusicMetadata } from '@/types/upload';

const TAG_WRITER_URL = import.meta.env.VITE_TAG_WRITER_URL || 'http://localhost:3001';

class TagWriterService {
  private client = axios.create({
    baseURL: TAG_WRITER_URL,
    timeout: 30000,
  });

  async updateSongTags(
    songId: string,
    metadata: Partial<MusicMetadata>
  ): Promise<{ success: boolean; message: string; path?: string }> {
    try {
      const response = await this.client.post('/api/update-tags', {
        songId,
        metadata,
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.error || 'Failed to update tags');
      }
      throw error;
    }
  }

  async updateCoverArt(songId: string, coverArtFile: File): Promise<{ success: boolean; message: string }> {
    try {
      const formData = new FormData();
      formData.append('songId', songId);
      formData.append('coverArt', coverArtFile);

      const response = await this.client.post('/api/update-cover-art', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.error || 'Failed to update cover art');
      }
      throw error;
    }
  }

  async getCurrentTags(songId: string): Promise<any> {
    try {
      const response = await this.client.get(`/api/get-tags/${songId}`);
      return response.data.tags;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.error || 'Failed to get tags');
      }
      throw error;
    }
  }

  async triggerRescan(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await this.client.post('/api/rescan');
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.error || 'Failed to trigger rescan');
      }
      throw error;
    }
  }

  async checkHealth(): Promise<boolean> {
    try {
      const response = await this.client.get('/health');
      return response.data.status === 'ok';
    } catch (error) {
      return false;
    }
  }
}

export const tagWriterService = new TagWriterService();
