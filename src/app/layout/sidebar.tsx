import {
  Activity,
  CalendarClock,
  HomeIcon,
  LibraryIcon,
  ListMusicIcon,
  MessageSquare,
  Mic2Icon,
  Music2Icon,
  PaletteIcon,
  PodcastIcon,
  SearchCheck,
  Settings,
  Sparkles,
  TrendingUp,
  Users,
  YoutubeIcon,
} from 'lucide-react'
import { ElementType, memo } from 'react'
import { ROUTES } from '@/routes/routesList'

const ListMusic = memo(ListMusicIcon)
const Mic2 = memo(Mic2Icon)
const Music2 = memo(Music2Icon)
const Home = memo(HomeIcon)
const Library = memo(LibraryIcon)
const Podcast = memo(PodcastIcon)
const Palette = memo(PaletteIcon)
const Youtube = memo(YoutubeIcon)
const UsersIcon = memo(Users)
const ActivityIcon = memo(Activity)
const SparklesIcon = memo(Sparkles)
const TrendingUpIcon = memo(TrendingUp)
const CalendarClockIcon = memo(CalendarClock)
const MessageIcon = memo(MessageSquare)
const SearchCheckIcon = memo(SearchCheck)
const SettingsIcon = memo(Settings)

export interface ISidebarItem {
  id: string
  title: string
  route: string
  icon: ElementType
}

export enum SidebarItems {
  Home = 'home',
  Artists = 'artists',
  Songs = 'songs',
  Albums = 'albums',
  Playlists = 'playlists',
  Podcasts = 'podcasts',

  YouTube = 'youtube',
  Art = 'art',
  Upload = 'upload',
  PartyLobby = 'party-lobby',
  Social = 'social',
  Charts = 'charts',
  Releases = 'releases',
  Messages = 'messages',
  AdvancedSearch = 'advanced-search',
  PodcastAll = 'podcast-all',
  PodcastLatest = 'podcast-latest',
  Genres = 'genres',

  Export = 'export',
}

export const mainNavItems = [
  {
    id: SidebarItems.Home,
    title: 'sidebar.home',
    route: ROUTES.LIBRARY.HOME,
    icon: Home,
  },
  {
    id: SidebarItems.Messages,
    title: 'Messages',
    route: ROUTES.LIBRARY.MESSAGES,
    icon: MessageIcon,
  },
  {
    id: SidebarItems.Charts,
    title: 'Charts',
    route: ROUTES.LIBRARY.CHARTS,
    icon: TrendingUpIcon,
  },
  {
    id: SidebarItems.Social,
    title: 'Social',
    route: ROUTES.SOCIAL,
    icon: ActivityIcon,
  },
]

export const libraryItems = [
  {
    id: SidebarItems.Artists,
    title: 'sidebar.artists',
    route: ROUTES.LIBRARY.ARTISTS,
    icon: Mic2,
  },
  {
    id: SidebarItems.Songs,
    title: 'sidebar.songs',
    route: ROUTES.LIBRARY.SONGS,
    icon: Music2,
  },
  {
    id: SidebarItems.Albums,
    title: 'sidebar.albums',
    route: ROUTES.LIBRARY.ALBUMS,
    icon: Library,
  },
  {
    id: SidebarItems.Playlists,
    title: 'sidebar.playlists',
    route: ROUTES.LIBRARY.PLAYLISTS,
    icon: ListMusic,
  },
  {
    id: SidebarItems.Podcasts,
    title: 'sidebar.podcasts',
    route: ROUTES.LIBRARY.PODCASTS,
    icon: Podcast,
  },
  {
    id: SidebarItems.YouTube,
    title: 'YouTube',
    route: ROUTES.LIBRARY.YOUTUBE,
    icon: Youtube,
  },
  {
    id: SidebarItems.Art,
    title: 'sidebar.art',
    route: ROUTES.LIBRARY.ART,
    icon: Palette,
  },
]

export const podcastItems = [
  {
    id: SidebarItems.PodcastAll,
    title: 'podcasts.form.all',
    route: ROUTES.LIBRARY.PODCASTS,
    icon: () => null,
  },
  {
    id: SidebarItems.PodcastLatest,
    title: 'podcasts.form.latestEpisodes',
    route: ROUTES.EPISODES.LATEST,
    icon: () => null,
  },
]
