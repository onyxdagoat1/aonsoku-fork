import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/app/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Badge } from '@/app/components/ui/badge';
import { Input } from '@/app/components/ui/input';
import { 
  Users, Star, Music, TrendingUp, Settings, 
  Shield, Ban, CheckCircle, XCircle, Edit
} from 'lucide-react';
import { toast } from 'react-toastify';

interface AdminStats {
  total_users: number;
  total_works: number;
  total_ratings: number;
  featured_works: number;
  pending_highlights: number;
}

export default function AdminPanel() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    checkAdminAccess();
    loadStats();
  }, []);

  const checkAdminAccess = async () => {
    if (!user || !profile) {
      toast.error('You must be logged in to access the admin panel');
      navigate('/');
      return;
    }

    // Check if user is admin
    const { data: profileData } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profileData?.is_admin) {
      toast.error('You do not have admin access');
      navigate('/');
      return;
    }
  };

  const loadStats = async () => {
    try {
      const [usersResult, worksResult, ratingsResult, featuredResult, highlightsResult] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact' }),
        supabase.from('yeditor_works').select('id', { count: 'exact' }),
        supabase.from('ratings').select('id', { count: 'exact' }),
        supabase.from('yeditor_works').select('id', { count: 'exact' }).eq('is_featured', true),
        supabase.from('highlights').select('id', { count: 'exact' }).eq('is_active', true),
      ]);

      setStats({
        total_users: usersResult.count || 0,
        total_works: worksResult.count || 0,
        total_ratings: ratingsResult.count || 0,
        featured_works: featuredResult.count || 0,
        pending_highlights: highlightsResult.count || 0,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
      toast.error('Failed to load admin stats');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <p>Loading...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8" />
            Admin Panel
          </h1>
          <p className="text-muted-foreground mt-1">Manage your platform</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="highlights">Highlights</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.total_users || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Works</CardTitle>
                <Music className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.total_works || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Ratings</CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.total_ratings || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Featured Works</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.featured_works || 0}</div>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start" onClick={() => setActiveTab('highlights')}>
                <Edit className="h-4 w-4 mr-2" />
                Manage Highlights
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => setActiveTab('users')}>
                <Users className="h-4 w-4 mr-2" />
                Manage Users
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => setActiveTab('content')}>
                <Music className="h-4 w-4 mr-2" />
                Review Content
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="mt-6">
          <UsersManagement />
        </TabsContent>

        <TabsContent value="content" className="mt-6">
          <ContentManagement />
        </TabsContent>

        <TabsContent value="highlights" className="mt-6">
          <HighlightsManagement />
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Admin Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Settings coming soon</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function UsersManagement() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const toggleAdmin = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_admin: !currentStatus })
        .eq('id', userId);

      if (error) throw error;
      toast.success(`User ${!currentStatus ? 'promoted to' : 'removed from'} admin`);
      loadUsers();
    } catch (error) {
      console.error('Error toggling admin:', error);
      toast.error('Failed to update user');
    }
  };

  const toggleYeditor = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_yeditor: !currentStatus })
        .eq('id', userId);

      if (error) throw error;
      toast.success(`User ${!currentStatus ? 'marked as' : 'unmarked from'} Yeditor`);
      loadUsers();
    } catch (error) {
      console.error('Error toggling yeditor:', error);
      toast.error('Failed to update user');
    }
  };

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.display_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>User Management</CardTitle>
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-64"
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {filteredUsers.map((user) => (
            <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <div className="font-semibold">{user.display_name || user.username}</div>
                <div className="text-sm text-muted-foreground">@{user.username}</div>
                <div className="flex gap-2 mt-1">
                  {user.is_admin && <Badge variant="default">Admin</Badge>}
                  {user.is_yeditor && <Badge>Yeditor</Badge>}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={user.is_admin ? 'default' : 'outline'}
                  onClick={() => toggleAdmin(user.id, user.is_admin)}
                >
                  {user.is_admin ? <Shield className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
                </Button>
                <Button
                  size="sm"
                  variant={user.is_yeditor ? 'default' : 'outline'}
                  onClick={() => toggleYeditor(user.id, user.is_yeditor)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ContentManagement() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Content Management</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Content management features coming soon</p>
      </CardContent>
    </Card>
  );
}

function HighlightsManagement() {
  const [highlights, setHighlights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHighlights();
  }, []);

  const loadHighlights = async () => {
    try {
      const { data, error } = await supabase
        .from('highlights')
        .select('*')
        .order('featured_at', { ascending: false });

      if (error) throw error;
      setHighlights(data || []);
    } catch (error) {
      console.error('Error loading highlights:', error);
      toast.error('Failed to load highlights');
    } finally {
      setLoading(false);
    }
  };

  const toggleHighlight = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('highlights')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      toast.success(`Highlight ${!currentStatus ? 'activated' : 'deactivated'}`);
      loadHighlights();
    } catch (error) {
      console.error('Error toggling highlight:', error);
      toast.error('Failed to update highlight');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Highlights Management</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {highlights.map((highlight) => (
            <div key={highlight.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <div className="font-semibold">{highlight.title || highlight.highlight_type}</div>
                <div className="text-sm text-muted-foreground">
                  {highlight.entity_type} • {highlight.highlight_type}
                </div>
              </div>
              <div className="flex gap-2">
                <Badge variant={highlight.is_active ? 'default' : 'secondary'}>
                  {highlight.is_active ? 'Active' : 'Inactive'}
                </Badge>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => toggleHighlight(highlight.id, highlight.is_active)}
                >
                  {highlight.is_active ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          ))}
          {highlights.length === 0 && (
            <p className="text-center text-muted-foreground py-8">No highlights yet</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

