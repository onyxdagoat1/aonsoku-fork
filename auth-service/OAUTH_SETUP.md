# OAuth Setup Guide (Optional)

You **don't need OAuth** to use the auth service. Users can register with email/password.

OAuth enables:
- 🎵 **Google login** (needed for YouTube integration later)
- 💬 **Discord login** (convenient for users)

## Google OAuth Setup

### Why Google?
- Enables YouTube integration for your music app
- Users can log in with Google accounts
- Access to Google profile data

### Step-by-Step Setup (10 minutes)

#### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Sign in with your Google account
3. Click "**Select a project**" at the top
4. Click "**NEW PROJECT**"
5. Name it: `Aonsoku`
6. Click "**CREATE**"

#### 2. Configure OAuth Consent Screen

1. In the left sidebar, go to "**APIs & Services**" → "**OAuth consent screen**"
2. Select "**External**" (unless you have a Google Workspace)
3. Click "**CREATE**"

**App information:**
- App name: `Aonsoku`
- User support email: `your-email@gmail.com`
- App logo: (optional)

**App domain:** (optional for testing)
- Skip for now

**Developer contact information:**
- Email: `your-email@gmail.com`

Click "**SAVE AND CONTINUE**"

#### 3. Add Scopes

1. Click "**ADD OR REMOVE SCOPES**"
2. Select these scopes:
   - `.../auth/userinfo.email`
   - `.../auth/userinfo.profile`
3. Click "**UPDATE**"
4. Click "**SAVE AND CONTINUE**"

#### 4. Add Test Users (Development Only)

1. Click "**ADD USERS**"
2. Add your email: `your-email@gmail.com`
3. Click "**ADD**"
4. Click "**SAVE AND CONTINUE**"

**Note:** Remove this step when publishing to production!

#### 5. Create OAuth Credentials

1. Go to "**APIs & Services**" → "**Credentials**"
2. Click "**CREATE CREDENTIALS**" → "**OAuth client ID**"
3. Application type: "**Web application**"
4. Name: `Aonsoku Auth Service`

**Authorized redirect URIs:**

Click "**ADD URI**" and add:

```
http://localhost:3005/api/auth/google/callback
```

*For production, also add:*
```
https://your-domain.com/api/auth/google/callback
```

5. Click "**CREATE**"

#### 6. Copy Credentials

You'll see a popup with:
- **Client ID**: `123456789-abc123.apps.googleusercontent.com`
- **Client secret**: `GOCSPX-abc123xyz...`

**Copy these to your `.env` file:**

```env
GOOGLE_CLIENT_ID=123456789-abc123.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abc123xyz...
GOOGLE_CALLBACK_URL=http://localhost:3005/api/auth/google/callback
```

#### 7. Test Google Login

Restart your auth service:
```bash
npm run dev
```

Test the OAuth flow:
```bash
open http://localhost:3005/api/auth/google
```

You should be redirected to Google sign-in!

---

## Discord OAuth Setup

### Why Discord?
- Popular with music/gaming communities
- Easy one-click login
- Access to Discord profile data

### Step-by-Step Setup (5 minutes)

#### 1. Create Discord Application

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Sign in with your Discord account
3. Click "**New Application**"
4. Name it: `Aonsoku`
5. Accept Terms of Service
6. Click "**Create**"

#### 2. Configure OAuth2

1. In the left sidebar, click "**OAuth2**"
2. Find "**Redirects**" section
3. Click "**Add Redirect**"

**Add this URL:**
```
http://localhost:3005/api/auth/discord/callback
```

*For production, also add:*
```
https://your-domain.com/api/auth/discord/callback
```

4. Click "**Save Changes**"

#### 3. Copy Credentials

1. Scroll up to "**CLIENT INFORMATION**"
2. Copy:
   - **CLIENT ID**: `1234567890123456789`
   - **CLIENT SECRET**: Click "Reset Secret" to reveal, then copy

**Add to your `.env` file:**

```env
DISCORD_CLIENT_ID=1234567890123456789
DISCORD_CLIENT_SECRET=abc123xyz...
DISCORD_CALLBACK_URL=http://localhost:3005/api/auth/discord/callback
```

#### 4. Test Discord Login

Restart your auth service:
```bash
npm run dev
```

Test the OAuth flow:
```bash
open http://localhost:3005/api/auth/discord
```

You should be redirected to Discord authorization!

---

## Production Setup

When deploying to production:

### Google

1. **Publish OAuth consent screen:**
   - Go to OAuth consent screen
   - Click "**PUBLISH APP**"
   - Submit for verification (if needed)

2. **Update redirect URIs:**
   ```
   https://yourdomain.com/api/auth/google/callback
   ```

3. **Update .env:**
   ```env
   GOOGLE_CALLBACK_URL=https://yourdomain.com/api/auth/google/callback
   ```

### Discord

1. **Update redirect URIs** in Discord app:
   ```
   https://yourdomain.com/api/auth/discord/callback
   ```

2. **Update .env:**
   ```env
   DISCORD_CALLBACK_URL=https://yourdomain.com/api/auth/discord/callback
   ```

---

## Troubleshooting

### Google: "Error 400: redirect_uri_mismatch"

**Cause:** Redirect URI doesn't match exactly

**Fix:**
1. Check GOOGLE_CALLBACK_URL in `.env`
2. Check authorized redirect URIs in Google Console
3. Make sure they match **exactly** (including port)
4. No trailing slashes!

### Google: "Access blocked: This app's request is invalid"

**Cause:** OAuth consent screen not configured

**Fix:**
1. Complete OAuth consent screen setup
2. Add your email as a test user
3. Make sure scopes are added

### Discord: "Invalid OAuth2 redirect_uri"

**Cause:** Redirect URI not added to Discord app

**Fix:**
1. Go to Discord app → OAuth2 → Redirects
2. Add exact callback URL
3. Click "Save Changes"

### OAuth works but user not created

**Check logs:**
```bash
npm run dev
# Watch for errors in terminal
```

**Common issues:**
- Database connection failed
- Missing email from OAuth provider
- Username already taken (rare)

---

## Testing OAuth Locally

### Google
```bash
curl http://localhost:3005/api/auth/google
```

### Discord
```bash
curl http://localhost:3005/api/auth/discord
```

Both should redirect you to login page!

---

## FAQ

**Q: Do I need both Google AND Discord?**

No! You can set up just one, or neither. Email/password login always works.

**Q: Can users link multiple OAuth providers?**

Yes! If a user signs up with email, they can later link Google/Discord.

**Q: What data do you get from OAuth?**

- **Google:** Email, name, profile picture
- **Discord:** Username, email, profile picture, Discord ID

**Q: Is OAuth data stored?**

Yes, in the `users` table:
- `google_id` - Google user ID
- `discord_id` - Discord user ID  
- `avatar_url` - Profile picture
- `email` - Email address

**Q: Can I use OAuth in production without verification?**

- **Google:** Limited to 100 users until verified
- **Discord:** No verification needed

---

Need help? Check the [QUICK_START.md](./QUICK_START.md) or main [README.md](./README.md)!
