import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/app/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/app/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Badge } from '@/app/components/ui/badge';
import { Skeleton } from '@/app/components/ui/skeleton';
import { 
  User, Music, Heart, Star, Users, Calendar, 
  Edit, Settings, Follow, MessageSquare, Grid3x3, List
} from 'lucide-react';
import { toast } from 'react-toastify';

interface ProfileData {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  is_yeditor: boolean;
  created_at: string;
  stats: {
    works_count: number;
    followers_count: number;
    following_count: number;
    ratings_count: number;
    favorites_count: number;
  };
}

interface YeditorWork {
  id: string;
  title: string;
  description: string | null;
  work_type: string;
  cover_art_url: string | null;
  view_count: number;
  like_count: number;
  is_featured: boolean;
  is_definitive: boolean;
  created_at: string;
}

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [works, setWorks] = useState<YeditorWork[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('works');

  const isOwnProfile = currentUser && (username === 'me' || username === currentUser.username);

  useEffect(() => {
    loadProfile();
  }, [username]);

  const loadProfile = async () => {
    if (!username) return;
    
    setLoading(true);
    try {
      // Get profile
      let profileQuery = supabase
        .from('profiles')
        .select('*')
        .single();

      if (username === 'me' && currentUser) {
        profileQuery = profileQuery.eq('id', currentUser.id);
      } else {
        profileQuery = profileQuery.eq('username', username);
      }

      const { data: profileData, error: profileError } = await profileQuery;

      if (profileError) throw profileError;
      if (!profileData) {
        toast.error('Profile not found');
        navigate('/');
        return;
      }

      // Get stats
      const [worksResult, followersResult, followingResult, ratingsResult, favoritesResult] = await Promise.all([
        supabase.from('yeditor_works').select('id', { count: 'exact' }).eq('user_id', profileData.id),
        supabase.from('follows').select('id', { count: 'exact' }).eq('following_id', profileData.id),
        supabase.from('follows').select('id', { count: 'exact' }).eq('follower_id', profileData.id),
        supabase.from('ratings').select('id', { count: 'exact' }).eq('user_id', profileData.id),
        supabase.from('favorites').select('id', { count: 'exact' }).eq('user_id', profileData.id),
      ]);

      // Get works
      const { data: worksData } = await supabase
        .from('yeditor_works')
        .select('*')
        .eq('user_id', profileData.id)
        .order('created_at', { ascending: false })
        .limit(20);

      // Check if current user is following
      let following = false;
      if (currentUser && currentUser.id !== profileData.id) {
        const { data: followData } = await supabase
          .from('follows')
          .select('id')
          .eq('follower_id', currentUser.id)
          .eq('following_id', profileData.id)
          .single();
        following = !!followData;
      }

      setProfile({
        ...profileData,
        stats: {
          works_count: worksResult.count || 0,
          followers_count: followersResult.count || 0,
          following_count: followingResult.count || 0,
          ratings_count: ratingsResult.count || 0,
          favorites_count: favoritesResult.count || 0,
        },
      });
      setWorks(worksData || []);
      setIsFollowing(following);
    } catch (error) {
      console.error('Error loading profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!currentUser || !profile) return;

    try {
      if (isFollowing) {
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', currentUser.id)
          .eq('following_id', profile.id);

        if (error) throw error;
        setIsFollowing(false);
        toast.success('Unfollowed');
      } else {
        const { error } = await supabase
          .from('follows')
          .insert({
            follower_id: currentUser.id,
            following_id: profile.id,
          });

        if (error) throw error;
        setIsFollowing(true);
        toast.success('Following');
      }
      loadProfile(); // Reload to update counts
    } catch (error) {
      console.error('Error toggling follow:', error);
      toast.error('Failed to update follow status');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <p>Profile not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Profile Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={profile.avatar_url || undefined} />
              <AvatarFallback>
                {profile.display_name?.[0] || profile.username[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-3xl font-bold">{profile.display_name || profile.username}</h1>
                  <p className="text-muted-foreground">@{profile.username}</p>
                  {profile.is_yeditor && (
                    <Badge variant="default" className="mt-2">
                      <Edit className="h-3 w-3 mr-1" />
                      Yeditor
                    </Badge>
                  )}
                </div>
                
                <div className="flex gap-2">
                  {isOwnProfile ? (
                    <Button variant="outline" onClick={() => navigate('/profile/me/edit')}>
                      <Settings className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Button>
                  ) : currentUser ? (
                    <Button onClick={handleFollow}>
                      <Follow className="h-4 w-4 mr-2" />
                      {isFollowing ? 'Unfollow' : 'Follow'}
                    </Button>
                  ) : (
                    <Button onClick={() => navigate('/auth/login')}>
                      Follow
                    </Button>
                  )}
                </div>
              </div>

              {profile.bio && (
                <p className="text-sm">{profile.bio}</p>
              )}

              {/* Stats */}
              <div className="flex gap-6 pt-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{profile.stats.works_count}</div>
                  <div className="text-xs text-muted-foreground">Works</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{profile.stats.followers_count}</div>
                  <div className="text-xs text-muted-foreground">Followers</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{profile.stats.following_count}</div>
                  <div className="text-xs text-muted-foreground">Following</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{profile.stats.ratings_count}</div>
                  <div className="text-xs text-muted-foreground">Ratings</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="works">
            <Music className="h-4 w-4 mr-2" />
            Works
          </TabsTrigger>
          <TabsTrigger value="favorites">
            <Heart className="h-4 w-4 mr-2" />
            Favorites
          </TabsTrigger>
          <TabsTrigger value="ratings">
            <Star className="h-4 w-4 mr-2" />
            Ratings
          </TabsTrigger>
          {isOwnProfile && (
            <TabsTrigger value="activity">
              <Calendar className="h-4 w-4 mr-2" />
              Activity
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="works" className="mt-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {works.map((work) => (
              <Card key={work.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardContent className="p-0">
                  <div className="aspect-square bg-muted relative">
                    {work.cover_art_url ? (
                      <img 
                        src={work.cover_art_url} 
                        alt={work.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Music className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                    {work.is_featured && (
                      <Badge className="absolute top-2 right-2">Featured</Badge>
                    )}
                    {work.is_definitive && (
                      <Badge variant="default" className="absolute top-2 left-2">Definitive</Badge>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold truncate">{work.title}</h3>
                    <p className="text-xs text-muted-foreground capitalize">{work.work_type}</p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      <span>{work.view_count} views</span>
                      <span>•</span>
                      <span>{work.like_count} likes</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          {works.length === 0 && (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                No works yet
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="favorites" className="mt-6">
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              Favorites coming soon
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ratings" className="mt-6">
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              Ratings coming soon
            </CardContent>
          </Card>
        </TabsContent>

        {isOwnProfile && (
          <TabsContent value="activity" className="mt-6">
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                Activity feed coming soon
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

