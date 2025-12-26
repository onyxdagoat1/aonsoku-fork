# Troubleshooting Guide

## Blank White Page

### Quick Fixes

**1. Check Browser Console**

Open Developer Tools (F12) and check the Console tab for errors:

```
Right-click on page → Inspect → Console tab
```

Common errors and solutions:

**Error: "Cannot find module '@/app/components/ui/...'"**
- **Cause:** Missing UI components
- **Fix:** These components are optional. The auth pages now use inline styles.

**Error: "VITE_SUPABASE_URL is not defined"**
- **Cause:** Missing environment variables
- **Fix:** Check your `.env` file:
  ```env
  VITE_SUPABASE_URL=https://your-project.supabase.co
  VITE_SUPABASE_ANON_KEY=your-anon-key
  ```
- Then restart dev server:
  ```bash
  npm run dev
  ```

**Error: "signIn is not a function"**
- **Cause:** AuthProvider not wrapped around app
- **Fix:** Already fixed in latest commit. Pull latest changes.

### Step-by-Step Debug

**1. Make sure you're on the testing branch:**
```bash
git branch  # Should show * testing
git pull origin testing
```

**2. Install dependencies:**
```bash
npm install
```

**3. Check .env file exists:**
```bash
cat .env
# Should show:
# VITE_SUPABASE_URL=...
# VITE_SUPABASE_ANON_KEY=...
```

**4. Restart dev server:**
```bash
# Stop current server (Ctrl+C)
npm run dev
```

**5. Navigate directly to auth page:**
```
http://localhost:3000/#/auth/login
```

## Specific Error Messages

### "Cannot read property 'useAuth' of undefined"

**Cause:** AuthContext not properly imported

**Fix:**
```bash
# Pull latest changes
git pull origin testing

# Restart dev server
npm run dev
```

### "Failed to fetch"

**Cause:** Supabase URL incorrect or network issue

**Fix:**
1. Check VITE_SUPABASE_URL in `.env`
2. Make sure it starts with `https://` and ends with `.supabase.co`
3. Verify you can access the URL in your browser

### OAuth Buttons Don't Work

**Cause:** OAuth providers not configured

**Fix:**
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Authentication** > **Providers**
4. Enable Google/Discord/GitHub
5. Add credentials from respective platforms
6. Add redirect URL: `http://localhost:3000/#/auth/callback`

### "Sign In" Button Not Showing

**Cause:** Supabase not configured or AuthProvider not loaded

**Check:**
1. Open browser console (F12)
2. Type: `console.log(import.meta.env.VITE_SUPABASE_URL)`
3. Should show your Supabase URL, not `undefined`

**If undefined:**
```bash
# Make sure .env has correct format:
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=ey...

# NO quotes, NO spaces around =
# Then restart:
npm run dev
```

## Still Having Issues?

### Test Minimal Setup

**1. Create a test file to check Supabase:**

```tsx
// src/test-supabase.tsx
import { supabase } from '@/lib/supabase'

console.log('Supabase client:', supabase)
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL)

// Check if we can connect
supabase.auth.getSession().then(({ data, error }) => {
  console.log('Session check:', { data, error })
})
```

**2. Import in main.tsx temporarily:**
```tsx
import './test-supabase'  // Add this line
```

**3. Check console output**

### Check File Exists

```bash
# Make sure these files exist:
ls -la src/contexts/AuthContext.tsx
ls -la src/lib/supabase.ts
ls -la src/app/pages/auth/Login.tsx
ls -la src/app/pages/auth/Register.tsx
```

### Nuclear Option: Fresh Start

```bash
# Save your .env file somewhere safe!
cp .env .env.backup

# Clean everything
rm -rf node_modules
rm package-lock.json

# Reinstall
npm install

# Restore .env
cp .env.backup .env

# Start fresh
npm run dev
```

## Common Development Issues

### Port Already in Use

```bash
# Error: Port 3000 is already in use

# Find and kill the process:
lsof -ti:3000 | xargs kill -9

# Or use different port:
vite --port 3001
```

### TypeScript Errors

```bash
# If you see TS errors in IDE:
npm run lint:check

# Auto-fix if possible:
npm run lint:fix
```

### Database Not Accessible

**Check Supabase Dashboard:**
1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Check if project is paused (free tier pauses after inactivity)
3. Click "Resume Project" if needed

## Getting Help

### Information to Provide

When asking for help, include:

1. **Browser console errors** (screenshot or copy/paste)
2. **Terminal output** from `npm run dev`
3. **Environment setup:**
   ```bash
   node --version
   npm --version
   cat .env | grep VITE_SUPABASE  # Don't share the full keys!
   ```
4. **What you see** vs **what you expect**

### Debug Checklist

- [ ] On `testing` branch
- [ ] Ran `npm install`
- [ ] `.env` file has `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- [ ] Dev server restarted after adding .env
- [ ] Browser console shows no red errors
- [ ] Can access Supabase dashboard
- [ ] Supabase project is active (not paused)
- [ ] SQL schema ran in Supabase SQL Editor

### Quick Test URLs

Try each of these in your browser:

1. Main app: `http://localhost:3000`
2. Login page: `http://localhost:3000/#/auth/login`
3. Register page: `http://localhost:3000/#/auth/register`

If any show blank white page:
1. Open browser console (F12)
2. Look for red error messages
3. Share screenshot for help

## Success Indicators

You know it's working when:

✅ Login page shows with "Welcome Back" heading
✅ OAuth buttons visible (Google, Discord, GitHub)
✅ Email/password form visible
✅ "Sign In" and "Sign Up" buttons in top-right of main app
✅ No red errors in browser console
✅ No errors in terminal

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [React Error Boundaries](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)

---

**Still stuck?** Open browser console (F12), take a screenshot of any errors, and check the error messages above for solutions.
