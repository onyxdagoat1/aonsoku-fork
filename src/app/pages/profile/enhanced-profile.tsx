import {
  Award,
  Calendar,
  Camera,
  CheckCircle,
  Edit3,
  Github,
  Globe,
  Instagram,
  Link2,
  Linkedin,
  Save,
  Settings,
  Shield,
  TrendingUp,
  Twitter,
  User,
  Users,
  Youtube,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import { LastFmIntegration } from '@/app/components/profile/LastFmIntegration'
import { CommunityActivityFeed } from '@/app/components/social/CommunityActivityFeed'
import { Badge } from '@/app/components/ui/badge'
import { Button } from '@/app/components/ui/button'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/app/components/ui/tabs'
import { useAuth } from '@/contexts/AuthContext'
import type { Database } from '@/lib/database.types'
import { supabase } from '@/lib/supabase'
import { followService } from '@/service/followService'

type Profile = Database['public']['Tables']['profiles']['Row']

interface SocialLinks {
  twitter: string
  instagram: string
  github: string
  linkedin: string
  youtube: string
  spotify: string
}

export function EnhancedProfile() {
  const { profile: myProfile, user, isAuthenticated, updateProfile } = useAuth()
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [targetId, setTargetId] = useState<string | null>(null)
  const [followerCount, setFollowerCount] = useState(0)
  const [followingCount, setFollowingCount] = useState(0)

  // Form states
  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [website, setWebsite] = useState('')
  const [socialLinks, setSocialLinks] = useState<SocialLinks>({
    twitter: '',
    instagram: '',
    github: '',
    linkedin: '',
    youtube: '',
    spotify: '',
  })

  const isOwnProfile = !id || id === user?.id

  useEffect(() => {
    if (!isAuthenticated && !id) {
      navigate('/login')
    }
  }, [isAuthenticated, id, navigate])

  useEffect(() => {
    const effectiveId = id || user?.id
    setTargetId(effectiveId || null)
  }, [id])

  useEffect(() => {
    if (targetId) {
      loadProfile(targetId)
      void loadCounts(targetId)
      void loadSocialLinks(targetId)
    }
  }, [targetId])

  const loadCounts = async (profileId: string) => {
    try {
      const [followers, following] = await Promise.all([
        followService.getFollowerCount('user', profileId),
        supabase
          .from('user_follows')
          .select('id', { count: 'exact', head: true })
          .eq('follower_id', profileId),
      ])

      setFollowerCount(followers)
      setFollowingCount(following.count || 0)
    } catch (error) {
      console.error('Error loading follow counts:', error)
    }
  }

  const loadSocialLinks = async (profileId: string) => {
    try {
      const { data, error } = await supabase
        .from('profile_social_links')
        .select('platform,url')
        .eq('profile_id', profileId)

      if (error) throw error

      const next: SocialLinks = {
        twitter: '',
        instagram: '',
        github: '',
        linkedin: '',
        youtube: '',
        spotify: '',
      }

      for (const row of data || []) {
        const platform = row.platform as keyof SocialLinks
        if (platform in next) {
          next[platform] = row.url || ''
        }
      }

      setSocialLinks(next)
    } catch (error: any) {
      // If the table doesn't exist yet (migration not run), don't crash the page
      console.error('Error loading social links:', error)
    }
  }

  const loadProfile = async (profileId: string) => {
    try {
      if (isOwnProfile && myProfile) {
        setProfile(myProfile)
        setDisplayName(myProfile.display_name || myProfile.username || '')
        setBio(myProfile.bio || '')
        setWebsite(myProfile.website || '')
        return
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profileId)
        .single()

      if (error) throw error

      setProfile(data)
      setDisplayName(data.display_name || data.username || '')
      setBio(data.bio || '')
      setWebsite(data.website || '')
    } catch (error) {
      console.error('Error loading profile:', error)
      toast.error('Failed to load profile')
    }
  }

  const handleSaveProfile = async () => {
    if (!profile) return

    setIsLoading(true)
    try {
      const updates: Partial<Profile> = {
        display_name: displayName,
        bio: bio,
        website: website,
        updated_at: new Date().toISOString(),
      }

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', profile.id)

      if (error) throw error

      // Persist social links (best-effort, requires migration)
      try {
        const rows = (
          Object.entries(socialLinks) as Array<[keyof SocialLinks, string]>
        ).map(([platform, url]) => ({
          profile_id: profile.id,
          platform,
          url: (url || '').trim(),
        }))

        // Remove empty URLs so we don't store garbage
        const nonEmpty = rows.filter((r) => r.url.length > 0)

        // Clear existing then insert new (simple + deterministic)
        await supabase
          .from('profile_social_links')
          .delete()
          .eq('profile_id', profile.id)
        if (nonEmpty.length > 0) {
          const { error: insertError } = await supabase
            .from('profile_social_links')
            .insert(nonEmpty)
          if (insertError) throw insertError
        }
      } catch (error: any) {
        console.error('Error saving social links:', error)
        toast.error('Social links could not be saved (missing DB migration?)')
      }

      toast.success('Profile updated successfully!')
      setIsEditing(false)
      if (targetId) {
        loadProfile(targetId)
        void loadSocialLinks(targetId)
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Failed to update profile')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAvatarUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0]
    if (!file || !profile || !isOwnProfile) return

    setIsUploading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${profile.id}-${Math.random()}.${fileExt}`
      const filePath = `${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const {
        data: { publicUrl },
      } = supabase.storage.from('avatars').getPublicUrl(filePath)

      const { error: updateError } = await updateProfile({
        avatar_url: publicUrl,
      })
      if (updateError) throw updateError

      toast.success('Avatar updated!')
      if (targetId) {
        loadProfile(targetId)
      }
    } catch (error) {
      console.error('Error uploading avatar:', error)
      toast.error('Failed to upload avatar')
    } finally {
      setIsUploading(false)
    }
  }

  const SocialLinkInput = ({
    platform,
    icon,
    placeholder,
    value,
    onChange,
  }: {
    platform: keyof SocialLinks
    icon: React.ReactNode
    placeholder: string
    value: string
    onChange: (value: string) => void
  }) => (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg bg-black/20 border border-border flex items-center justify-center">
        {icon}
      </div>
      <input
        type="text"
        id={`social-${platform}`}
        name={platform}
        autoComplete={platform}
        aria-label={platform}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 bg-black/20 border border-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-primary transition-colors"
      />
    </div>
  )

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-900/20 via-blue-900/20 to-emerald-900/20 backdrop-blur-xl border-b border-border">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                ← Back
              </button>
              <div>
                <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                  {profile.display_name || profile.username || 'Profile'}
                  {profile.is_yeditor && (
                    <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                    </Badge>
                  )}
                </h1>
                <p className="text-muted-foreground">
                  @{profile.username || ''}
                </p>
              </div>
            </div>
            {isOwnProfile && (
              <div className="flex items-center gap-3">
                <Button
                  onClick={() => setIsEditing(!isEditing)}
                  variant={isEditing ? 'default' : 'outline'}
                  className="gap-2"
                >
                  {isEditing ? (
                    <>
                      <Save className="w-4 h-4" />
                      Save Changes
                    </>
                  ) : (
                    <>
                      <Edit3 className="w-4 h-4" />
                      Edit Profile
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Profile Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Avatar Section */}
            <div className="bg-card/50 backdrop-blur-xl border border-border rounded-2xl p-6">
              <div className="flex flex-col items-center">
                <div className="relative group">
                  <div
                    onClick={() =>
                      isOwnProfile && fileInputRef.current?.click()
                    }
                    className={`w-32 h-32 rounded-full overflow-hidden border-4 border-primary/20 ${
                      isOwnProfile && isEditing ? 'cursor-pointer' : ''
                    }`}
                  >
                    {profile.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt={profile.display_name || profile.username || ''}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                        <User className="w-12 h-12 text-white" />
                      </div>
                    )}
                  </div>
                  {isOwnProfile && isEditing && (
                    <div className="absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer">
                      {isUploading ? (
                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
                      ) : (
                        <Camera className="w-6 h-6 text-white" />
                      )}
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleAvatarUpload}
                  accept="image/*"
                  className="hidden"
                />
              </div>
            </div>

            {/* Stats */}
            <div className="bg-card/50 backdrop-blur-xl border border-border rounded-2xl p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Stats
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">
                    {followerCount}
                  </p>
                  <p className="text-xs text-muted-foreground">Followers</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">
                    {followingCount}
                  </p>
                  <p className="text-xs text-muted-foreground">Following</p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            {isOwnProfile && (
              <div className="bg-card/50 backdrop-blur-xl border border-border rounded-2xl p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Settings className="w-5 h-5 text-primary" />
                  Quick Actions
                </h3>
                <div className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2"
                  >
                    <Shield className="w-4 h-4" />
                    Admin Panel
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2"
                  >
                    <Award className="w-4 h-4" />
                    Editor Tools
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Tabs defaultValue="about" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="about">About</TabsTrigger>
                <TabsTrigger value="social">Social</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
                <TabsTrigger value="integrations">Integrations</TabsTrigger>
              </TabsList>

              <TabsContent value="about" className="space-y-6">
                {/* Bio Section */}
                <div className="bg-card/50 backdrop-blur-xl border border-border rounded-2xl p-6">
                  <h3 className="text-lg font-semibold mb-4">About</h3>
                  {isEditing ? (
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Tell us about yourself..."
                      className="w-full h-32 bg-black/20 border border-border rounded-lg p-4 text-sm focus:outline-none focus:border-primary resize-none"
                    />
                  ) : (
                    <p className="text-muted-foreground leading-relaxed">
                      {bio || 'No bio yet.'}
                    </p>
                  )}
                </div>

                {/* Website */}
                <div className="bg-card/50 backdrop-blur-xl border border-border rounded-2xl p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Globe className="w-5 h-5 text-primary" />
                    Website
                  </h3>
                  {isEditing ? (
                    <input
                      type="url"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      placeholder="https://your-website.com"
                      className="w-full bg-black/20 border border-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-primary"
                    />
                  ) : (
                    <div>
                      {website ? (
                        <a
                          href={website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline flex items-center gap-2"
                        >
                          <Link2 className="w-4 h-4" />
                          {website}
                        </a>
                      ) : (
                        <p className="text-muted-foreground">
                          No website added
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Member Since */}
                <div className="bg-card/50 backdrop-blur-xl border border-border rounded-2xl p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary" />
                    Member Since
                  </h3>
                  <p className="text-muted-foreground">
                    {new Date(profile.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="social" className="space-y-6">
                <div className="bg-card/50 backdrop-blur-xl border border-border rounded-2xl p-6">
                  <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    Social Links
                  </h3>
                  <div className="space-y-4">
                    <SocialLinkInput
                      platform="twitter"
                      icon={<Twitter className="w-4 h-4" />}
                      placeholder="Twitter username"
                      value={socialLinks.twitter}
                      onChange={(value) =>
                        setSocialLinks((prev) => ({ ...prev, twitter: value }))
                      }
                    />
                    <SocialLinkInput
                      platform="instagram"
                      icon={<Instagram className="w-4 h-4" />}
                      placeholder="Instagram username"
                      value={socialLinks.instagram}
                      onChange={(value) =>
                        setSocialLinks((prev) => ({
                          ...prev,
                          instagram: value,
                        }))
                      }
                    />
                    <SocialLinkInput
                      platform="github"
                      icon={<Github className="w-4 h-4" />}
                      placeholder="GitHub username"
                      value={socialLinks.github}
                      onChange={(value) =>
                        setSocialLinks((prev) => ({ ...prev, github: value }))
                      }
                    />
                    <SocialLinkInput
                      platform="linkedin"
                      icon={<Linkedin className="w-4 h-4" />}
                      placeholder="LinkedIn profile"
                      value={socialLinks.linkedin}
                      onChange={(value) =>
                        setSocialLinks((prev) => ({ ...prev, linkedin: value }))
                      }
                    />
                    <SocialLinkInput
                      platform="youtube"
                      icon={<Youtube className="w-4 h-4" />}
                      placeholder="YouTube channel"
                      value={socialLinks.youtube}
                      onChange={(value) =>
                        setSocialLinks((prev) => ({ ...prev, youtube: value }))
                      }
                    />
                    <SocialLinkInput
                      platform="spotify"
                      icon={<Youtube className="w-4 h-4" />}
                      placeholder="Spotify profile"
                      value={socialLinks.spotify}
                      onChange={(value) =>
                        setSocialLinks((prev) => ({ ...prev, spotify: value }))
                      }
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="activity" className="space-y-6">
                <CommunityActivityFeed />
              </TabsContent>

              <TabsContent value="integrations" className="space-y-6">
                {isOwnProfile && <LastFmIntegration />}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Save Button for Editing */}
      {isEditing && isOwnProfile && (
        <div className="fixed bottom-8 right-8">
          <Button
            onClick={handleSaveProfile}
            disabled={isLoading}
            size="lg"
            className="gap-2 shadow-lg"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save Profile
          </Button>
        </div>
      )}
    </div>
  )
}
