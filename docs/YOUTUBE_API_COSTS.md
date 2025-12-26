# YouTube API Costs & Quota Management

## 💰 Is the YouTube API Free?

**Yes, the YouTube Data API v3 is completely FREE!** ✅

However, it uses a **quota system** to limit usage, not actual money. You **never pay in dollars** for using the YouTube API.

## 📊 Quota System Explained

### Default Free Quota
- **10,000 units per day** (default for all projects)
- Resets at **midnight Pacific Time** (PT)
- **No credit card required**
- **No billing enabled needed** for basic usage

### What Happens When You Exceed Quota?
- API requests will fail with error: `quotaExceeded`
- Your app stops working until the quota resets
- **No charges** - you just have to wait

## 💵 Cost in Quota Units (Not Dollars)

### Common Operations for This App:

| Operation | Quota Cost | Notes |
|-----------|-----------|-------|
| **Channel Info** | 3 units | Cached in app for 1 hour |
| **List Videos** | 100 units | Gets 50 videos at once |
| **List Playlists** | 1 unit | Gets all playlists |
| **Playlist Items** | 1 unit | Videos in a playlist |
| **Video Details** | 1 unit per video | Includes stats |
| **Comments** | 1 unit | Gets 100 comments |
| **Search** | 100 units | Most expensive |

### Example: Initial Page Load
```
Channel Info:     3 units
List 50 Videos:   100 units
List Playlists:   1 unit
Video Details:    1 unit (already included)
-----------------------------------
Total:            ~104 units per load
```

**Daily Capacity:** ~96 page loads per day (10,000 ÷ 104)

### With Caching (Our Implementation)
```
First Load:       104 units
Next 1 Hour:      0 units (uses cache)
-----------------------------------
With 1hr cache:   ~240 loads per day possible
```

## ✅ Our App's Quota-Saving Features

### 1. **Local Storage Caching** (1 hour)
- All data cached for 1 hour
- Reduces API calls by **~90%**
- Users see instant loading after first visit

### 2. **Smart Loading**
- Only loads 50 videos (not all)
- Comments load on-demand (when video opened)
- Playlists load only when tab clicked

### 3. **Efficient Design**
- No auto-refresh
- Manual refresh button
- Search happens locally (no API calls)
- Sort/filter happens client-side

## 🔒 Security: Restricting Your API Key

### ⚠️ **IMPORTANT: Always Restrict Your API Key!**

Unrestricted keys can be stolen and abused, exhausting your quota.

### How to Restrict Your Key:

#### Step 1: Go to Google Cloud Console
1. Visit: https://console.cloud.google.com/apis/credentials
2. Click on your API key

#### Step 2: Application Restrictions

**For Development:**
```
Application restrictions: HTTP referrers (web sites)
Website restrictions: 
  - http://localhost:*
  - http://127.0.0.1:*
```

**For Production:**
```
Application restrictions: HTTP referrers (web sites)
Website restrictions:
  - https://yourdomain.com/*
  - https://www.yourdomain.com/*
```

#### Step 3: API Restrictions
```
API restrictions: Restrict key
Select APIs:
  ☑ YouTube Data API v3
```

#### Step 4: Save
Click "Save" at the bottom.

### 🚫 What NOT to Do:
- ❌ Never commit API keys to GitHub
- ❌ Never share keys publicly
- ❌ Never use unrestricted keys in production
- ❌ Never hardcode keys in source code

### ✅ What TO Do:
- ✅ Use `.env` files (in `.gitignore`)
- ✅ Restrict by domain/referrer
- ✅ Restrict to YouTube API only
- ✅ Monitor usage regularly
- ✅ Rotate keys periodically

## 📈 Monitoring Your Quota Usage

### Check Usage in Google Cloud Console:

1. Go to: https://console.cloud.google.com/apis/dashboard
2. Select "YouTube Data API v3"
3. View usage graphs and statistics

### What to Monitor:
- **Queries per day** - Should stay under 10,000
- **Quota usage percentage** - Alert if >80%
- **Error rates** - Check for quota exceeded errors

## 🚀 Increasing Your Quota

### Free Quota Increase Request

If you need more than 10,000 units/day:

1. Go to: https://console.cloud.google.com/apis/api/youtube.googleapis.com/quotas
2. Click "EDIT QUOTAS" or request increase
3. Fill out the form:
   - Project details
   - Use case description
   - Expected daily usage
   - Why you need more quota

### Typical Approved Quotas:
- Small projects: **50,000 - 100,000 units/day**
- Medium projects: **100,000 - 1,000,000 units/day**
- Large projects: **1,000,000+ units/day**

