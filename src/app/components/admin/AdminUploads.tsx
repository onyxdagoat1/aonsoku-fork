import { Tag } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import {
  RiHistoryFill,
  RiLoader4Fill,
  RiMusic2Line,
  RiUploadCloud2Line,
} from 'react-icons/ri'
import { getCoverArtUrl } from '@/api/httpClient'
import type { Song } from '@/api/songService'
import { songService } from '@/api/songService'
import { Badge } from '@/app/components/ui/badge'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/app/components/ui/tabs'
import { AdminEditTags } from './AdminEditTags'
import { BulkEraEditor } from './BulkEraEditor'
import { UploaderTool } from './UploaderTool'

export function AdminUploads() {
  const [songs, setSongs] = useState<Song[]>([])
  const [loading, setLoading] = useState(true)
  const [activeSubTab, setActiveSubTab] = useState<string>('upload')

  const fetchRecentUploads = useCallback(async () => {
    setLoading(true)
    try {
      const recent = await songService.getRecentSongs(50)
      setSongs(recent || [])
    } catch (error) {
      console.error('Error fetching recent uploads:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (activeSubTab === 'history') {
      fetchRecentUploads()
    }
  }, [fetchRecentUploads, activeSubTab])

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <RiUploadCloud2Line className="text-primary" />
            Uploads Management
          </h2>
          <p className="text-muted-foreground text-sm">
            Upload new tracks, bulk edit eras, or view upload history.
          </p>
        </div>
      </div>

      <Tabs
        value={activeSubTab}
        onValueChange={(v) => setActiveSubTab(v)}
        className="w-full"
      >
        <TabsList className="bg-muted/50 p-1 rounded-xl mb-6">
          <TabsTrigger
            value="upload"
            className="rounded-lg gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm px-6"
          >
            <RiUploadCloud2Line className="w-4 h-4" /> Upload New
          </TabsTrigger>
          <TabsTrigger
            value="bulk-era"
            className="rounded-lg gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm px-6"
          >
            <Tag className="w-4 h-4" /> Bulk Era Editor
          </TabsTrigger>
          <TabsTrigger
            value="history"
            className="rounded-lg gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm px-6"
          >
            <RiHistoryFill className="w-4 h-4" /> Upload History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="mt-0 focus-visible:outline-none">
          <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
            <UploaderTool />
          </div>
        </TabsContent>

        <TabsContent
          value="bulk-era"
          className="mt-0 focus-visible:outline-none"
        >
          <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
            <BulkEraEditor />
          </div>
        </TabsContent>

        <TabsContent
          value="history"
          className="mt-0 focus-visible:outline-none"
        >
          <div className="bg-card border border-border/50 rounded-2xl shadow-sm">
            {loading ? (
              <div className="flex items-center justify-center p-12">
                <RiLoader4Fill className="text-3xl animate-spin text-primary" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-muted/30 border-b border-border/50">
                      <th className="p-4 font-semibold text-sm">Track</th>
                      <th className="p-4 font-semibold text-sm">
                        Album / Artist
                      </th>
                      <th className="p-4 font-semibold text-sm">Added Date</th>
                      <th className="p-4 font-semibold text-sm text-right">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {songs.map((song) => (
                      <tr
                        key={song.id}
                        className="hover:bg-muted/20 transition-colors group"
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center overflow-hidden shrink-0 shadow-sm border border-border/50">
                              {song.coverArt ? (
                                <img
                                  src={getCoverArtUrl(
                                    song.coverArt,
                                    'song',
                                    '100',
                                  )}
                                  alt=""
                                  className="w-full h-full object-cover transition-transform group-hover:scale-110"
                                />
                              ) : (
                                <RiMusic2Line className="text-muted-foreground w-5 h-5" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium truncate max-w-[200px] text-sm">
                                {song.title}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="text-sm">
                            <p className="font-medium">{song.artist}</p>
                            <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                              {song.album}
                            </p>
                          </div>
                        </td>
                        <td className="p-4 text-sm">
                          <Badge
                            variant="outline"
                            className="font-normal bg-muted/50"
                          >
                            {song.created
                              ? new Date(song.created).toLocaleDateString()
                              : 'N/A'}
                          </Badge>
                        </td>
                        <td className="p-4 text-right">
                          <AdminEditTags
                            contentId={song.id}
                            contentType="song"
                            contentName={song.title}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {songs.length === 0 && (
                  <div className="p-12 text-center text-muted-foreground">
                    <RiMusic2Line className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>No recent uploads found.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
