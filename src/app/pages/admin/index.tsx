import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Badge } from '@/app/components/ui/badge';
import { toast } from 'react-toastify';
import { Shield, Users, MessageSquare, Award, Ban, CheckCircle, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface User {
  id: string;
  username: string;
  display_name: string | null;
  email: string;
  is_admin: boolean;
  is_yeditor: boolean;
  created_at: string;
}

interface Comment {
  id: string;
  username: string;
  text: string;
  content_type: string;
  content_id: string;
  reported: boolean;
  deleted: boolean;
  created_at: string;
}

export function AdminPanel() {
  const { user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (profile && !profile.is_admin) {
      toast.error('Access denied. Admin privileges required.');
      navigate('/');
      return;
    }

    if (profile?.is_admin) {
      loadUsers();
      loadReportedComments();
    }
  }, [profile]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || !profile || !profile.is_admin) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Admin access required. Please log in with an admin account.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const loadUsers = async () => {
    setLoading(true);
    try {
      // Try to get users from backend API first (works with anon key)
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
      
      try {
        const session = await supabase.auth.getSession();
        const token = session.data.session?.access_token;

        if (token) {
          const response = await fetch(`${backendUrl}/api/admin/users`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          if (response.ok) {
            const data = await response.json();
            if (data.success && data.users) {
              setUsers(data.users);
              setLoading(false);
              return;
            }
          }
        }
      } catch (apiError) {
        console.log('Backend API not available, falling back to direct query:', apiError);
      }

      // Fallback: Get profiles directly (won't have emails with anon key)
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const usersWithEmail = (profiles || []).map(profile => ({
        ...profile,
        email: 'N/A', // Can't get emails with anon key
      }));

      setUsers(usersWithEmail);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const loadReportedComments = async () => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('reported', true)
        .eq('deleted', false)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error('Error loading reported comments:', error);
    }
  };

  const handleToggleAdmin = async (userId: string, currentValue: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_admin: !currentValue })
        .eq('id', userId);

      if (error) throw error;

      toast.success(`User ${!currentValue ? 'promoted to' : 'removed from'} admin`);
      loadUsers();
    } catch (error: any) {
      console.error('Error updating admin status:', error);
      toast.error('Failed to update admin status');
    }
  };

  const handleToggleYeditor = async (userId: string, currentValue: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_yeditor: !currentValue })
        .eq('id', userId);

      if (error) throw error;

      toast.success(`User ${!currentValue ? 'promoted to' : 'removed from'} yeditor`);
      loadUsers();
    } catch (error: any) {
      console.error('Error updating yeditor status:', error);
      toast.error('Failed to update yeditor status');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      const { error } = await supabase
        .from('comments')
        .update({ deleted: true, text: '[deleted by admin]' })
        .eq('id', commentId);

      if (error) throw error;

      toast.success('Comment deleted');
      loadReportedComments();
    } catch (error: any) {
      console.error('Error deleting comment:', error);
      toast.error('Failed to delete comment');
    }
  };

  const handleDismissReport = async (commentId: string) => {
    try {
      const { error } = await supabase
        .from('comments')
        .update({ reported: false })
        .eq('id', commentId);

      if (error) throw error;

      toast.success('Report dismissed');
      loadReportedComments();
    } catch (error: any) {
      console.error('Error dismissing report:', error);
      toast.error('Failed to dismiss report');
    }
  };

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Admin Panel
          </CardTitle>
          <CardDescription>
            Manage users, content, and moderation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="users" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="users">
                <Users className="w-4 h-4 mr-2" />
                Users
              </TabsTrigger>
              <TabsTrigger value="moderation">
                <MessageSquare className="w-4 h-4 mr-2" />
                Moderation
              </TabsTrigger>
            </TabsList>

            <TabsContent value="users" className="space-y-4">
              <div>
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="max-w-sm"
                />
              </div>

              <div className="space-y-2">
                {loading ? (
                  <p className="text-center text-muted-foreground py-8">Loading...</p>
                ) : filteredUsers.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No users found</p>
                ) : (
                  filteredUsers.map((user) => (
                    <Card key={user.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{user.display_name || user.username}</p>
                            <p className="text-sm text-muted-foreground">
                              @{user.username} • {user.email}
                            </p>
                            <div className="flex gap-2 mt-2">
                              {user.is_admin && <Badge variant="destructive">Admin</Badge>}
                              {user.is_yeditor && <Badge variant="default">Yeditor</Badge>}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant={user.is_admin ? 'destructive' : 'outline'}
                              size="sm"
                              onClick={() => handleToggleAdmin(user.id, user.is_admin)}
                            >
                              {user.is_admin ? 'Remove Admin' : 'Make Admin'}
                            </Button>
                            <Button
                              variant={user.is_yeditor ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => handleToggleYeditor(user.id, user.is_yeditor)}
                            >
                              {user.is_yeditor ? 'Remove Yeditor' : 'Make Yeditor'}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="moderation" className="space-y-4">
              <h3 className="font-semibold">Reported Comments</h3>
              {comments.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No reported comments</p>
              ) : (
                <div className="space-y-2">
                  {comments.map((comment) => (
                    <Card key={comment.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium">@{comment.username}</p>
                            <p className="text-sm text-muted-foreground mt-1">{comment.text}</p>
                            <p className="text-xs text-muted-foreground mt-2">
                              {comment.content_type} • {comment.content_id}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDismissReport(comment.id)}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Dismiss
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteComment(comment.id)}
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

