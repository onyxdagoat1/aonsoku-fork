import {
  AlertCircle,
  EyeOff,
  Layout,
  Music,
  Settings,
  Shield,
  Trophy,
  User,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/app/components/ui/card'
import { ScrollArea } from '@/app/components/ui/scroll-area'
import { ROUTES } from '@/routes/routesList'

export default function HiddenLinks() {
  // Auto-generate categories from ROUTES object
  const categories = [
    {
      title: 'Main Navigation',
      icon: <Layout className="w-5 h-5 text-blue-400" />,
      links: [
        { name: 'Home', path: ROUTES.LIBRARY.HOME, desc: 'Main dashboard' },
        { name: 'Social', path: ROUTES.SOCIAL, desc: 'Community feed' },
        {
          name: 'Party Lobby',
          path: ROUTES.PARTY_LOBBY,
          desc: 'Listening parties',
        },
        { name: 'Charts', path: ROUTES.LIBRARY.CHARTS, desc: 'Top tracks' },
        {
          name: 'Releases',
          path: ROUTES.LIBRARY.RELEASES,
          desc: 'New releases',
        },
        {
          name: 'Messages',
          path: ROUTES.LIBRARY.MESSAGES,
          desc: 'User messages',
        },
      ],
    },
    {
      title: 'Library & Media',
      icon: <Music className="w-5 h-5 text-purple-400" />,
      links: [
        {
          name: 'Artists',
          path: ROUTES.LIBRARY.ARTISTS,
          desc: 'Artist library',
        },
        { name: 'Albums', path: ROUTES.LIBRARY.ALBUMS, desc: 'Album library' },
        { name: 'Songs', path: ROUTES.LIBRARY.SONGS, desc: 'All songs' },
        {
          name: 'Playlists',
          path: ROUTES.LIBRARY.PLAYLISTS,
          desc: 'User playlists',
        },
        {
          name: 'Genre Explorer',
          path: ROUTES.LIBRARY.GENRES,
          desc: 'Music by genre',
        },
        {
          name: 'YouTube',
          path: ROUTES.LIBRARY.YOUTUBE,
          desc: 'YouTube integration',
        },
        {
          name: 'Art Gallery',
          path: ROUTES.LIBRARY.ART,
          desc: 'Track artwork',
        },
        {
          name: 'Podcasts',
          path: ROUTES.LIBRARY.PODCASTS,
          desc: 'Podcast library',
        },
        {
          name: 'Latest Episodes',
          path: ROUTES.EPISODES.LATEST,
          desc: 'New podcast episodes',
        },
      ],
    },
    {
      title: 'Community & Events',
      icon: <Trophy className="w-5 h-5 text-amber-400" />,
      links: [
        {
          name: 'Edit of the Week',
          path: ROUTES.EOTW,
          desc: 'Weekly edit voting',
        },
        {
          name: 'Social Hub',
          path: ROUTES.SOCIAL,
          desc: 'Community posts',
        },
        {
          name: 'Party Lobby',
          path: ROUTES.PARTY_LOBBY,
          desc: 'Live listening parties',
        },
      ],
    },
    {
      title: 'Admin & Management',
      icon: <Shield className="w-5 h-5 text-red-400" />,
      links: [
        {
          name: 'Admin Panel',
          path: ROUTES.ADMIN,
          desc: 'System administration',
        },
        { name: 'Upload', path: ROUTES.UPLOAD, desc: 'Content upload' },
        {
          name: 'Tag Manager',
          path: '/library/tags',
          desc: 'Manage library tags',
        },
        {
          name: 'Bulk Editor',
          path: '/editor/bulk',
          desc: 'Batch metadata editing',
        },
      ],
    },
    {
      title: 'User & System',
      icon: <User className="w-5 h-5 text-green-400" />,
      links: [
        { name: 'Login', path: ROUTES.SERVER_CONFIG, desc: 'Authentication' },
        { name: 'Register', path: ROUTES.REGISTER, desc: 'New account' },
        {
          name: 'Profile (Self)',
          path: ROUTES.PROFILE.replace('/:id?', ''),
          desc: 'User profile',
        },
        {
          name: 'Settings Export',
          path: '/settings/export',
          desc: 'Data export',
        },
        {
          name: 'Queue History',
          path: '/queue/history',
          desc: 'Playback history',
        },
      ],
    },
    {
      title: 'Hidden / WIP / Dynamic',
      icon: <EyeOff className="w-5 h-5 text-yellow-400" />,
      links: [
        {
          name: 'Yeditor (Param)',
          path: '/yeditor/your-id-here',
          desc: 'Yeditor Profile (Dynamic)',
        },
        {
          name: 'Collection (Param)',
          path: '/collection/your-id-here',
          desc: 'Collection View (Dynamic)',
        },
        {
          name: 'Smart Playlist Builder',
          path: '/playlists/smart-builder',
          desc: 'Algorithmic playlists',
        },
        {
          name: 'Advanced Search',
          path: ROUTES.LIBRARY.ADVANCED_SEARCH,
          desc: 'Deep search tools',
        },
        { name: '404 Page', path: '/404', desc: 'Error page preview' },
      ],
    },
  ]

  // Count total routes
  const totalRoutes = categories.reduce((sum, cat) => sum + cat.links.length, 0)

  return (
    <div className="container mx-auto py-10 px-4 min-h-screen">
      <div className="flex items-center gap-4 mb-8">
        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/50">
          Project Index
        </h1>
        <div className="px-3 py-1 rounded-full bg-yellow-500/10 text-yellow-500 text-xs font-mono border border-yellow-500/20">
          CONFIDENTIAL
        </div>
      </div>

      <p className="text-muted-foreground mb-8 text-lg">
        Master directory of all accessible application routes, including hidden
        and administrative paths.{' '}
        <span className="text-primary font-semibold">{totalRoutes} routes</span>{' '}
        indexed.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((category) => (
          <Card
            key={category.title}
            className="bg-card/50 backdrop-blur-sm border-border/50 hover:bg-card/60 transition-colors"
          >
            <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-2">
              <div className="p-2 rounded-md bg-background/50 border border-border/50">
                {category.icon}
              </div>
              <CardTitle className="text-xl font-medium">
                {category.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[200px] pr-4">
                <div className="space-y-1 mt-2">
                  {category.links.map((link) => (
                    <Link
                      key={link.path}
                      to={link.path}
                      className="group flex flex-col p-2 rounded-md hover:bg-white/5 transition-all border border-transparent hover:border-white/5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-primary group-hover:text-primary/80 transition-colors">
                          {link.name}
                        </span>
                        <span className="text-[10px] bg-background/80 font-mono px-1.5 py-0.5 rounded text-muted-foreground/70">
                          {link.path.length > 25
                            ? link.path.substring(0, 24) + '...'
                            : link.path}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground mt-0.5">
                        {link.desc}
                      </span>
                    </Link>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        ))}

        <Card className="bg-destructive/5 border-destructive/20">
          <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-2">
            <div className="p-2 rounded-md bg-destructive/10 border border-destructive/20">
              <AlertCircle className="w-5 h-5 text-destructive" />
            </div>
            <CardTitle className="text-xl font-medium text-destructive">
              Debug Info
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between border-b border-destructive/10 pb-2">
                <span className="text-muted-foreground">App Version</span>
                <span className="font-mono">v0.10.3</span>
              </div>
              <div className="flex justify-between border-b border-destructive/10 pb-2">
                <span className="text-muted-foreground">Environment</span>
                <span className="font-mono">{process.env.NODE_ENV}</span>
              </div>
              <div className="flex justify-between border-b border-destructive/10 pb-2">
                <span className="text-muted-foreground">Total Routes</span>
                <span className="font-mono text-primary">{totalRoutes}</span>
              </div>
              <div className="pt-2 text-xs text-muted-foreground/70">
                Use these links with caution. Dynamic routes (ending in IDs) may
                default to placeholders. This page auto-updates when new routes
                are added to ROUTES.
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
