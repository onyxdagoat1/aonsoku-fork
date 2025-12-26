# Quick Start Guide - Get Running in 5 Minutes

## Step 1: Install Dependencies (1 min)

```bash
cd auth-service
npm install
```

## Step 2: Configure Environment (2 min)

```bash
cp .env.example .env
```

Now edit `.env`:

### 🔴 REQUIRED: Generate JWT Secrets

Run this command **three times** to generate three different secrets:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

You'll get output like:
```
f8e7d6c5b4a39281706f5e4d3c2b1a09e8f7d6c5b4a39281706f5e4d3c2b1a09
```

Copy each output into `.env`:

```env
JWT_SECRET=<paste first output here>
JWT_REFRESH_SECRET=<paste second output here>
SESSION_SECRET=<paste third output here>
```

### ✅ FRONTEND_URL (Your Aonsoku Frontend)

**What is this?** The URL where your Aonsoku React app runs.

**Find your frontend URL:**

1. Open your main Aonsoku project
2. Look at `package.json` and find the dev script
3. Common URLs:
   - Vite dev server: `http://localhost:5173` (most likely)
   - Custom port: `http://localhost:3000`
   - Or check your terminal when running `npm run dev`

**Set it in `.env`:**
```env
FRONTEND_URL=http://localhost:5173
```

### ⚠️ OPTIONAL: OAuth (Can Skip for Now)

You can start **WITHOUT** Google/Discord OAuth. Just leave these blank:

```env
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
DISCORD_CLIENT_ID=
DISCORD_CLIENT_SECRET=
```

Users can still register with email/password!

**If you want OAuth later**, see [OAUTH_SETUP.md](./OAUTH_SETUP.md).

## Step 3: Start the Server (1 min)

```bash
npm run dev
```

You should see:

```
🎵 Aonsoku Auth Service
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 Server running on port 3005
🌐 Frontend URL: http://localhost:5173
💾 Database: sqlite
📝 Environment: development
```

## Step 4: Test It (1 min)

### Test 1: Health Check

```bash
curl http://localhost:3005/health
```

Should return:
```json
{"status":"ok","service":"aonsoku-auth-service"}
```

### Test 2: Register a User

```bash
curl -X POST http://localhost:3005/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "password": "Test1234"
  }'
```

Should return user data with tokens!

## ✅ You're Done!

Your auth service is now running on `http://localhost:3005`

## Next Steps

1. **Integrate with Frontend** - See [FRONTEND_INTEGRATION.md](./FRONTEND_INTEGRATION.md)
2. **Set up OAuth** (optional) - See [OAUTH_SETUP.md](./OAUTH_SETUP.md)
3. **Build login UI** - Examples in docs
4. **Add comments feature** - API already works!

## Common Issues

### Port Already in Use

Change the port in `.env`:
```env
PORT=3006
```

### "FRONTEND_URL" CORS Error

Make sure FRONTEND_URL exactly matches where your Aonsoku frontend runs.

Check your frontend terminal:
```bash
cd /path/to/aonsoku-fork
npm run dev
# Look for "Local: http://localhost:5173" or similar
```

### Database Error

Make sure the `data` directory can be created:
```bash
mkdir -p data
chmod 755 data
```

## Environment Variable Cheat Sheet

```env
# ✅ REQUIRED
PORT=3005                                    # Auth service port
FRONTEND_URL=http://localhost:5173          # Your Aonsoku frontend
JWT_SECRET=<64-char-random-string>          # Generate with crypto
JWT_REFRESH_SECRET=<64-char-random-string>  # Different from above
SESSION_SECRET=<64-char-random-string>      # Different from both

# ⚠️ OPTIONAL (can leave blank)
GOOGLE_CLIENT_ID=                           # For Google login
GOOGLE_CLIENT_SECRET=                       # For Google login
DISCORD_CLIENT_ID=                          # For Discord login
DISCORD_CLIENT_SECRET=                      # For Discord login

# 💡 DEFAULTS (usually fine as-is)
DATABASE_TYPE=sqlite                        # Or postgres for production
DATABASE_PATH=./data/auth.db               # SQLite file location
NAVIDROME_URL=http://localhost:4533        # Your Navidrome server
```

## Questions?

- **Q: What is FRONTEND_URL?**
  - A: The URL where your Aonsoku React app runs (check when you run `npm run dev`)

- **Q: Do I need Google/Discord OAuth?**
  - A: No! You can skip OAuth and just use email/password registration

- **Q: How do I generate JWT secrets?**
  - A: Run `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

- **Q: Can I use a different port?**
  - A: Yes! Change PORT in `.env` and update callback URLs accordingly
