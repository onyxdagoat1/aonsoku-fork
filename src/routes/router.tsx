import { lazy, Suspense } from 'react'
import { createHashRouter } from 'react-router-dom'

import {
  AlbumFallback,
  AlbumsFallback,
} from '@/app/components/fallbacks/album-fallbacks'
import { ArtistsFallback } from '@/app/components/fallbacks/artists.tsx'
import { HomeFallback } from '@/app/components/fallbacks/home-fallbacks'
import { PlaylistFallback } from '@/app/components/fallbacks/playlist-fallbacks'
import {
  EpisodeFallback,
  LatestEpisodesFallback,
  PodcastFallback,
} from '@/app/components/fallbacks/podcast-fallbacks'
import {
  InfinitySongListFallback,
  SongListFallback,
} from '@/app/components/fallbacks/song-fallbacks'
import { albumsLoader } from '@/routes/loaders/albumsLoader'
import { loginLoader } from '@/routes/loginLoader'
import { podcastsLoader, protectedLoader } from '@/routes/protectedLoader'
import { ROUTES } from '@/routes/routesList'

const BaseLayout = lazy(() => import('@/app/layout/base'))
const Album = lazy(() => import('@/app/pages/albums/album'))
const AlbumsList = lazy(() => import('@/app/pages/albums/list'))
const Artist = lazy(() => import('@/app/pages/artists/artist'))
const ArtistsList = lazy(() => import('@/app/pages/artists/list'))
const ErrorPage = lazy(() => import('@/app/pages/error-page'))
const PlaylistsPage = lazy(() => import('@/app/pages/playlists/list'))
const Playlist = lazy(() => import('@/app/pages/playlists/playlist'))
const Radios = lazy(() => import('@/app/pages/radios/radios-list'))
const SongList = lazy(() => import('@/app/pages/songs/songlist'))
const Home = lazy(() => import('@/app/pages/home'))
const PodcastsList = lazy(() => import('@/app/pages/podcasts/list'))
const Podcast = lazy(() => import('@/app/pages/podcasts/podcast'))
const Episode = lazy(() => import('@/app/pages/podcasts/episode'))
const LatestEpisodes = lazy(
  () => import('@/app/pages/podcasts/latest-episodes'),
)
const ArtGallery = lazy(() => import('@/app/pages/art/gallery'))
const UploadPage = lazy(() => import('@/app/pages/upload'))
const YouTubePage = lazy(() => import('@/app/pages/youtube'))
const YouTubeCallback = lazy(() =>
  import('@/app/pages/youtube/YouTubeCallback').then((m) => ({
    default: m.YouTubeCallback,
  })),
)
const ProfilePage = lazy(() =>
  import('@/app/pages/profile').then((m) => ({ default: m.ProfilePage })),
)
const AuthPage = lazy(() => import('@/app/pages/auth/AuthPage'))
const AuthCallback = lazy(() =>
  import('@/app/pages/auth/AuthCallback').then((m) => ({
    default: m.AuthCallback,
  })),
)
const AdminPanel = lazy(() =>
  import('@/app/pages/admin').then((m) => ({ default: m.AdminPanel })),
)
const YeditorProfile = lazy(() => import('@/app/pages/yeditor'))
const CollectionPage = lazy(() => import('@/app/pages/collection'))

