import { useCallback, useEffect, useState } from 'react'
import { RiHistoryFill, RiLoader4Fill, RiMusic2Line } from 'react-icons/ri'
import { getCoverArtUrl } from '@/api/httpClient'
import type { Song } from '@/api/songService'
import { songService } from '@/api/songService'
import { Badge } from '@/app/components/ui/badge'
import { AdminEditTags } from './AdminEditTags'

export function AdminUploads() {
  const [songs, setSongs] = useState<Song[]>([])
  const [loading, setLoading] = useState(true)

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
    fetchRecentUploads()
  }, [fetchRecentUploads])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <RiLoader4Fill className="text-3xl animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <RiHistoryFill className="text-primary" />
            Upload History
          </h2>
          <p className="text-muted-foreground text-sm">
            Monitor and manage the 50 most recently added tracks.
          </p>
        </div>
      </div>

      <div className="bg-card border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-muted/50 border-b">
                <th className="p-4 font-semibold text-sm">Track</th>
                <th className="p-4 font-semibold text-sm">Album / Artist</th>
                <th className="p-4 font-semibold text-sm">Added Date</th>
                <th className="p-4 font-semibold text-sm text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {songs.map((song) => (
                <tr
                  key={song.id}
                  className="hover:bg-muted/30 transition-colors"
                >
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded bg-muted flex items-center justify-center overflow-hidden shrink-0">
                        {song.coverArt ? (
                          <img
                            src={getCoverArtUrl(song.coverArt, 'song', '100')}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <RiMusic2Line className="text-muted-foreground" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium truncate max-w-[200px]">
                          {song.title}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="text-sm">
                      <p className="font-medium">{song.artist}</p>
                      <p className="text-muted-foreground truncate max-w-[200px]">
                        {song.album}
                      </p>
                    </div>
                  </td>
                  <td className="p-4">
                    <Badge variant="outline" className="font-normal">
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
        </div>

        {songs.length === 0 && (
          <div className="p-12 text-center text-muted-foreground">
            No recent uploads found.
          </div>
        )}
      </div>
    </div>
  )
}
