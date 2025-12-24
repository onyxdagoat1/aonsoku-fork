import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { useAppData } from '@/store/app.store';
import { toast } from 'react-toastify';

interface User {
  id: string;
  userName: string;
  email?: string;
  isAdmin: boolean;
  lastLoginAt?: string;
  createdAt?: string;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const { url, username, token } = useAppData();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${url}/rest/getUsers?u=${username}&t=${token}&s=random&v=1.16.1&c=aonsoku&f=json`);
      const data = await response.json();
      
      if (data['subsonic-response']?.status === 'ok') {
        const userList = data['subsonic-response'].users?.user || [];
        setUsers(userList);
      } else {
        toast.error('Failed to fetch users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Error fetching users');
    } finally {
      setLoading(false);
    }
  };

  const toggleAdmin = async (userId: string, currentAdminStatus: boolean) => {
    try {
      // Call Navidrome API to update user
      const response = await fetch(
        `${url}/rest/updateUser?u=${username}&t=${token}&s=random&v=1.16.1&c=aonsoku&f=json&username=${userId}&adminRole=${!currentAdminStatus}`,
        { method: 'GET' }
      );
      
      const data = await response.json();
      
      if (data['subsonic-response']?.status === 'ok') {
        toast.success(`User ${currentAdminStatus ? 'removed from' : 'promoted to'} admin`);
        fetchUsers(); // Refresh the list
      } else {
        toast.error('Failed to update user');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Error updating user');
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-lg">Loading users...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">User Management</h1>
        <p className="text-muted-foreground mt-2">Manage users and their permissions</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Users ({users.length})</CardTitle>
          <CardDescription>View and manage user accounts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-lg">{user.userName}</h3>
                    {user.isAdmin && (
                      <span className="px-2 py-1 text-xs font-medium bg-primary/20 text-primary rounded-full">
                        Admin
                      </span>
                    )}
                  </div>
                  {user.email && (
                    <p className="text-sm text-muted-foreground mt-1">{user.email}</p>
                  )}
                  <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                    {user.createdAt && (
                      <span>Created: {new Date(user.createdAt).toLocaleDateString()}</span>
                    )}
                    {user.lastLoginAt && (
                      <span>Last login: {new Date(user.lastLoginAt).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={user.isAdmin ? 'destructive' : 'default'}
                    size="sm"
                    onClick={() => toggleAdmin(user.userName, user.isAdmin)}
                    disabled={user.userName === username} // Can't change your own admin status
                  >
                    {user.isAdmin ? 'Remove Admin' : 'Make Admin'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