### Approval Process:
- Usually takes **1-7 days**
- Approval not guaranteed
- Must have legitimate use case
- **Still completely free** (no charges)

## 💡 Advanced Optimization Tips

### 1. Pagination Instead of Bulk Loading
```typescript
// Instead of loading 50 videos at once:
youtubeService.getChannelVideos(10); // Load 10 at a time

// Add "Load More" button
// Saves ~80 units per load
```

### 2. Increase Cache Duration
```typescript
// Change cache from 1 hour to 6 hours:
const cacheExpiry = 6 * 60 * 60 * 1000; // 6 hours

// Or use 24 hours for less-frequently updated content
```

### 3. Skip Comments Unless Requested
```typescript
// Don't auto-load comments
// Only load when user clicks "View Comments"
// Saves 1 unit per video viewed
```

### 4. Use Webhooks (Advanced)
Instead of polling for new videos:
- Set up YouTube Data API push notifications
- Only fetch when new content is published
- Requires backend server

### 5. Server-Side Caching (Production)
For production apps:
- Cache on server, not just client
- Serve all users from same cache
- Update cache every few hours
- Reduces quota usage by **99%**

## 📄 Sample Quota Calculations

### Scenario 1: Personal Use (5 users/day)
```
5 users × 104 units = 520 units/day
Quota remaining: 9,480 units
Status: ✅ Well within limits
```

### Scenario 2: Small Community (50 users/day)
```
50 users × 104 units = 5,200 units/day
With 1hr cache: ~2,600 units/day (50% reuse)
Quota remaining: 7,400 units
Status: ✅ Comfortable
```

### Scenario 3: Popular App (200 users/day)
```
200 users × 104 units = 20,800 units/day
With 1hr cache: ~10,400 units/day
Quota remaining: -400 units
Status: ⚠️ Need quota increase or better caching
```

### Solution for Scenario 3:
- Increase cache to 6 hours: ~4,000 units/day ✅
- Request quota increase to 50,000 units/day ✅
- Implement server-side caching ✅

## ❓ FAQ

### Q: Will I ever be charged money for the YouTube API?
**A:** No, the YouTube Data API v3 is completely free. You will never receive a bill.

### Q: What if I exceed my daily quota?
**A:** Your API requests will fail until midnight PT. No charges, just temporary blocking.

### Q: Do I need a credit card to use the API?
**A:** No, you can create API keys without any payment method.

### Q: Can I get banned for exceeding quota?
**A:** No, you just have to wait for the quota reset. Repeated abuse might flag your project though.

### Q: Is the quota per project or per API key?
**A:** Per project. All API keys in the same Google Cloud project share the same quota.

### Q: Can I create multiple projects for more quota?
**A:** Technically yes, but this violates Google's ToS. Request a quota increase instead.

### Q: Does caching violate YouTube's terms?
**A:** No, caching for performance is explicitly allowed. Just don't cache for >30 days.

### Q: Can users exhaust my quota maliciously?
**A:** With proper API key restrictions (domain-locked), this is very difficult. Monitor usage regularly.

## 📊 Quota Usage Dashboard (Optional)

To add quota tracking to your app:

```typescript
// Track API calls
let dailyQuotaUsed = 0;

function trackQuotaUsage(operation: string, cost: number) {
  dailyQuotaUsed += cost;
  console.log(`${operation}: ${cost} units (Total: ${dailyQuotaUsed}/10000)`);
  
  if (dailyQuotaUsed > 8000) {
    console.warn('⚠️ Approaching daily quota limit!');
  }
}

// Usage:
trackQuotaUsage('getChannelVideos', 100);
trackQuotaUsage('getComments', 1);
```

## 🔗 Useful Links

- **Quota Calculator:** https://developers.google.com/youtube/v3/determine_quota_cost
- **Quota Dashboard:** https://console.cloud.google.com/apis/dashboard
- **Request Quota Increase:** https://console.cloud.google.com/apis/api/youtube.googleapis.com/quotas
- **YouTube API Policies:** https://developers.google.com/youtube/terms/api-services-terms-of-service
- **API Documentation:** https://developers.google.com/youtube/v3/docs

## 📝 Summary

✅ **Free Forever** - No charges ever  
✅ **10,000 units/day** - Default quota  
✅ **Our app uses ~104 units** per page load  
✅ **Caching saves 90%** of quota  
✅ **~96-240 loads/day** possible  
✅ **Quota increases available** for free  
✅ **Always restrict your API key** for security  

---

**Bottom Line:** The YouTube API is completely free, and with our smart caching, you'll likely never hit the quota limit for personal/small community use! 🎉
