import { clsx } from 'clsx'
import {
  Activity,
  Award,
  Ban,
  CheckCircle,
  LayoutDashboard,
  MessageSquare,
  Search,
  Shield,
  Star,
  User as UserIcon,
  Users,
  XCircle,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { AdminUploads } from '@/app/components/admin/AdminUploads'
import {
  HighlightsManagement,
  YeditorManagement,
} from '@/app/components/admin/YeditorHighlightsManagement'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

interface User {
  id: string
  username: string
  display_name: string | null
  email: string
  is_admin: boolean
  is_yeditor: boolean
  created_at: string
  avatar_url?: string
}

interface Comment {
  id: string
  username: string
  text: string
  content_type: string
  content_id: string
  reported: boolean
  deleted: boolean
  created_at: string
}

export function AdminPanel() {
  const { profile, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<
    'overview' | 'users' | 'moderation' | 'yeditors' | 'highlights' | 'uploads'
  >('overview')
  const [users, setUsers] = useState<User[]>([])
  const [comments, setComments] = useState<Comment[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [stats, setStats] = useState({
    totalUsers: 0,
    newUsersToday: 0,
    activeReports: 0,
  })

  const loadUsers = useCallback(async () => {
    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      const mappedUsers = (profiles || []).map((p) => ({
        ...p,
        email: 'Hidden (Privacy)', // or fetch if really needed and allowed
      }))
      setUsers(mappedUsers)

      // Calculate stats
      const today = new Date().toISOString().split('T')[0]
      const newUsers = mappedUsers.filter((u) =>
        u.created_at.startsWith(today),
      ).length
      setStats((prev) => ({
        ...prev,
        totalUsers: mappedUsers.length,
        newUsersToday: newUsers,
      }))
    } catch (error) {
      console.error('Error loading users:', error)
      toast.error('Failed to load users')
    }
  }, [])

  const loadReportedComments = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('reported', true)
        .eq('deleted', false)
        .order('created_at', { ascending: false })

      if (error) throw error
      setComments(data || [])
      setStats((prev) => ({ ...prev, activeReports: (data || []).length }))
    } catch (error) {
      console.error('Error loading reported comments:', error)
    }
  }, [])

  const fetchData = useCallback(async () => {
    await Promise.all([loadUsers(), loadReportedComments()])
  }, [loadUsers, loadReportedComments])

  useEffect(() => {
    if (profile && !profile.is_admin) {
      toast.error('Access denied. Admin privileges required.')
      navigate('/')
      return
    }

    if (profile?.is_admin) {
      fetchData()
    }
  }, [profile, navigate, fetchData])

  const handleToggleAdmin = async (userId: string, currentValue: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_admin: !currentValue })
        .eq('id', userId)

      if (error) throw error
      toast.success(
        currentValue ? 'Admin privileges removed' : 'Admin privileges granted',
      )
      loadUsers()
    } catch (_e) {
      toast.error('Failed to update admin status')
    }
  }

  const handleToggleYeditor = async (userId: string, currentValue: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_yeditor: !currentValue })
        .eq('id', userId)

      if (error) throw error
      toast.success(
        currentValue
          ? 'Yeditor privileges removed'
          : 'Yeditor privileges granted',
      )
      loadUsers()
    } catch (_e) {
      toast.error('Failed to update status')
    }
  }

  const handleKeepComment = async (commentId: string) => {
    try {
      const { error } = await supabase
        .from('comments')
        .update({ reported: false })
        .eq('id', commentId)

      if (error) throw error
      toast.success('Report dismissed, comment kept')
      loadReportedComments()
    } catch (error) {
      console.error('Error keeping comment:', error)
      toast.error('Failed to update comment')
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return

    try {
      const { error } = await supabase
        .from('comments')
        .update({ deleted: true, text: '[deleted by admin]' })
        .eq('id', commentId)

      if (error) throw error
      toast.success('Comment deleted')
      loadReportedComments()
    } catch (error) {
      console.error('Error deleting comment:', error)
      toast.error('Failed to delete comment')
    }
  }

  const filteredUsers = users.filter(
    (user) =>
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.display_name &&
        user.display_name.toLowerCase().includes(searchQuery.toLowerCase())),
  )

  if (authLoading)
    return (
      <div className="h-screen flex items-center justify-center text-foreground">
        Loading...
      </div>
    )

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Sidebar */}
      <div className="w-64 border-r border-border p-6 flex flex-col gap-8 fixed h-full bg-card/30 backdrop-blur-xl">
        <div className="flex items-center gap-3 px-2">
          <Shield className="w-8 h-8 text-primary" />
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-400">
            Admin
          </span>
        </div>

        <nav className="space-y-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={clsx(
              'w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm',
              activeTab === 'overview'
                ? 'bg-primary/10 text-primary'
                : 'hover:bg-accent/5 text-muted-foreground hover:text-foreground',
            )}
          >
            <LayoutDashboard className="w-5 h-5" /> Overview
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={clsx(
              'w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm',
              activeTab === 'users'
                ? 'bg-primary/10 text-primary'
                : 'hover:bg-accent/5 text-muted-foreground hover:text-foreground',
            )}
          >
            <Users className="w-5 h-5" /> User Management
          </button>
          <button
            onClick={() => setActiveTab('moderation')}
            className={clsx(
              'w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm',
              activeTab === 'moderation'
                ? 'bg-primary/10 text-primary'
                : 'hover:bg-accent/5 text-muted-foreground hover:text-foreground',
            )}
          >
            <MessageSquare className="w-5 h-5" /> Moderation
            {comments.length > 0 && (
              <span className="ml-auto bg-destructive text-destructive-foreground text-[10px] font-bold px-2 py-0.5 rounded-full">
                {comments.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('yeditors')}
            className={clsx(
              'w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm',
              activeTab === 'yeditors'
                ? 'bg-primary/10 text-primary'
                : 'hover:bg-accent/5 text-muted-foreground hover:text-foreground',
            )}
          >
            <UserIcon className="w-5 h-5" /> Yeditors
          </button>
          <button
            onClick={() => setActiveTab('highlights')}
            className={clsx(
              'w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm',
              activeTab === 'highlights'
                ? 'bg-primary/10 text-primary'
                : 'hover:bg-accent/5 text-muted-foreground hover:text-foreground',
            )}
          >
            <Star className="w-5 h-5" /> Highlights
          </button>
          <button
            onClick={() => setActiveTab('uploads')}
            className={clsx(
              'w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm',
              activeTab === 'uploads'
                ? 'bg-primary/10 text-primary'
                : 'hover:bg-accent/5 text-muted-foreground hover:text-foreground',
            )}
          >
            <Activity className="w-5 h-5" /> Uploads
          </button>
        </nav>

        <div className="mt-auto">
          <button
            onClick={() => navigate('/')}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to App
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 ml-64 p-8 bg-background">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold capitalize text-foreground">
              {activeTab}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Manage your application
            </p>
          </div>
          <div className="bg-card/50 border border-border rounded-full px-4 py-2 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-xs font-medium text-muted-foreground">
              System Normal
            </span>
          </div>
        </header>

        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatsCard
              label="Total Users"
              value={stats.totalUsers}
              icon={<Users className="text-blue-400" />}
            />
            <StatsCard
              label="New Today"
              value={stats.newUsersToday}
              icon={<Activity className="text-emerald-400" />}
            />
            <StatsCard
              label="Pending Reports"
              value={stats.activeReports}
              icon={<Ban className="text-destructive" />}
            />
          </div>
        )}

        {activeTab === 'users' && (
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-border flex gap-4 bg-muted/20">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-background border border-input rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-muted-foreground text-foreground"
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/50 text-muted-foreground font-medium">
                  <tr>
                    <th className="px-6 py-4">User</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4">Joined</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredUsers.map((user) => (
                    <tr
                      key={user.id}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-xs uppercase text-white shadow-sm">
                            {user.username[0]}
                          </div>
                          <div>
                            <div className="font-medium text-foreground">
                              {user.display_name || user.username}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              @{user.username}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          {user.is_admin && (
                            <span className="px-2 py-0.5 bg-destructive/10 text-destructive border border-destructive/20 rounded text-xs font-bold">
                              ADMIN
                            </span>
                          )}
                          {user.is_yeditor && (
                            <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded text-xs font-bold">
                              EDITOR
                            </span>
                          )}
                          {!user.is_admin && !user.is_yeditor && (
                            <span className="text-muted-foreground">User</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() =>
                              handleToggleAdmin(user.id, user.is_admin)
                            }
                            className="p-1 hover:bg-accent rounded text-muted-foreground hover:text-foreground transition-colors"
                            title="Toggle Admin"
                          >
                            <Shield
                              className={clsx(
                                'w-4 h-4',
                                user.is_admin
                                  ? 'text-destructive'
                                  : 'text-muted-foreground',
                              )}
                            />
                          </button>
                          <button
                            onClick={() =>
                              handleToggleYeditor(user.id, user.is_yeditor)
                            }
                            className="p-1 hover:bg-accent rounded text-muted-foreground hover:text-foreground transition-colors"
                            title="Toggle Editor"
                          >
                            <Award
                              className={clsx(
                                'w-4 h-4',
                                user.is_yeditor
                                  ? 'text-blue-400'
                                  : 'text-muted-foreground',
                              )}
                            />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'moderation' && (
          <div className="space-y-4">
            {comments.length === 0 ? (
              <div className="bg-card border border-dashed border-border rounded-2xl p-12 flex flex-col items-center text-center text-muted-foreground">
                <CheckCircle className="w-12 h-12 mb-4 opacity-50" />
                <p className="font-medium">All caught up!</p>
                <p className="text-sm">No reported content to review.</p>
              </div>
            ) : (
              comments.map((comment) => (
                <div
                  key={comment.id}
                  className="bg-card border border-border rounded-2xl p-6 flex gap-4 shadow-sm"
                >
                  <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center shrink-0">
                    <MessageSquare className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold text-foreground">
                        @{comment.username}{' '}
                        <span className="font-normal text-muted-foreground text-sm">
                          on {comment.content_type}
                        </span>
                      </h3>
                      <span className="text-xs text-muted-foreground">
                        {new Date(comment.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-destructive-foreground bg-destructive/10 border border-destructive/20 p-3 rounded-lg mb-4 text-sm">
                      "{comment.text}"
                    </p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleKeepComment(comment.id)}
                        className="px-4 py-2 bg-accent hover:bg-accent/80 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 text-foreground"
                      >
                        <CheckCircle className="w-4 h-4" /> Keep
                      </button>
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        className="px-4 py-2 bg-destructive/10 hover:bg-destructive/20 text-destructive rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                      >
                        <XCircle className="w-4 h-4" /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Yeditors Tab */}
        {activeTab === 'yeditors' && <YeditorManagement />}

        {/* Highlights Tab */}
        {activeTab === 'highlights' && <HighlightsManagement />}

        {/* Uploads Tab */}
        {activeTab === 'uploads' && <AdminUploads />}
      </div>
    </div>
  )
}

function StatsCard({
  label,
  value,
  icon,
}: {
  label: string
  value: string | number
  icon: React.ReactNode
}) {
  return (
    <div className="bg-card border border-border p-6 rounded-2xl flex items-center gap-4 hover:border-primary/50 transition-colors shadow-sm">
      <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center">
        {icon}
      </div>
      <div>
        <p className="text-muted-foreground text-sm font-medium">{label}</p>
        <p className="text-3xl font-bold text-foreground">{value}</p>
      </div>
    </div>
  )
}
