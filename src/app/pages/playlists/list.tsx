import { useQuery } from '@tanstack/react-query'
import clsx from 'clsx'
import { PlusIcon, Globe, Library, Heart } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useState } from 'react'

import { ShadowHeader } from '@/app/components/album/shadow-header'
import { SongListFallback } from '@/app/components/fallbacks/song-fallbacks'
import { HeaderTitle } from '@/app/components/header-title'
import ListWrapper from '@/app/components/list-wrapper'
import { EmptyPlaylistsPage } from '@/app/components/playlist/empty-page'
import { Button } from '@/app/components/ui/button'
import { DataTable } from '@/app/components/ui/data-table'
import { playlistsColumns } from '@/app/tables/playlists-columns'
import { subsonic } from '@/service/subsonic'
import { socialPlaylistsService } from '@/service/socialPlaylists'
import { usePlayerActions } from '@/store/player.store'
import { usePlaylists } from '@/store/playlists.store'
import { queryKeys } from '@/utils/queryKeys'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs'
import { SocialPlaylistCard } from '@/app/components/playlist/SocialPlaylistCard'

export default function PlaylistsPage() {
  const { setPlaylistDialogState } = usePlaylists()
  const { setSongList } = usePlayerActions()
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState('mine')

  // My Playlists (Navidrome)
  const { data: myPlaylists, isLoading: isMyLoading } = useQuery({
    queryKey: [queryKeys.playlist.all],
    queryFn: subsonic.playlists.getAll,
  })

  // Public Playlists (Supabase)
  const { data: publicPlaylists, isLoading: isPublicLoading } = useQuery({
    queryKey: ['playlists', 'public'],
    queryFn: socialPlaylistsService.getPublicPlaylists,
  })

  const columns = playlistsColumns()

  async function handlePlayPlaylist(playlistId: string) {
    const playlist = await subsonic.playlists.getOne(playlistId)

    if (playlist && playlist.entry.length > 0) {
      setSongList(playlist.entry, 0)
    }
  }

  if (isMyLoading) return <SongListFallback />

  const showMyTable = myPlaylists && myPlaylists.length > 0

  return (
    <div className="w-full h-full flex flex-col">
      <ShadowHeader>
        <div className="w-full flex items-center justify-between">
          <HeaderTitle
            title={t('sidebar.playlists')}
            count={activeTab === 'mine' ? myPlaylists?.length : publicPlaylists?.length}
          />
        </div>

        <Button
          size="sm"
          variant="default"
          className="px-4"
          onClick={() => setPlaylistDialogState(true)}
        >
          <PlusIcon className="w-5 h-5 -ml-[3px]" />
          <span className="ml-2">{t('playlist.form.create.title')}</span>
        </Button>
      </ShadowHeader>

      <div className="flex-1 p-6 overflow-hidden flex flex-col">
        <Tabs defaultValue="mine" value={activeTab} onValueChange={setActiveTab} className="w-full h-full flex flex-col">
          <TabsList className="w-[400px] mb-4">
            <TabsTrigger value="mine">
               <Library className="w-4 h-4 mr-2" /> My Playlists
            </TabsTrigger>
            <TabsTrigger value="browse">
               <Globe className="w-4 h-4 mr-2" /> Browse
            </TabsTrigger>
            <TabsTrigger value="followed" disabled>
               <Heart className="w-4 h-4 mr-2" /> Followed
            </TabsTrigger>
          </TabsList>

          <TabsContent value="mine" className="flex-1 overflow-auto mt-0">
             {!myPlaylists ? null : !showMyTable ? (
                <EmptyPlaylistsPage />
             ) : (
                <ListWrapper>
                  <DataTable
                    columns={columns}
                    data={myPlaylists}
                    showPagination={true}
                    showSearch={true}
                    searchColumn="name"
                    handlePlaySong={(row) => handlePlayPlaylist(row.original.id)}
                    allowRowSelection={false}
                    dataType="playlist"
                    noRowsMessage={t('options.playlist.notFound')}
                  />
                </ListWrapper>
             )}
          </TabsContent>

          <TabsContent value="browse" className="flex-1 overflow-auto mt-0">
             {isPublicLoading ? (
               <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                 {[1,2,3,4,5].map(i => <div key={i} className="aspect-square bg-muted animate-pulse rounded-md" />)}
               </div>
             ) : !publicPlaylists || publicPlaylists.length === 0 ? (
               <div className="text-center py-12 text-muted-foreground">
                 No public playlists found.
               </div>
             ) : (
               <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 pb-12">
                 {publicPlaylists.map(playlist => (
                   <SocialPlaylistCard key={playlist.id} playlist={playlist} />
                 ))}
               </div>
             )}
          </TabsContent>
          
          <TabsContent value="followed">
             <div className="text-center py-12 text-muted-foreground">Followed playlists coming soon</div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
