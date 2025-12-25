# Aonsoku Upload Service

A microservice for uploading music files to Navidrome through Aonsoku.

## Features

- 🎵 Upload music files with automatic metadata detection
- 🏷️ Edit ID3 tags before uploading
- 📦 Batch upload support
- 🔄 Automatic Navidrome library scan trigger
- 🐳 Docker support
- 🎨 Support for MP3, FLAC, M4A, OGG, OPUS, WAV, AAC

## Installation

### Using Docker (Recommended)

```bash
docker build -t aonsoku-upload .
docker run -d \
  -p 3001:3001 \
  -v /path/to/music:/music \
  -e NAVIDROME_URL=http://navidrome:4533 \
  -e NAVIDROME_USERNAME=admin \
  -e NAVIDROME_PASSWORD=yourpassword \
  aonsoku-upload
```

### Manual Installation

```bash
cd upload-service
npm install
cp .env.example .env
# Edit .env with your configuration
npm start
```

## Configuration

Create a `.env` file based on `.env.example`:

```env
PORT=3001
UPLOAD_DIR=/tmp/uploads
MUSIC_LIBRARY_PATH=/music
MAX_FILE_SIZE=104857600
NAVIDROME_URL=http://localhost:4533
NAVIDROME_USERNAME=admin
NAVIDROME_PASSWORD=your_password
```

## API Endpoints

### Health Check
```
GET /health
```

### Extract Metadata
```
POST /api/upload/metadata
Content-Type: multipart/form-data

file: <audio file>
```

### Upload File
```
POST /api/upload
Content-Type: multipart/form-data

file: <audio file>
metadata: <JSON string with tags>
```

### Batch Upload
```
POST /api/upload/batch
Content-Type: multipart/form-data

files: <multiple audio files>
```

## Docker Compose Example

```yaml
version: '3.8'

services:
  aonsoku-upload:
    build: ./upload-service
    ports:
      - "3001:3001"
    volumes:
      - /path/to/music:/music
    environment:
      - NAVIDROME_URL=http://navidrome:4533
      - NAVIDROME_USERNAME=admin
      - NAVIDROME_PASSWORD=yourpassword
      - MUSIC_LIBRARY_PATH=/music
    restart: unless-stopped
```

## License

MIT
