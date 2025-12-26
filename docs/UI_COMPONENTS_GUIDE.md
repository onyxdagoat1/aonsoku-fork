# UI Components Guide - Supabase Social Features

## 🎉 What's Now Available

Your app now has a complete authentication UI! Here's what you can do:

### ✅ Live Features

1. **Login/Register Pages** at `/auth/login` and `/auth/register`
2. **User Menu** in the top navigation bar (when logged in)
3. **OAuth Support** for Google, Discord, and GitHub
4. **Automatic Session Management** - users stay logged in
5. **Profile System** - usernames, avatars, bios

## 🚀 Quick Test

### Step 1: Start Your App

```bash
npm install  # Make sure dependencies are installed
npm run dev  # Start the dev server
```

### Step 2: Navigate to Login

Open your browser and go to:
```
http://localhost:3000/#/auth/login
```

Or click the **"Sign In"** button in the top-right corner of your app!

### Step 3: Create an Account

1. Click **"Sign up"** link at the bottom
2. Fill in:
   - Username (3-30 characters)
   - Email
   - Password (8+ characters)
3. Click **"Create Account"**
4. Check your email for verification link (if enabled)

### Step 4: Sign In

1. Use your email and password
2. Or click one of the OAuth buttons (Google/Discord/GitHub)
3. You'll be redirected to the app
4. See your username in the top-right corner!

## 📍 Navigation Routes

| Route | Description |
|-------|-------------|
| `/#/auth/login` | Login page |
| `/#/auth/register` | Registration page |
| `/#/auth/callback` | OAuth callback handler |
| `/#/` | Main app (requires login) |

## 🎨 UI Components Breakdown

### 1. Login Page (`/auth/login`)

**Features:**
- Email/password login form
- OAuth buttons (Google, Discord, GitHub)
- "Forgot password" link
- Link to register page
- Back to app button

**File:** `src/app/pages/auth/Login.tsx`

### 2. Register Page (`/auth/register`)

**Features:**
- Username field with validation
- Email field
- Password field (min 8 chars)
- Confirm password field
- OAuth signup buttons
- Real-time validation errors
- Link to login page

**File:** `src/app/pages/auth/Register.tsx`

### 3. OAuth Buttons Component

**Providers:**
- Google (with official logo)
- Discord (with brand colors)
- GitHub (with icon)

**Features:**
- Loading states
- Error handling
- Automatic redirect after auth

**File:** `src/app/pages/auth/components/OAuthButtons.tsx`

### 4. User Menu (Top Navigation)

**When Logged Out:**
- Shows "Sign In" button
- Shows "Sign Up" button

**When Logged In:**
- User avatar (or initials)
- Dropdown menu with:
  - Username and email
  - Profile link
  - My Playlists link
  - Settings link
  - Logout button

**File:** `src/app/components/user/UserMenu.tsx`

### 5. Auth Callback Handler

**Purpose:**
- Handles OAuth redirects
- Extracts session from URL
- Redirects to app on success
- Shows loading spinner

**File:** `src/app/pages/auth/AuthCallback.tsx`

## 🛠️ Customization Guide

### Change Colors/Styling

All components use your existing theme system with CSS variables:

```css
/* These are already in your app */
--background
--foreground
--primary
--secondary
--muted
--border
--destructive
```

To customize, edit `src/themes.css` or `src/index.css`.

### Add More OAuth Providers

1. **Enable in Supabase:**
   - Go to Supabase Dashboard
   - Authentication > Providers
   - Enable provider (e.g., Twitter, Facebook)
   - Add credentials

2. **Add Button to UI:**
   ```tsx
   // In src/app/pages/auth/components/OAuthButtons.tsx
   <Button
     onClick={() => handleOAuth('twitter')}
     variant="outline"
     className="w-full"
   >
     <TwitterIcon className="mr-2 h-4 w-4" />
     Continue with Twitter
   </Button>
   ```

3. **Update Type:**
   ```tsx
   // In src/contexts/AuthContext.tsx
   signInWithProvider: (provider: 'google' | 'discord' | 'github' | 'twitter') => Promise<void>
   ```

### Customize Validation Rules

```tsx
// In src/app/pages/auth/Register.tsx
const validate = () => {
  const newErrors: Record<string, string> = {}

  // Change username length
  if (formData.username.length < 5 || formData.username.length > 20) {
    newErrors.username = 'Username must be 5-20 characters'
  }

  // Require stronger passwords
  if (formData.password.length < 12) {
    newErrors.password = 'Password must be at least 12 characters'
  }

  // Add password complexity check
  if (!/[A-Z]/.test(formData.password)) {
    newErrors.password = 'Password must contain uppercase letter'
  }

  return Object.keys(newErrors).length === 0
}
```

### Add Custom Fields to Registration

```tsx
// In src/app/pages/auth/Register.tsx
const [formData, setFormData] = useState({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  displayName: '',  // Add this
  bio: '',          // And this
})

// Then pass to signUp
await signUp(formData.email, formData.password, formData.username)

// Update profile after signup
await updateProfile({
  display_name: formData.displayName,
  bio: formData.bio
})
```

