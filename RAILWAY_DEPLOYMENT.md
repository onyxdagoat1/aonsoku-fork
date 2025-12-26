# Railway Deployment Guide

This guide will help you deploy the entire aonsoku stack on Railway with file upload support and temporary domains.

## Architecture Overview

You'll deploy 5 services:
1. **Navidrome** (Music server backend)
2. **Auth Service** (User registration)
3. **Tag Writer Service** (Metadata editing)
4. **Upload Service** (Music file uploads)
5. **Frontend** (Main web app)

## Prerequisites

- Railway account (free tier works): https://railway.app
- GitHub account connected to Railway

## Step-by-Step Deployment

### 1. Create New Project on Railway

1. Go to https://railway.app/new
2. Click "New Project"
3. Select "Empty Project"
4. Name it: `aonsoku-testing`

### 2. Deploy Navidrome (Backend)

1. Click "+ New" in your project
2. Select "Database" → "Deploy from Template"
3. Search for "Navidrome" or use Docker image
4. If no template, use "Empty Service" and configure:
   - **Docker Image**: `deluan/navidrome:latest`
   - **Add Volume**: 
     - Mount Path: `/music`
     - Size: 5GB (or more based on your music library)
   - **Add Volume**: 
     - Mount Path: `/data`
     - Size: 1GB
   - **Environment Variables**:
     ```
     ND_SCANSCHEDULE=1m
     ND_LOGLEVEL=info
     ND_SESSIONTIMEOUT=24h
     ```
   - **Port**: 4533
5. Click "Deploy"
6. Once deployed, click "Settings" → "Generate Domain"
7. **Save this domain** (e.g., `navidrome-production.up.railway.app`)

### 3. Deploy Auth Service

1. Click "+ New" → "GitHub Repo"
2. Select your fork: `onyxdagoat1/aonsoku-fork`
3. Branch: `testing`
4. **Root Directory**: `/auth-service`
5. **Environment Variables**:
   ```
   NAVIDROME_URL=https://your-navidrome-domain.up.railway.app
   NAVIDROME_USERNAME=admin
   NAVIDROME_PASSWORD=your_admin_password
   PORT=3005
   FRONTEND_URL=https://your-frontend-domain.up.railway.app
   NODE_ENV=production
   ```
6. Click "Deploy"
7. Generate Domain → **Save this URL**

### 4. Deploy Upload Service

1. Click "+ New" → "GitHub Repo"
2. Select: `onyxdagoat1/aonsoku-fork`
3. Branch: `testing`
4. **Root Directory**: `/upload-service`
5. **Add Volume** (IMPORTANT for file uploads):
   - Mount Path: `/music`
   - Size: 10GB (adjust based on needs)
6. **Add Volume** (temporary uploads):
   - Mount Path: `/tmp/uploads`
   - Size: 5GB
7. **Environment Variables**:
   ```
   NAVIDROME_URL=https://your-navidrome-domain.up.railway.app
   NAVIDROME_USERNAME=admin
   NAVIDROME_PASSWORD=your_admin_password
   MUSIC_LIBRARY_PATH=/music
   PORT=3002
   NODE_ENV=production
   ```
8. Click "Deploy"
9. Generate Domain → **Save this URL**

### 5. Deploy Tag Writer Service

1. Click "+ New" → "GitHub Repo"
2. Select: `onyxdagoat1/aonsoku-fork`
3. Branch: `testing`
4. **Root Directory**: `/tag-writer-service`
5. **Add Volume** (shared with upload service):
   - Mount Path: `/music`
   - Size: Same as upload service (can share volume)
6. **Environment Variables**:
   ```
   NAVIDROME_URL=https://your-navidrome-domain.up.railway.app
   NAVIDROME_USERNAME=admin
   NAVIDROME_PASSWORD=your_admin_password
   MUSIC_LIBRARY_PATH=/music
   CORS_ORIGINS=https://your-frontend-domain.up.railway.app
   PORT=3001
   NODE_ENV=production
   ```
7. Click "Deploy"
8. Generate Domain → **Save this URL**

### 6. Deploy Frontend (Main App)

1. Click "+ New" → "GitHub Repo"
2. Select: `onyxdagoat1/aonsoku-fork`
3. Branch: `testing`
4. **Root Directory**: `/` (root)
5. **Build Settings**:
   - Build Command: `npm install && npm run build`
   - Start Command: `nginx -g 'daemon off;'`
6. **Environment Variables**:
   ```
   SERVER_URL=https://your-navidrome-domain.up.railway.app
   VITE_API_URL=https://your-navidrome-domain.up.railway.app
   VITE_TAG_WRITER_SERVICE_URL=https://your-tag-writer-domain.up.railway.app
   VITE_UPLOAD_SERVICE_URL=https://your-upload-domain.up.railway.app
   VITE_ACCOUNT_API_URL=https://your-auth-domain.up.railway.app/api
   NODE_ENV=production
   ```
7. Click "Deploy"
8. Generate Domain → **This is your main app URL**

### 7. Update CORS and Frontend URLs

Now that you have all domains, go back and update:

**Auth Service** environment:
```
FRONTEND_URL=https://your-actual-frontend-domain.up.railway.app
```

