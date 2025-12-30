export interface MusicMetadata {
  title?: string
  artist?: string
  album?: string
  albumArtist?: string
  year?: number
  track?: number
  disc?: number
  genre?: string
  comment?: string
  lyrics?: string
  composer?: string
  bpm?: number
  coverArt?: string // base64 encoded image
  era?: string
  yeditorId?: string // ID of the editor (Yeditor)
  yeditorName?: string // Name of the editor for display
}

export interface UploadFile {
  id: string
  file: File
  metadata?: MusicMetadata
  coverArtFile?: File // Separate cover art file
  status: 'pending' | 'uploading' | 'success' | 'error'
  progress: number
  error?: string
  duration?: number
  bitrate?: number
  order?: number // For queue management
}

export interface UploadResponse {
  success: boolean
  message: string
  file?: {
    originalName: string
    path: string
    size: number
  }
}

export interface MetadataResponse {
  format: {
    duration?: number
    bitrate?: number
    sampleRate?: number
    codec?: string
  }
  common: MusicMetadata
  native: Record<string, any>
}

export interface BatchUploadFile {
  file: File
  metadata?: MusicMetadata
  coverArt?: File
}

export interface UploadHistory {
  id: string
  filename: string
  uploadDate: string
  status: 'success' | 'error'
  metadata?: MusicMetadata
}

export type UploadMode = 'quick' | 'detailed' | 'batch'

export interface GenreOption {
  value: string
  label: string
  category?: string
}
