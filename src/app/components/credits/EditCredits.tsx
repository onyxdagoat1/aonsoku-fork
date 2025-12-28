import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Textarea } from '@/app/components/ui/textarea';
import { toast } from 'react-toastify';
import { Plus, X, Award } from 'lucide-react';

interface EditCreditsProps {
  contentType: 'track' | 'album';
  contentId: string;
}

interface Credit {
  id?: string;
  user_id: string;
  credit_type: 'editor' | 'remixer' | 'producer' | 'arranger' | 'contributor';
  role_description?: string;
  username?: string;
  display_name?: string;
}

export function EditCredits({ contentType, contentId }: EditCreditsProps) {
  const { user, profile } = useAuth();
  const [credits, setCredits] = useState<Credit[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCredit, setNewCredit] = useState({
    credit_type: 'editor' as Credit['credit_type'],
    role_description: '',
    username: '',
  });

  useEffect(() => {
    loadCredits();
  }, [contentType, contentId]);

  const loadCredits = async () => {
    try {
      const { data, error } = await supabase
        .from('edit_credits')
        .select(`
          *,
          profiles:user_id (
            username,
            display_name
          )
        `)
        .eq('content_type', contentType)
        .eq('content_id', contentId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const formattedCredits = (data || []).map((credit: any) => ({
        id: credit.id,
        user_id: credit.user_id,
        credit_type: credit.credit_type,
        role_description: credit.role_description,
        username: credit.profiles?.username || 'Unknown',
        display_name: credit.profiles?.display_name || credit.profiles?.username || 'Unknown',
      }));

      setCredits(formattedCredits);
    } catch (error) {
      console.error('Error loading credits:', error);
    }
  };

  const handleAddCredit = async () => {
    if (!user || !profile) {
      toast.info('Please log in to add credits');
      return;
    }

    if (!newCredit.username.trim()) {
      toast.error('Please enter a username');
      return;
    }

    setLoading(true);
    try {
      // Find user by username
      const { data: targetUser } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', newCredit.username.trim())
        .single();

      if (!targetUser) {
        toast.error('User not found');
        setLoading(false);
        return;
      }

      const { error } = await supabase
        .from('edit_credits')
        .insert({
          content_type: contentType,
          content_id: contentId,
          user_id: targetUser.id,
          credit_type: newCredit.credit_type,
          role_description: newCredit.role_description || null,
        });

      if (error) throw error;

      toast.success('Credit added!');
      setNewCredit({ credit_type: 'editor', role_description: '', username: '' });
      setShowAddForm(false);
      loadCredits();
    } catch (error: any) {
      console.error('Error adding credit:', error);
      toast.error(error.message || 'Failed to add credit');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveCredit = async (creditId: string) => {
    if (!user || !profile) return;

    // Check if user is admin or the credit owner
    const credit = credits.find(c => c.id === creditId);
    if (!credit) return;

    if (credit.user_id !== profile.id && !profile.is_admin) {
      toast.error('You can only remove your own credits');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('edit_credits')
        .delete()
        .eq('id', creditId);

      if (error) throw error;

      toast.success('Credit removed');
      loadCredits();
    } catch (error: any) {
      console.error('Error removing credit:', error);
      toast.error('Failed to remove credit');
    } finally {
      setLoading(false);
    }
  };

  const creditTypeLabels: Record<Credit['credit_type'], string> = {
    editor: 'Editor',
    remixer: 'Remixer',
    producer: 'Producer',
    arranger: 'Arranger',
    contributor: 'Contributor',
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5" />
              Edit Credits
            </CardTitle>
            <CardDescription>
              Credit editors, remixers, and contributors
            </CardDescription>
          </div>
          {user && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddForm(!showAddForm)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Credit
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {showAddForm && (
          <Card className="border-primary">
            <CardContent className="pt-6 space-y-4">
              <div>
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={newCredit.username}
                  onChange={(e) => setNewCredit({ ...newCredit, username: e.target.value })}
                  placeholder="Enter username"
                />
              </div>
              <div>
                <Label htmlFor="credit_type">Credit Type</Label>
                <Select
                  value={newCredit.credit_type}
                  onValueChange={(value) => setNewCredit({ ...newCredit, credit_type: value as Credit['credit_type'] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(creditTypeLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="role_description">Role Description (Optional)</Label>
                <Textarea
                  id="role_description"
                  value={newCredit.role_description}
                  onChange={(e) => setNewCredit({ ...newCredit, role_description: e.target.value })}
                  placeholder="e.g., Main editor, Remix engineer..."
                  rows={2}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleAddCredit} disabled={loading}>
                  Add
                </Button>
                <Button variant="outline" onClick={() => setShowAddForm(false)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {credits.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No credits yet. Be the first to add one!
          </p>
        ) : (
          <div className="space-y-2">
            {credits.map((credit) => (
              <div
                key={credit.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div>
                  <p className="font-medium">{credit.display_name || credit.username}</p>
                  <p className="text-sm text-muted-foreground">
                    {creditTypeLabels[credit.credit_type]}
                    {credit.role_description && ` • ${credit.role_description}`}
                  </p>
                </div>
                {(user && (profile?.id === credit.user_id || profile?.is_admin)) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => credit.id && handleRemoveCredit(credit.id)}
                    disabled={loading}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

