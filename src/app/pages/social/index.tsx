import { Activity, MessageSquare } from 'lucide-react'
import { CommunityActivityFeed } from '@/app/components/social/CommunityActivityFeed'
import { PostsFeed } from '@/app/components/social/PostsFeed'

export default function SocialPage() {
  return (
    <div className="relative min-h-screen bg-background overflow-hidden pb-12">
      {/* Ambient Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] right-[-20%] w-[70%] h-[70%] bg-purple-900/20 rounded-full blur-[120px] animate-blob" />
        <div className="absolute bottom-[-20%] left-[-20%] w-[70%] h-[70%] bg-blue-900/20 rounded-full blur-[120px] animate-blob animation-delay-2000" />
        <div className="absolute inset-0 bg-background/40 backdrop-blur-3xl" />
      </div>

      <div className="relative z-10 w-full px-8 py-8 md:px-12 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <h1 className="text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-white via-white/90 to-white/50">
            Social Hub
          </h1>
          <p className="text-lg text-muted-foreground/80 font-light max-w-2xl">
            Connect with the community, share music, and see what's happening.
          </p>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Feed Column */}
          <div className="xl:col-span-2 space-y-6">
            <div className="flex items-center gap-3 text-xl font-bold text-white/90">
              <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                <MessageSquare className="w-5 h-5 text-primary" />
              </div>
              <h2>Feed</h2>
            </div>

            <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 shadow-xl overflow-hidden min-h-[500px]">
              <PostsFeed />
            </div>
          </div>

          {/* Activity Column */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 text-xl font-bold text-white/90">
              <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                <Activity className="w-5 h-5 text-green-400" />
              </div>
              <h2>Activity</h2>
            </div>

            <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 shadow-xl sticky top-8 max-h-[calc(100vh-100px)] overflow-y-auto scrollbar-hide">
              <CommunityActivityFeed />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
