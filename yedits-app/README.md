# yedits.net Mobile App

A premium React Native music streaming app built with Expo that connects to Navidrome/Subsonic servers.

## Features

- 🎵 **Audio Playback** - Stream music with queue, shuffle, repeat
- 📱 **Offline Mode** - Download songs for offline listening  
- 🎨 **Premium UI** - Dark theme inspired by Spotify/Apple Music
- 💬 **Social** - Comments, ratings, profiles via Supabase
- 🔍 **Discovery** - Search, genres, radio, podcasts
- ⚙️ **Advanced** - Sleep timer, equalizer, lyrics

## Quick Start

```bash
cd yedits-app
npm install
npm run start
# Scan QR with Expo Go
```

## Configuration

Create `.env` file:
```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

## Screens

| Category | Screens |
|----------|---------|
| **Tabs** | Home, Search, Library, Profile |
| **Details** | Album, Artist, Playlist, Genre |
| **Player** | Full Player, Queue, Lyrics |
| **Settings** | Settings, Downloads, Favorites |
| **Other** | Login, Onboarding, About |

## Tech Stack

- **Framework**: React Native + Expo
- **Navigation**: Expo Router
- **State**: Zustand
- **Data**: TanStack Query + Supabase
- **Audio**: expo-av
- **Styling**: NativeWind

## Building

```bash
# Development build
npx eas build --profile development

# Production
npx eas build --platform all
```

## License

MIT
