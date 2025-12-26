# Supabase Auth Troubleshooting

## 🔴 Blank Screen After Setup?

### Quick Checklist

1. **Pull the latest code from testing branch**
   ```bash
   git pull origin testing
   npm install
   ```

2. **Verify environment variables in `.env`**
   ```env
   VITE_SUPABASE_URL=https://wioeokia1jqdbrzsgfpo.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

3. **Restart the dev server**
   ```bash
   # Stop the server (Ctrl+C)
   npm run dev
   ```

4. **Check browser console for errors**
   - Open DevTools (F12)
   - Look for red errors
   - Common issues:
     - "Supabase not configured" - check .env file
     - "OAuth error" - check Google OAuth setup
     - "CORS error" - check Supabase allowed URLs

5. **Test navigation**
   - Try going to: `http://localhost:3000/#/auth/login`
   - If you see a login page, OAuth is working!

### ✅ What Should Work Now

- ✅ Google login button appears
- ✅ Clicking it redirects to Google
- ✅ After login, returns to app
- ✅ Profile automatically created in Supabase
- ✅ Navidrome user automatically created

### Common Issues

#### Issue: "signInWithProvider is not a function"
**Solution**: Clear browser cache or use incognito mode

#### Issue: Google login redirects but stays on blank page
**Solution**: Check redirect URL in Google Console matches:
```
https://wioeokia1jqdbrzsgfpo.supabase.co/auth/v1/callback
```

#### Issue: "Failed to create Navidrome user"
**Solution**: 
- Make sure auth service is running (port 3005)
- Check `NAVIDROME_USERNAME` and `NAVIDROME_PASSWORD` in .env
- This is non-critical - social features still work

### Test the Setup

1. **Start all services**
   ```bash
   npm run dev
   ```

2. **Open browser**
   ```
   http://localhost:3000/#/auth/login
   ```

3. **Click "Continue with Google"**

4. **Sign in with Google account**

5. **Should redirect back to app**

6. **Check Supabase Dashboard**
   - Go to Authentication > Users
   - You should see your user
   - Go to Table Editor > profiles
   - You should see your profile

### Still Having Issues?

Share these details:
1. Browser console errors (screenshot)
2. Terminal output (especially auth service - magenta text)
3. Network tab showing failed requests
