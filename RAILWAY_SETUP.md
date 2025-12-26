# Railway Deployment - Step by Step

## Current Issue: Build Failed

The frontend build is failing because Railway needs specific configuration. Follow these steps:

## Frontend Service Configuration

You're deploying the main frontend app. Here's the correct setup:

### 1. Settings Tab

**Source:**
- Repository: `onyxdagoat1/aonsoku-fork`
- Branch: `testing`
- Root Directory: **Leave empty** (deploy from root)

**Builder:**
- Should auto-detect Dockerfile
- Or use Nixpacks (Railway will choose)

### 2. Variables Tab

**CRITICAL:** Don't use the suggested variables! Use these instead:

```env
NODE_ENV=production
VITE_API_URL=https://your-navidrome.up.railway.app
SERVER_URL=https://your-navidrome.up.railway.app
```

**After deploying other services, add:**
```env
VITE_TAG_WRITER_SERVICE_URL=https://your-tag-writer.up.railway.app
VITE_UPLOAD_SERVICE_URL=https://your-upload.up.railway.app
VITE_ACCOUNT_API_URL=https://your-auth.up.railway.app/api
```

### 3. Deploy Tab

**Custom Start Command:**
```bash
nginx -g 'daemon off;'
```

**Watch Paths:** (Optional - only redeploy on these changes)
```
src/**
public/**
package.json
Dockerfile
nginx.conf.template
```

## Correct Deployment Order

### Step 1: Deploy Navidrome First

This is your backend. Without it, nothing else works.

1. **+ New Service** → **Empty Service**
2. **Settings** → **Source** → **Docker Image:**
   ```
   deluan/navidrome:latest
   ```
3. **Variables:**
   ```env
   ND_SCANSCHEDULE=1m
   ND_LOGLEVEL=info
   ND_PORT=4533
   ```
4. **Storage** → **+ Add Volume:**
   - Name: `navidrome-data`
   - Mount Path: `/data`
   - Size: 1GB

5. **Storage** → **+ Add Volume:**
   - Name: `music-library` ← **IMPORTANT for file uploads**
   - Mount Path: `/music`
   - Size: 10GB (or more)

6. **Settings** → **Networking** → **Generate Domain**
7. **Copy the domain URL** (e.g., `navidrome-production.up.railway.app`)
8. Visit the URL and **create your admin account**
9. ✅ **Wait until Navidrome is fully running** before continuing

### Step 2: Deploy Upload Service

This handles file uploads and needs the shared music volume.

1. **+ New Service** → **GitHub Repo**
2. Select: `onyxdagoat1/aonsoku-fork`
3. **Branch:** `testing`
4. **Settings** → **Root Directory:** `/upload-service`
5. **Variables:**
   ```env
   NAVIDROME_URL=https://your-navidrome.up.railway.app
   NAVIDROME_USERNAME=admin
   NAVIDROME_PASSWORD=your_password_here
   MUSIC_LIBRARY_PATH=/music
   PORT=3002
   NODE_ENV=production
   ```
6. **Storage** → **Mount Existing Volume:**
   - Select: `music-library`
   - Mount Path: `/music`

7. **Storage** → **+ Add Volume:**
   - Name: `temp-uploads`
   - Mount Path: `/tmp/uploads`
   - Size: 5GB

8. **Generate Domain** → Save URL

### Step 3: Deploy Tag Writer Service

1. **+ New Service** → **GitHub Repo**
2. Select: `onyxdagoat1/aonsoku-fork`
3. **Branch:** `testing`
4. **Settings** → **Root Directory:** `/tag-writer-service`
5. **Variables:**
   ```env
   NAVIDROME_URL=https://your-navidrome.up.railway.app
   NAVIDROME_USERNAME=admin
   NAVIDROME_PASSWORD=your_password_here
   MUSIC_LIBRARY_PATH=/music
   PORT=3001
   NODE_ENV=production
   ```
6. **Storage** → **Mount Existing Volume:**
   - Select: `music-library` (same as upload service)
   - Mount Path: `/music`

7. **Generate Domain** → Save URL

### Step 4: Deploy Auth Service

1. **+ New Service** → **GitHub Repo**
2. Select: `onyxdagoat1/aonsoku-fork`
3. **Branch:** `testing`
4. **Settings** → **Root Directory:** `/auth-service`
5. **Variables:**
   ```env
   NAVIDROME_URL=https://your-navidrome.up.railway.app
   NAVIDROME_USERNAME=admin
   NAVIDROME_PASSWORD=your_password_here
   PORT=3005
   NODE_ENV=production
   FRONTEND_URL=https://your-frontend.up.railway.app
   ```
   (You'll update FRONTEND_URL after deploying frontend)

6. **Generate Domain** → Save URL

### Step 5: Deploy Frontend (Current Service)

Now fix your current failed deployment:

1. **Go to Variables tab**
2. **Delete** all the suggested variables
3. **Add these instead:**
   ```env
   NODE_ENV=production
   VITE_API_URL=https://your-navidrome.up.railway.app
   SERVER_URL=https://your-navidrome.up.railway.app
   VITE_TAG_WRITER_SERVICE_URL=https://your-tag-writer.up.railway.app
   VITE_UPLOAD_SERVICE_URL=https://your-upload.up.railway.app
   VITE_ACCOUNT_API_URL=https://your-auth.up.railway.app/api
   ```

4. **Settings** → **Root Directory:** Leave **empty**
5. **Deploy** → **Custom Start Command:** `nginx -g 'daemon off;'`
6. Click **"Redeploy"** or push a new commit

### Step 6: Update CORS Settings

Once frontend has a domain, update these services:

**Auth Service** - Add variable:
```env
FRONTEND_URL=https://your-actual-frontend.up.railway.app
```

**Tag Writer** - Add variable:
```env
CORS_ORIGINS=https://your-actual-frontend.up.railway.app
```

**Upload Service** - Add variable:
```env
CORS_ORIGINS=https://your-actual-frontend.up.railway.app
```

Click **"Restart"** on each after updating.

## Troubleshooting Build Failures

### If build still fails:

1. **Check Settings** → **Root Directory** is empty (not `/`)
2. **Remove** old suggested variables
3. **Verify** you're on `testing` branch
4. **Try switching** Builder from Dockerfile to Nixpacks (or vice versa)

### Check Logs:

**Deployments Tab** → Click failed deployment → **View Logs**

Common errors:
- `Cannot find module`: Missing dependencies → Check `package.json`
- `nginx: command not found`: Wrong builder → Use Dockerfile
- `VITE_*` not defined: Environment vars not loaded during build

### Force Redeploy:

**Settings** → **Service Settings** → **Remove and Redeploy**

## Testing Everything Works

1. **Navidrome**: Visit domain → See Navidrome login
2. **Frontend**: Visit domain → See aonsoku login
3. **Login**: Use your Navidrome admin credentials
4. **Upload Test**: Try uploading a small MP3 file
5. **Tag Test**: Edit metadata on a song
6. **Register Test**: Create a new user account

## Quick Reference: All Services

| Service | Root Directory | Port | Needs Volume |
|---------|---------------|------|-------------|
| Navidrome | - (Docker) | 4533 | Yes (music + data) |
| Frontend | `/` (empty) | 8080 | No |
| Auth | `/auth-service` | 3005 | No |
| Tag Writer | `/tag-writer-service` | 3001 | Yes (music) |
| Upload | `/upload-service` | 3002 | Yes (music + temp) |

## Need Help?

If build still fails:
1. Copy the full error from deployment logs
2. Check which service is failing (frontend, auth, etc.)
3. Verify environment variables match this guide