**Tag Writer Service** environment:
```
CORS_ORIGINS=https://your-actual-frontend-domain.up.railway.app
```

**Upload Service** environment (add):
```
CORS_ORIGINS=https://your-actual-frontend-domain.up.railway.app
```

### 8. Setup Navidrome Admin Account

1. Visit your Navidrome domain: `https://your-navidrome-domain.up.railway.app`
2. Create the first admin account
3. Use these credentials in all service environment variables

### 9. Configure Shared Volumes (Important for File Uploads)

Railway volumes are service-specific by default. To share music files between services:

**Option A: Use Railway Volumes API** (Recommended)
1. Create one volume for music
2. Mount it to both Upload and Tag Writer services
3. Mount it to Navidrome as well

**Option B: Use External Storage** (For production)
1. Use S3-compatible storage (Cloudflare R2, AWS S3)
2. Mount via s3fs or similar
3. Update `MUSIC_LIBRARY_PATH` to point to mounted storage

### 10. Test Your Deployment

1. **Frontend**: Visit your frontend domain
2. **Login**: Try logging in with Navidrome admin credentials
3. **Registration**: Test creating a new user
4. **Upload**: Upload a test music file
5. **Tag Editor**: Edit metadata on a song
6. **Playback**: Verify music playback works

## Railway Volume Setup for File Uploads

### Creating Shared Volume

```bash
# In Railway CLI (optional)
railway volume create music-library --size 20GB
railway volume mount music-library:/music --service upload-service
railway volume mount music-library:/music --service tag-writer-service
railway volume mount music-library:/music --service navidrome
```

Or use the Railway Dashboard:
1. Go to Upload Service → Storage → Add Volume
2. Name: `music-library`, Path: `/music`, Size: 20GB
3. Note the Volume ID
4. Go to Tag Writer → Storage → Add Existing Volume → Select `music-library`
5. Go to Navidrome → Storage → Add Existing Volume → Select `music-library`

## Important Notes

### File Upload Persistence
- Railway volumes persist across deployments
- Free tier: 5GB storage included
- Paid tier: $0.25/GB/month

### Temporary Domains
- Railway provides `*.up.railway.app` domains for free
- Custom domains available on paid plans
- Domains are permanent once generated

### CORS Issues
If you encounter CORS errors:
1. Verify all service environment variables have correct frontend URL
2. Check Railway logs for blocked requests
3. Ensure `CORS_ORIGINS` matches exactly (no trailing slashes)

### Environment Variable Reference

All services need to reference each other. Here's the complete list:

#### Navidrome
```env
ND_SCANSCHEDULE=1m
ND_LOGLEVEL=info
```

#### Auth Service
```env
NAVIDROME_URL=https://navidrome.up.railway.app
NAVIDROME_USERNAME=admin
NAVIDROME_PASSWORD=your_password
FRONTEND_URL=https://frontend.up.railway.app
PORT=3005
```

#### Tag Writer Service
```env
NAVIDROME_URL=https://navidrome.up.railway.app
NAVIDROME_USERNAME=admin
NAVIDROME_PASSWORD=your_password
MUSIC_LIBRARY_PATH=/music
CORS_ORIGINS=https://frontend.up.railway.app
PORT=3001
```

#### Upload Service
```env
NAVIDROME_URL=https://navidrome.up.railway.app
NAVIDROME_USERNAME=admin
NAVIDROME_PASSWORD=your_password
MUSIC_LIBRARY_PATH=/music
CORS_ORIGINS=https://frontend.up.railway.app
PORT=3002
```

#### Frontend
```env
SERVER_URL=https://navidrome.up.railway.app
VITE_API_URL=https://navidrome.up.railway.app
VITE_TAG_WRITER_SERVICE_URL=https://tag-writer.up.railway.app
VITE_UPLOAD_SERVICE_URL=https://upload.up.railway.app
VITE_ACCOUNT_API_URL=https://auth.up.railway.app/api
```

## Monitoring & Logs

- Each service has its own logs in Railway dashboard
- Click on any service → "Logs" tab
- Filter by time range or search for errors

## Costs (Approximate)

**Free Tier:**
- $5 credit/month
- 5GB storage
- 500 hours execution time
- Good for testing

**Estimated Monthly Cost for Production:**
- Services: ~$5-10/month
- Storage (20GB): ~$5/month
- Total: ~$10-15/month

## Troubleshooting

### Service Won't Start
- Check logs for errors
- Verify all environment variables are set
- Ensure port matches in railway.json

### File Uploads Failing
- Verify volume is mounted to `/music`
- Check volume has enough space
- Verify permissions (Railway handles this automatically)

### CORS Errors
- Update CORS_ORIGINS in all backend services
- Ensure no trailing slashes in URLs
- Wait 1-2 minutes after updating env vars

### Can't Connect Services
- Use internal URLs: `${{NAVIDROME.RAILWAY_PRIVATE_DOMAIN}}`
- Or use public Railway domains
- Check network tab in browser DevTools

## Next Steps

1. Set up custom domain (optional)
2. Configure SSL/HTTPS (automatic on Railway)
3. Set up monitoring/alerts
4. Configure backups for volumes
5. Optimize build times with caching

## Support

- Railway Docs: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- Navidrome Docs: https://www.navidrome.org/docs/