## 🔐 Security Features

### Built-in Protection

1. **Row Level Security (RLS)** - Users can only edit their own data
2. **Email Verification** - Optional, configure in Supabase
3. **Password Hashing** - Handled by Supabase automatically
4. **Session Tokens** - Secure JWT tokens
5. **HTTPS Only** - OAuth requires HTTPS in production

### Best Practices

```tsx
// Always check authentication before sensitive actions
const { user } = useAuth()

if (!user) {
  return <div>Please log in to continue</div>
}

// Never expose service_role key in frontend
// Only use VITE_SUPABASE_ANON_KEY
```

## 🎯 Next: Build Social Features

Now that authentication is working, you can build:

### 1. Comments on Songs

```tsx
import { useComments } from '@/hooks/useComments'
import { useAuth } from '@/contexts/AuthContext'

function SongComments({ songId }: { songId: string }) {
  const { user } = useAuth()
  const { comments, createComment, isLoading } = useComments(songId)
  const [comment, setComment] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!comment.trim()) return

    createComment({
      song_id: songId,
      content: comment
    })
    setComment('')
  }

  if (isLoading) return <div>Loading...</div>

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold">Comments</h3>
      
      {/* Comment List */}
      <div className="space-y-3">
        {comments.map(c => (
          <div key={c.id} className="border rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <strong>{c.profiles.username}</strong>
              <span className="text-xs text-muted-foreground">
                {new Date(c.created_at).toLocaleDateString()}
              </span>
            </div>
            <p>{c.content}</p>
          </div>
        ))}
      </div>

      {/* Comment Form */}
      {user && (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Add a comment..."
          />
          <Button type="submit">Post</Button>
        </form>
      )}
    </div>
  )
}
```

### 2. Playlist Sharing

```tsx
import { usePlaylists } from '@/hooks/usePlaylists'
import { useAuth } from '@/contexts/AuthContext'

function MyPlaylists() {
  const { user } = useAuth()
  const { playlists, createPlaylist } = usePlaylists(user?.id)
  const [name, setName] = useState('')

  const handleCreate = async () => {
    await createPlaylist({
      name,
      description: '',
      is_public: true
    })
    setName('')
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">My Playlists</h2>
      
      <div className="flex gap-2">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New playlist name"
        />
        <Button onClick={handleCreate}>Create</Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {playlists.map(p => (
          <div key={p.id} className="border rounded-lg p-4">
            <h3 className="font-bold">{p.name}</h3>
            <p className="text-sm text-muted-foreground">
              {p.song_count} songs
            </p>
            <p className="text-xs">
              {p.is_public ? 'Public' : 'Private'}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
```

### 3. Favorites Button

```tsx
import { useFavorites } from '@/hooks/useFavorites'
import { useAuth } from '@/contexts/AuthContext'
import { Heart } from 'lucide-react'

function FavoriteButton({ songId }: { songId: string }) {
  const { user } = useAuth()
  const { isFavorite, toggleFavorite } = useFavorites(user?.id)

  if (!user) return null

  const favorited = isFavorite(songId)

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => toggleFavorite(songId)}
    >
      <Heart
        className={`h-4 w-4 ${
          favorited ? 'fill-red-500 text-red-500' : ''
        }`}
      />
    </Button>
  )
}
```

## 🐛 Troubleshooting

### "Sign In" button doesn't appear

**Check:**
1. Is `VITE_SUPABASE_URL` set in `.env`?
2. Is `VITE_SUPABASE_ANON_KEY` set in `.env`?
3. Did you restart the dev server after adding env vars?

```bash
# Stop dev server (Ctrl+C)
# Then restart
npm run dev
```

### OAuth buttons don't work

**Check:**
1. In Supabase Dashboard > Authentication > Providers
2. Is the provider enabled?
3. Are credentials added?
4. Is redirect URL correct?
   - Development: `http://localhost:3000/#/auth/callback`
   - Production: `https://yourdomain.com/#/auth/callback`

### "Profile not found" error

**Solution:**
1. Make sure you ran `supabase/schema.sql` in Supabase SQL Editor
2. Check that the `on_auth_user_created` trigger exists:
   ```sql
   SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
   ```
3. If missing, run the schema.sql again

### Styles look broken

**Check:**
1. Are all UI components installed?
   ```bash
   npm install lucide-react
   ```
2. Do you have the required shadcn/ui components?
   - Button
   - Input
   - Label
   - Separator
   - DropdownMenu
   - Avatar

## 📚 Related Documentation

- **Setup Guide:** `docs/SUPABASE_SETUP.md`
- **Implementation Guide:** `docs/SUPABASE_IMPLEMENTATION.md`
- **Quick Start:** `SUPABASE_QUICK_START.md`
- **Database Schema:** `supabase/schema.sql`

## 🎉 Success!

You now have:
- ✅ Beautiful login/register pages
- ✅ OAuth integration
- ✅ User menu in navigation
- ✅ Session management
- ✅ Profile system

**Ready to build amazing social features!** 🚀

---

**Need help?** Check the browser console for errors or review the setup guide.