export const router = createHashRouter([
  {
    path: ROUTES.LIBRARY.HOME,
    element: <BaseLayout />,
    loader: protectedLoader,
    children: [
      {
        id: 'home',
        path: ROUTES.LIBRARY.HOME,
        errorElement: <ErrorPage />,
        element: (
          <Suspense fallback={<HomeFallback />}>
            <Home />
          </Suspense>
        ),
      },
      {
        id: 'artists',
        path: ROUTES.LIBRARY.ARTISTS,
        errorElement: <ErrorPage />,
        element: (
          <Suspense fallback={<ArtistsFallback />}>
            <ArtistsList />
          </Suspense>
        ),
      },
      {
        id: 'songs',
        path: ROUTES.LIBRARY.SONGS,
        errorElement: <ErrorPage />,
        element: (
          <Suspense fallback={<InfinitySongListFallback />}>
            <SongList />
          </Suspense>
        ),
      },
      {
        id: 'albums',
        path: ROUTES.LIBRARY.ALBUMS,
        loader: albumsLoader,
        errorElement: <ErrorPage />,
        element: (
          <Suspense fallback={<AlbumsFallback />}>
            <AlbumsList />
          </Suspense>
        ),
      },
      {
        id: 'playlists',
        path: ROUTES.LIBRARY.PLAYLISTS,
        errorElement: <ErrorPage />,
        element: (
          <Suspense fallback={<SongListFallback />}>
            <PlaylistsPage />
          </Suspense>
        ),
      },
      {
        id: 'radios',
        path: ROUTES.LIBRARY.RADIOS,
        errorElement: <ErrorPage />,
        element: (
          <Suspense fallback={<SongListFallback />}>
            <Radios />
          </Suspense>
        ),
      },
      {
        id: 'art',
        path: ROUTES.LIBRARY.ART,
        errorElement: <ErrorPage />,
        element: (
          <Suspense fallback={<AlbumsFallback />}>
            <ArtGallery />
          </Suspense>
        ),
      },
      {
        id: 'youtube',
        path: ROUTES.LIBRARY.YOUTUBE,
        errorElement: <ErrorPage />,
        element: (
          <Suspense fallback={<HomeFallback />}>
            <YouTubePage />
          </Suspense>
        ),
      },
      {
        id: 'upload',
        path: ROUTES.UPLOAD,
        errorElement: <ErrorPage />,
        element: (
          <Suspense fallback={<HomeFallback />}>
            <UploadPage />
          </Suspense>
        ),
      },
      {
        id: 'profile',
        path: ROUTES.PROFILE,
        errorElement: <ErrorPage />,
        element: (
          <Suspense fallback={<HomeFallback />}>
            <ProfilePage />
          </Suspense>
        ),
      },
      {
        id: 'admin',
        path: ROUTES.ADMIN,
        errorElement: <ErrorPage />,
        element: (
          <Suspense fallback={<HomeFallback />}>
            <AdminPanel />
          </Suspense>
        ),
      },
      {
        id: 'yeditor',
        path: ROUTES.YEDITOR.PATH,
        errorElement: <ErrorPage />,
        element: (
          <Suspense fallback={<HomeFallback />}>
            <YeditorProfile />
          </Suspense>
        ),
      },
      {
        id: 'collection',
        path: ROUTES.COLLECTION.PATH,
        errorElement: <ErrorPage />,
        element: (
          <Suspense fallback={<PlaylistFallback />}>
            <CollectionPage />
          </Suspense>
        ),
      },
      {
        id: 'artist',
        path: ROUTES.ARTIST.PATH,
        errorElement: <ErrorPage />,
        element: (
          <Suspense fallback={<AlbumFallback />}>
            <Artist />
          </Suspense>
        ),
      },
      {
        id: 'album',
        path: ROUTES.ALBUM.PATH,
        errorElement: <ErrorPage />,
        element: (
          <Suspense fallback={<AlbumFallback />}>
            <Album />
          </Suspense>
        ),
      },
      {
        id: 'playlist',
        path: ROUTES.PLAYLIST.PATH,
        errorElement: <ErrorPage />,
        element: (
          <Suspense fallback={<PlaylistFallback />}>
            <Playlist />
          </Suspense>
        ),
      },
      {
        id: 'podcasts',
        path: ROUTES.LIBRARY.PODCASTS,
        errorElement: <ErrorPage />,
        loader: podcastsLoader,
        element: (
          <Suspense fallback={<AlbumsFallback />}>
            <PodcastsList />
          </Suspense>
        ),
      },
      {
        id: 'podcast',
        path: ROUTES.PODCASTS.PATH,
        errorElement: <ErrorPage />,
        loader: podcastsLoader,
        element: (
          <Suspense fallback={<PodcastFallback />}>
            <Podcast />
          </Suspense>
        ),
      },
      {
        id: 'episode',
        path: ROUTES.EPISODES.PATH,
        errorElement: <ErrorPage />,
        loader: podcastsLoader,
        element: (
          <Suspense fallback={<EpisodeFallback />}>
            <Episode />
          </Suspense>
        ),
      },
      {
        id: 'latest-episodes',
        path: ROUTES.EPISODES.LATEST,
        errorElement: <ErrorPage />,
        loader: podcastsLoader,
        element: (
          <Suspense fallback={<LatestEpisodesFallback />}>
            <LatestEpisodes />
          </Suspense>
        ),
      },
      {
        id: 'error',
        path: '*',
        element: (
          <Suspense>
            <ErrorPage />
          </Suspense>
        ),
      },
    ],
  },
  {
    id: 'login',
    path: ROUTES.SERVER_CONFIG,
    loader: loginLoader,
    element: (
      <Suspense>
        <AuthPage />
      </Suspense>
    ),
  },
  {
    id: 'register',
    path: ROUTES.REGISTER,
    loader: loginLoader,
    element: (
      <Suspense>
        <AuthPage />
      </Suspense>
    ),
  },
  {
    id: 'auth-callback',
    path: '/auth/callback',
    element: (
      <Suspense fallback={<div>Loading...</div>}>
        <AuthCallback />
      </Suspense>
    ),
  },
  // YouTube OAuth Callback
  {
    id: 'youtube-callback',
    path: '/youtube/callback',
    element: (
      <Suspense fallback={<div>Loading...</div>}>
        <YouTubeCallback />
      </Suspense>
    ),
  },
])
