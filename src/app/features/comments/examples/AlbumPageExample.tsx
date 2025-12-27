/**
 * Example: Adding comments to an Album/Compilation page
 * 
 * This shows album-level comments plus per-song comments.
 */

import { CommentSection } from '@/app/components/comments/CommentSection';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Badge } from '@/app/components/ui/badge';
import { useCommentStats } from '@/hooks/useComments';

export function AlbumPageExample({ album, songs, currentUser }) {
  const albumStats = useCommentStats('album', album.id);

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Album Header */}
      <div className="flex gap-6">
        <img
          src={album.coverArt}
          alt={album.name}
          className="w-48 h-48 rounded-lg shadow-lg"
        />
        <div className="space-y-2">
          <h1 className="text-4xl font-bold">{album.name}</h1>
          <p className="text-xl text-muted-foreground">{album.artist}</p>
          <div className="flex gap-2">
            <Badge>{album.year}</Badge>
            <Badge variant="outline">{album.genre}</Badge>
          </div>
        </div>
      </div>

      {/* Tabs for content */}
      <Tabs defaultValue="songs">
        <TabsList>
          <TabsTrigger value="songs">Songs</TabsTrigger>
          <TabsTrigger value="comments">
            Discussion
            {albumStats.data && (
              <Badge variant="secondary" className="ml-2">
                {albumStats.data.total_comments}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Songs Tab */}
        <TabsContent value="songs" className="space-y-4">
          {songs.map((song) => (
            <SongWithComments
              key={song.id}
              song={song}
              currentUser={currentUser}
            />
          ))}
        </TabsContent>

        {/* Album Comments Tab */}
        <TabsContent value="comments">
          <CommentSection
            contentType="album"
            contentId={album.id}
            userId={currentUser?.id}
            username={currentUser?.username}
            userAvatar={currentUser?.avatarUrl}
            title="Album Discussion"
            placeholder={`What do you think of ${album.name}?`}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Component for individual song with expandable comments
function SongWithComments({ song, currentUser }) {
  const [showComments, setShowComments] = useState(false);
  const stats = useCommentStats('song', song.id);

  return (
    <div className="border rounded-lg p-4 space-y-4">
      {/* Song info */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">{song.title}</h3>
          <p className="text-sm text-muted-foreground">{song.duration}</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowComments(!showComments)}
        >
          <MessageSquare className="h-4 w-4 mr-2" />
          {stats.data?.total_comments || 0}
        </Button>
      </div>

      {/* Expandable comments */}
      {showComments && (
        <div className="border-t pt-4">
          <CommentSection
            contentType="song"
            contentId={song.id}
            userId={currentUser?.id}
            username={currentUser?.username}
            userAvatar={currentUser?.avatarUrl}
            title={null}
            placeholder={`Comment on "${song.title}"...`}
          />
        </div>
      )}
    </div>
  );
}
