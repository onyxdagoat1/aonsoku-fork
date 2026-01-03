# yedits.net Production Deployment Guide

## Prerequisites

- VPS with Ubuntu 22.04+ (recommend AlexHost Moldova or similar offshore provider)
- Domain yedits.net with Cloudflare DNS
- Cloudflare account (free tier works)
- Supabase project set up
- SSH access to your VPS

---

## Step 1: Purchase VPS

**Recommended: AlexHost (Moldova)**
- Go to [alexhost.com](https://alexhost.com)
- Select VPS with: 4GB RAM, 2 vCores, **50GB SSD** (music stored on R2, not VPS)
- Pay with crypto for anonymity if desired
- Note your VPS IP address

---

## Step 2: Create Cloudflare R2 Bucket

1. **Log in to Cloudflare Dashboard**
2. **Go to R2 → Create Bucket**
   - Name: `yedits-music`
   - Location: Auto (or choose closest to your users)

3. **Create R2 API Token**:
   - R2 → Manage R2 API Tokens → Create API Token
   - Permissions: **Object Read & Write**
   - Specify bucket: `yedits-music`
   - Save the **Access Key ID** and **Secret Access Key**

4. **Note your account ID** from the R2 overview page
   - Endpoint will be: `https://YOUR_ACCOUNT_ID.r2.cloudflarestorage.com`

### R2 Pricing (for reference):
| Usage | Cost |
|-------|------|
| Storage (200GB) | ~$3/month |
| Downloads | **FREE** (unlimited) |
| Class A ops (writes) | $4.50/million |
| Class B ops (reads) | $0.36/million |

---

## Step 3: Configure Cloudflare DNS

1. **Add DNS Records** (all proxied through Cloudflare):
   ```
   Type    Name    Content         Proxy
   A       @       YOUR_VPS_IP     ✓ Proxied
   A       www     YOUR_VPS_IP     ✓ Proxied
   ```

2. **SSL/TLS Settings**:
   - Mode: **Full (Strict)**
   - Always Use HTTPS: **On**
   - Minimum TLS: **1.2**

3. **Generate Origin Certificate**:
   - Go to SSL/TLS → Origin Server
   - Create Certificate (15 years validity)
   - Download both `origin.pem` and `origin-key.pem`
   - Keep these safe for server setup

---

## Step 4: Server Setup

SSH into your VPS:
```bash
ssh root@YOUR_VPS_IP
```

### Install Docker:
```bash
curl -fsSL https://get.docker.com | sh
systemctl enable docker
systemctl start docker
```

### Install Docker Compose:
```bash
apt update && apt install -y docker-compose-plugin
```

### Setup Firewall:
```bash
apt install -y ufw
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

### Install Fail2ban:
```bash
apt install -y fail2ban
systemctl enable fail2ban
systemctl start fail2ban
```

---

## Step 5: Deploy Application

### Clone Repository:
```bash
git clone https://github.com/onyxdagoat1/aonsoku-fork.git /opt/yedits
cd /opt/yedits
```

### Configure Environment:
```bash
cp .env.production.example .env.production
nano .env.production
# Fill in:
# - Supabase URL and anon key
# - Navidrome admin password
# - R2 credentials (Access Key, Secret, Endpoint, Bucket)
```

### Setup SSL Certificates:
```bash
mkdir -p /opt/yedits/ssl
nano /opt/yedits/ssl/origin.pem      # Paste certificate from Cloudflare
nano /opt/yedits/ssl/origin-key.pem  # Paste private key
```

### Build and Start:
```bash
cd /opt/yedits
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
```

### Check Status:
```bash
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f
```

---

## Step 6: Upload Music to R2

Music is stored in Cloudflare R2, not on the VPS. Upload directly to R2:

### Option A: Using rclone (recommended)
```bash
# On your LOCAL machine, install rclone
# Windows: winget install Rclone.Rclone
# Mac: brew install rclone
# Linux: apt install rclone

# Configure R2 remote
rclone config
# Choose: n (new remote)
# Name: r2
# Storage: s3
# Provider: Cloudflare
# Access Key: YOUR_R2_ACCESS_KEY_ID
# Secret Key: YOUR_R2_SECRET_ACCESS_KEY
# Endpoint: YOUR_ACCOUNT_ID.r2.cloudflarestorage.com
# Leave other options as default

# Upload your music
rclone sync /path/to/local/music r2:yedits-music --progress
```

### Option B: Using web uploader
- Navigate to https://yedits.net
- Log in and use the upload interface
- Files are automatically stored in R2

### Trigger Navidrome Scan:
```bash
# SSH to VPS
docker compose -f docker-compose.prod.yml exec navidrome /app/navidrome scan
```

---

## Step 7: Initial Navidrome Setup

1. Visit `https://yedits.net`
2. Create admin account matching your `.env.production` credentials
3. Configure Navidrome settings:
   - Enable downloads for all users
   - Enable sharing
   - Set default theme

---

## Maintenance Commands

### View Logs:
```bash
docker compose -f docker-compose.prod.yml logs -f [service_name]
# e.g., logs -f navidrome, logs -f rclone
```

### Check rclone mount:
```bash
docker compose -f docker-compose.prod.yml exec rclone ls /music
```

### Restart Services:
```bash
docker compose -f docker-compose.prod.yml restart
```

### Update Application:
```bash
cd /opt/yedits
git pull origin main
docker compose -f docker-compose.prod.yml up -d --build
```

---

## Troubleshooting

### Check if services are running:
```bash
docker compose -f docker-compose.prod.yml ps
```

### Check rclone R2 connection:
```bash
docker compose -f docker-compose.prod.yml logs rclone
```

### Check nginx config:
```bash
docker compose -f docker-compose.prod.yml exec nginx nginx -t
```

### Reset everything:
```bash
docker compose -f docker-compose.prod.yml down -v
docker compose -f docker-compose.prod.yml up -d --build
```

### Check Cloudflare is working:
```bash
curl -sI https://yedits.net | grep -i cf-
# Should show cf-ray header
```

---

## Cost Summary

| Service | Monthly |
|---------|---------|
| AlexHost VPS (4GB RAM) | ~$10-15 |
| Cloudflare R2 (200GB) | ~$3 |
| R2 Downloads | **FREE** |
| Cloudflare CDN | Free |
| Supabase | Free |
| **Total** | **~$13-18/month** |

---

## Security Checklist

- [ ] Changed default Navidrome admin password
- [ ] SSH key-only authentication enabled
- [ ] UFW firewall active
- [ ] Fail2ban running
- [ ] Cloudflare proxy enabled (orange cloud on DNS)
- [ ] Origin certificates installed
- [ ] `.env.production` not in git
- [ ] R2 API token has minimal permissions
