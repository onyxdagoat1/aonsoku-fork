import { useQuery } from '@tanstack/react-query'
import {
  Disc,
  Edit2,
  Globe,
  Instagram,
  MoreHorizontal,
  Music,
  Share2,
  ShieldCheck,
  Twitter,
  Users,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { Avatar, AvatarFallback, AvatarImage } from '@/app/components/ui/avatar'
import { Badge } from '@/app/components/ui/badge'
import { Button } from '@/app/components/ui/button'
import { Card, CardContent } from '@/app/components/ui/card'
import { ScrollArea } from '@/app/components/ui/scroll-area'
import { Skeleton } from '@/app/components/ui/skeleton'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/app/components/ui/tabs'
import { ClaimDialog } from '@/app/components/yeditor/claim-dialog' // Will create next
import { useToast } from '@/hooks/use-toast'
import { yeditorService } from '@/service/yeditorService'
import { useAppData } from '@/store/app.store'
import { cn } from '@/utils/cn'

export default function YeditorProfile() {
  const { id } = useParams()
  const { user } = useAppData()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState('overview')

  // Fetch Yeditor Data
  const {
    data: yeditor,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['yeditor', id],
    queryFn: () => yeditorService.getYeditor(id!),
    enabled: !!id,
  })

  // Fetch Yeditor Stats
  const { data: stats } = useQuery({
    queryKey: ['yeditor-stats', id],
    queryFn: () => yeditorService.getYeditorStats(id!),
    enabled: !!id,
  })

  // Fetch Work History (Songs/Albums)
  const { data: works } = useQuery({
    queryKey: ['yeditor-works', id],
    queryFn: () => yeditorService.getYeditorWork(id!),
    enabled: !!id,
  })

  if (isLoading) {
    return <YeditorSkeleton />
  }

  if (error || !yeditor) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-4">
        <ShieldCheck className="w-16 h-16 text-muted-foreground mb-4 opacity-50" />
        <h2 className="text-2xl font-bold mb-2">Yeditor Not Found</h2>
        <p className="text-muted-foreground mb-6">
          The profile you are looking for does not exist or has been removed.
        </p>
        <Link to="/">
          <Button variant="outline">Return Home</Button>
        </Link>
      </div>
    )
  }

  const isOwner = user?.id === yeditor.user_id
  const isClaimable = !yeditor.user_id

  return (
    <ScrollArea className="h-full w-full bg-background/50">
      {/* Banner / Header Section */}
      <div className="relative w-full h-[300px] bg-gradient-to-b from-primary/20 to-background overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:60px_60px]" />

        <div className="absolute bottom-0 left-0 w-full p-8 flex flex-col md:flex-row items-end md:items-center gap-6 bg-gradient-to-t from-background via-background/80 to-transparent">
          <Avatar className="w-32 h-32 border-4 border-background shadow-xl rounded-2xl">
            <AvatarImage
              src={yeditor.avatar_url || ''}
              className="object-cover"
            />
            <AvatarFallback className="text-4xl bg-primary/20 text-primary rounded-2xl">
              {yeditor.name.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 mb-2">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-4xl font-bold tracking-tight text-shadow-sm">
                {yeditor.name}
              </h1>
              {yeditor.is_verified && (
                <Badge
                  variant="secondary"
                  className="gap-1 bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 border-blue-500/20"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Verified Editor
                </Badge>
              )}
            </div>

            <p className="text-lg text-muted-foreground max-w-2xl line-clamp-2">
              {yeditor.bio || 'This editor has not added a bio yet.'}
            </p>

            <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Music className="w-4 h-4" />
                <span className="font-medium text-foreground">
                  {stats?.total_works || 0}
                </span>{' '}
                Works
              </div>
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4" />
                <span className="font-medium text-foreground">
                  {stats?.followers || 0}
                </span>{' '}
                Followers
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 mb-2">
            {isOwner ? (
              <Button variant="outline" className="gap-2">
                <Edit2 className="w-4 h-4" />
                Edit Profile
              </Button>
            ) : isClaimable ? (
              <ClaimDialog yeditorName={yeditor.name} yeditorId={yeditor.id} />
            ) : (
              <Button className="gap-2">Follow</Button>
            )}

            <Button variant="ghost" size="icon">
              <Share2 className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Content Tabs */}
      <div className="p-8 pt-4">
        <Tabs
          defaultValue="overview"
          className="w-full"
          onValueChange={setActiveTab}
        >
          <TabsList className="w-full justify-start h-12 bg-transparent border-b rounded-none p-0 mb-8 border-border/50">
            <TabsTrigger
              value="overview"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 text-base"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="discography"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 text-base"
            >
              Discography
            </TabsTrigger>
            <TabsTrigger
              value="about"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 text-base"
            >
              About
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-2 space-y-8">
                <section>
                  <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Disc className="w-5 h-5 text-primary" />
                    Recent Works
                  </h3>
                  <div className="grid grid-cols-1 gap-2">
                    {works?.slice(0, 5).map((work) => (
                      <Card
                        key={work.id}
                        className="border border-border/40 bg-card/40 hover:bg-card/60 transition-colors"
                      >
                        <div className="p-3 flex items-center gap-4">
                          <div className="h-10 w-10 bg-primary/20 rounded flex items-center justify-center">
                            <Music className="w-5 h-5 opacity-70" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">
                              {work.content_id}{' '}
                              <span className="text-xs text-muted-foreground ml-2 uppercase border px-1 rounded">
                                {work.content_type}
                              </span>
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(work.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </Card>
                    ))}
                    {!works?.length && (
                      <p className="text-muted-foreground italic">
                        No works found.
                      </p>
                    )}
                  </div>
                </section>
              </div>

              <div className="space-y-6">
                <Card>
                  <CardContent className="p-6">
                    <h3 className="font-semibold mb-4">Links</h3>
                    <div className="space-y-3">
                      {Object.entries(yeditor.social_links || {}).map(
                        ([platform, url]) => (
                          <a
                            key={platform}
                            href={url as string}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 text-sm text-muted-foreground hover:text-primary transition-colors"
                          >
                            {platform === 'twitter' && (
                              <Twitter className="w-4 h-4" />
                            )}
                            {platform === 'instagram' && (
                              <Instagram className="w-4 h-4" />
                            )}
                            {platform === 'website' && (
                              <Globe className="w-4 h-4" />
                            )}
                            <span className="capitalize">{platform}</span>
                          </a>
                        ),
                      )}
                      {(!yeditor.social_links ||
                        Object.keys(yeditor.social_links).length === 0) && (
                        <p className="text-sm text-muted-foreground italic">
                          No links added.
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="discography">
            <div className="text-center py-12 text-muted-foreground">
              <Disc className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>Discography view coming soon.</p>
            </div>
          </TabsContent>

          <TabsContent value="about">
            <Card>
              <CardContent className="p-8">
                <h3 className="text-xl font-semibold mb-4">
                  About {yeditor.name}
                </h3>
                <p className="leading-relaxed text-muted-foreground whitespace-pre-line">
                  {yeditor.bio || 'No biography available.'}
                </p>

                <div className="mt-8 pt-8 border-t">
                  <h4 className="text-sm font-semibold mb-2 text-foreground">
                    Member Since
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {new Date(yeditor.created_at).toLocaleDateString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ScrollArea>
  )
}

function YeditorSkeleton() {
  return (
    <div className="w-full h-full p-8 space-y-8">
      <div className="flex items-center gap-6">
        <Skeleton className="w-32 h-32 rounded-2xl" />
        <div className="space-y-4 flex-1">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-full max-w-md" />
          <div className="flex gap-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
      </div>
      <Skeleton className="h-[200px] w-full rounded-xl" />
    </div>
  )
}
