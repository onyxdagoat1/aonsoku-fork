# Feature Implementation Plan

## Current State Analysis

### Already Implemented (Build On Top Of)
| Feature Area | Status | Key Files |
|-------------|--------|-----------|
| **Party System** | ~85% complete | `PartyLobby.tsx`, `LivePartyRoom.tsx`, `PartySystemManagement.tsx` |
| **Social Activity Feed** | ~60% complete | `CommunityActivityFeed.tsx`, `social_activity` table |
| **User Follows** | Working | `followService.ts`, `followers` table |
| **Notifications** | Basic working | `NotificationsBell.tsx`, `notifications.store.ts` |
| **Profile System** | Basic working | `enhanced-profile.tsx`, `profiles` table |
| **YouTube OAuth** | Complete | `youtubeAuth.ts`, YouTube pages |
| **Comments/Reactions** | Complete | `comments.service.ts`, database tables |
| **Countdown Timers** | UI complete | `CountdownTimers.tsx` |
| **Last.fm Scrobbling** | Complete | `lastfmService.ts`, `useLastFmScrobbling.ts` |
| **Admin Panel** | ~50% complete | `admin/index.tsx` |

### Database Tables Already Exist
- `profiles`, `comments`, `comment_reactions`, `playlists`, `playlist_songs`, `playlist_collaborators`
- `favorites`, `listening_history`, `ratings`, `edit_credits`
- `parties`, `party_members`, `party_messages`, `party_queue_items`, `party_queue_votes`
- `social_activity`, `announcements`, `profile_social_links`, `profile_comments`, `profile_ratings`

---

## Phase 1: Core Music Features

### Backend Architecture

#### 1.1 Stream Count Tracking
**New Table: `stream_counts`**
```
- id, user_id, track_id, album_id, artist_id
- streamed_at (timestamp)
- duration_seconds (how long they listened)
```
**New Table: `track_stats` (aggregated)**
```
- track_id (PK), total_streams, unique_listeners, last_streamed_at
```
**RPC Functions:**
- `record_stream(track_id, duration)` - called when track completes or after 30s threshold
- `get_top_streamed_tracks(limit, timeframe)` - for charts

**Modifications:**
- Extend `player.store.ts` to call `record_stream` on track completion (similar to scrobbling logic)

#### 1.2 Upcoming Releases with Countdown
**New Table: `scheduled_releases`**
```
- id, title, description, artist_name, album_id (nullable)
- cover_art_url, release_type (album, single, compilation, edit)
- scheduled_at (countdown target), is_active, is_hidden
- created_by, created_at
```
**RPC Functions:**
- `get_upcoming_releases()` - public releases with countdown
- `activate_release(id)` - admin action to make visible/playable

**Modifications:**
- Extend existing `CountdownTimers.tsx` to pull from `scheduled_releases`

#### 1.3 Charts System
**New Table: `chart_snapshots` (daily/weekly aggregation)**
```
- id, chart_type (streams, follows, likes)
- content_type (track, album, artist)
- content_id, rank, score, snapshot_date
```
**RPC Functions:**
- `get_chart(chart_type, content_type, limit, timeframe)`
- `refresh_charts()` - scheduled function to recalculate

**Supabase Edge Function:** Scheduled job to calculate daily/weekly charts

#### 1.4 Playlist Management (Enhance Existing)
**Modifications to `playlists` table:**
- Add `followed_count` column
- Add `is_featured` (admin curated)

**New Table: `playlist_follows`**
```
- id, user_id, playlist_id, followed_at
- UNIQUE(user_id, playlist_id)
```
**RPC Functions:**
- `follow_playlist(playlist_id)`, `unfollow_playlist(playlist_id)`
- `get_followed_playlists(user_id)`
- `get_public_playlists(search, sort, limit)`

### Frontend Components

#### 1.5 Stream Tracking Integration
- Modify `useLastFmScrobbling.ts` pattern to also call `record_stream`
- No new UI needed (backend-only)

#### 1.6 Upcoming Releases Page
**New File:** `src/app/pages/releases/index.tsx`
- Grid of upcoming releases with countdown timers
- Filter by release type
- Pre-save/remind me button

**New Component:** `src/app/components/releases/ReleaseCard.tsx`
- Cover art, title, artist, countdown
- Release type badge
- Reminder toggle

#### 1.7 Charts Page
**New File:** `src/app/pages/charts/index.tsx`
- Tab navigation: Top Streams | Top Artists | Top Albums
- Timeframe toggle: Today | This Week | This Month | All Time
- Ranked list with position change indicators

#### 1.8 Enhanced Playlist Management
**New File:** `src/app/pages/playlists/browse.tsx`
- Browse public playlists
- Search and filter
- Follow button on each card

**Modify:** `src/app/pages/playlists/` (existing)
- Add public/private toggle in playlist settings
- Add follow count display
- Add "followed playlists" section

---

## Phase 2: Social Features

### Backend Architecture

#### 2.1 User Posts System
**New Table: `posts`**
```
- id, user_id, content (text)
- post_type (text, image, track_share, album_share)
- attached_content_id, attached_content_type
- upvotes, downvotes, reply_count
- is_pinned, is_deleted
- created_at, updated_at
```
**New Table: `post_votes`**
```
- id, post_id, user_id, vote (1 or -1)
- UNIQUE(post_id, user_id)
```
**New Table: `post_replies`**
```
- id, post_id, parent_reply_id (for threading)
- user_id, content
- upvotes, downvotes
- created_at
```
**RPC Functions:**
- `create_post()`, `vote_post()`, `reply_to_post()`
- `get_feed(user_id, page)` - posts from followed users
- `get_user_posts(user_id)`

#### 2.2 Direct Messaging
**New Table: `conversations`**
```
- id, participant_ids (array), created_at, updated_at
- last_message_preview, last_message_at
```
**New Table: `messages`**
```
- id, conversation_id, sender_id
- content, is_read
- created_at
```
**Supabase Realtime:** Subscribe to `messages` for live updates

**RPC Functions:**
- `start_conversation(user_id)`, `send_message()`
- `get_conversations()`, `get_messages(conversation_id)`
- `mark_as_read(conversation_id)`

#### 2.3 Enhanced Notifications
**Modify `notifications` table (or extend):**
- Add types: `follow`, `post_vote`, `post_reply`, `message`, `mention`
- Add `related_user_id`, `related_content_id`, `related_content_type`

**Supabase Triggers:**
- On `user_follows` insert → create notification
- On `post_votes` insert → create notification
- On `post_replies` insert → create notification
- On `messages` insert → create notification

#### 2.4 Verified Badges
**Modify `profiles` table:**
- Add `is_verified` (boolean)
- Add `verification_type` (artist, contributor, admin)

### Frontend Components

#### 2.5 Posts Feed
**New File:** `src/app/components/social/PostsFeed.tsx`
- Infinite scroll post list
- Post composer at top
- Vote buttons with counts
- Reply thread expansion

**New File:** `src/app/components/social/PostCard.tsx`
- User avatar + name + verified badge
- Post content + attached media
- Upvote/downvote controls
- Reply button + count

**New File:** `src/app/components/social/PostComposer.tsx`
- Text input with character limit
- Attach track/album option
- Post button

#### 2.6 Direct Messages
**New File:** `src/app/pages/messages/index.tsx`
- Conversation list sidebar
- Message thread view
- Message composer

**New Component:** `src/app/components/messages/ConversationList.tsx`
**New Component:** `src/app/components/messages/MessageThread.tsx`
**New Component:** `src/app/components/messages/MessageInput.tsx`

**New Store:** `src/store/messages.store.ts`
- Active conversation, unread counts
- Realtime subscription management

#### 2.7 Enhanced Profile
**Modify:** `src/app/pages/profile/enhanced-profile.tsx`
- Add posts tab
- Display verified badge
- Add "Message" button for other users

#### 2.8 Notification Enhancements
**Modify:** `src/app/components/header/NotificationsBell.tsx`
- Add new notification types
- Click to navigate to relevant content
- Group notifications by type

---

## Phase 3: Admin Features

### Backend Architecture

#### 3.1 Content Moderation System
**New Table: `blacklisted_words`**
```
- id, word (text), severity (warn, block, shadow_ban)
- created_by, created_at
```
**New Table: `content_reports`**
```
- id, reporter_id, content_type, content_id
- reason, description
- status (pending, reviewed, actioned, dismissed)
- reviewed_by, reviewed_at
```
**New Table: `moderation_actions`**
```
- id, admin_id, target_type (user, post, comment, message)
- target_id, action (warn, delete, ban, shadow_ban)
- reason, created_at
```
**Supabase Edge Functions:**
- Content filter function to check posts/comments against blacklist
- Return filtered content or block submission

#### 3.2 Pre-Upload Hidden Content
**Modify `scheduled_releases` table:**
- `is_hidden` flag (existing in design)
- `activation_date` vs `scheduled_at`

**New RPC:** `toggle_release_visibility(id, is_hidden)`

### Frontend Components

#### 3.3 Enhanced Admin Panel
**New Tab:** Blacklist Management
- CRUD for blacklisted words
- Severity level selection
- Test string against blacklist

**New Tab:** Content Reports
- Queue of pending reports
- Review interface with context
- Action buttons (dismiss, warn, delete, ban)

**New Tab:** Scheduled Content
- List of hidden/scheduled content
- Toggle visibility
- Edit scheduled date
- Preview content

**Modify:** `src/app/pages/admin/index.tsx`
- Add new tabs
- Enhanced statistics dashboard

---

## Phase 4: UI & Customization

### Backend Architecture

#### 4.1 User Preferences Storage
**Modify `profiles` table or new `user_preferences` table:**
```
- user_id (PK), layout_settings (JSONB)
- grid_size, list_density, sidebar_config
- animated_backgrounds_enabled
- lyrics_display_mode
```

### Frontend Components

#### 4.2 Layout Customization
**New File:** `src/app/components/settings/LayoutSettings.tsx`
- Grid size selector (small, medium, large)
- List density (compact, comfortable, spacious)
- Sidebar toggle options

**Modify:** `src/store/layout.store.ts`
- Add new layout preference fields
- Persist to Supabase on change

#### 4.3 Animated Backgrounds
**New File:** `src/app/components/ui/AnimatedBackground.tsx`
- Canvas-based or CSS animation
- Color extraction from album art
- Beat detection sync (WebAudio API)

**New Hook:** `src/hooks/useAudioVisualization.ts`
- Analyze audio for beat/frequency data
- Expose animation parameters

#### 4.4 Enhanced Lyrics Display
**New File:** `src/app/components/lyrics/SyncedLyrics.tsx`
- Line-by-line highlighting
- Karaoke mode option
- Click to seek

**Modify:** `src/service/lyrics.ts`
- Add fallback API (Genius, Musixmatch)
- Cache found lyrics locally

**New Service:** `src/service/lyricsSearch.ts`
- Multi-provider search
- Store fetched lyrics

---

## Phase 5: Music Discovery & Playlists

### Backend Architecture

#### 5.1 Smart Playlists
**New Table: `smart_playlist_rules`**
```
- id, playlist_id, field (bpm, genre, era, artist, year)
- operator (equals, contains, greater_than, less_than, in_range)
- value, value_end (for ranges)
```
**Supabase Edge Function:** `generate_smart_playlist(rules)` - query tracks matching rules

#### 5.2 Advanced Search
**New Table: `saved_searches`**
```
- id, user_id, name, filters (JSONB)
- created_at
```
**Enhanced Search RPC:** `advanced_search(filters)` - multi-criteria

#### 5.3 Queue History
**New Table: `queue_history`**
```
- id, user_id, track_ids (array), played_at
- saved_as_playlist_id (nullable)
```

### Frontend Components

#### 5.4 Smart Playlist Builder
**New File:** `src/app/components/playlists/SmartPlaylistBuilder.tsx`
- Rule builder UI (add/remove conditions)
- Preview matching tracks
- Save as smart playlist

#### 5.5 Advanced Search Page
**New File:** `src/app/pages/search/advanced.tsx`
- Multi-field filters
- Era selector (from existing era config)
- Tag filters
- Save search preset

#### 5.6 Queue Enhancements
**Modify:** `src/app/components/queue/` (existing)
- Add drag-and-drop reordering (use @dnd-kit)
- Add "Save as playlist" button
- Add queue history view

**New Store Fields:** `src/store/player.store.ts`
- `queueHistory: QueueSnapshot[]`
- `saveCurrentQueue()`, `restoreQueue()`

---

## Phase 6: Playback & Library Management

### Backend Architecture

#### 6.1 Custom Tags System
**New Table: `custom_tags`**
```
- id, name, color, icon
- created_by (nullable - system or user)
```
**New Table: `content_tags`**
```
- id, content_type, content_id
- tag_id, user_id
```
**Preset Tags:** Vanilla, Rework, Remaster, Extended, Edit, Mashup

#### 6.2 Metadata Management
**Backend Service Required:** Extend `tag-writer-service`
- Batch update endpoints
- MusicBrainz/Discogs fetch integration

### Frontend Components

#### 6.3 Tag Management UI
**New File:** `src/app/components/library/TagManager.tsx`
- Tag creation/editing
- Color picker
- Apply to selected tracks

**New File:** `src/app/components/library/TagFilter.tsx`
- Filter library by tags
- Multi-select

#### 6.4 Bulk Tag Editor
**New File:** `src/app/pages/editor/bulk.tsx`
- Multi-select tracks
- Batch edit common fields
- Apply tag templates

**New File:** `src/app/components/editor/TagTemplates.tsx`
- Create/save templates
- Quick apply

#### 6.5 BPM & Key Detection UI
**New File:** `src/app/components/editor/BPMDetector.tsx`
- Tap tempo interface
- Manual override input
- Auto-detect button (if backend supports)

---

## Phase 7: Party Mode Extensions

### Backend Architecture

#### 7.1 Report System
**Use existing `content_reports` table from Phase 3**

#### 7.2 Enhanced Activity Feed
**Extend `social_activity` table:**
- Add `party_id` for party-specific actions
- Add more action types

### Frontend Components

#### 7.3 Report Button
**New Component:** `src/app/components/common/ReportButton.tsx`
- Dropdown with report reasons
- Submit to `content_reports`

**Integrate into:**
- Party chat messages
- User profiles
- Comments
- Posts

#### 7.4 Activity Feed Enhancement
**Modify:** `src/app/components/social/CommunityActivityFeed.tsx`
- Add party activity types
- Real-time "now listening" for friends
- Click to join party

---

## Phase 8: Enhanced Editor Features

### Backend Architecture

#### 8.1 Metadata Import Service
**Extend:** `tag-writer-service` backend
- MusicBrainz lookup endpoint
- Discogs lookup endpoint
- Batch processing

### Frontend Components

#### 8.2 Metadata Import UI
**New File:** `src/app/components/editor/MetadataImport.tsx`
- Search MusicBrainz/Discogs
- Preview matched data
- Select fields to import
- Batch apply

#### 8.3 Tag Autocomplete
**New Component:** `src/app/components/editor/TagAutocomplete.tsx`
- Suggest from existing tags
- Create new inline
- Keyboard navigation

---

## Phase 9: Import/Export & Backup

### Backend Architecture

#### 9.1 Export Endpoints
**Supabase Edge Functions:**
- `export_playlists(user_id, format)` - JSON/CSV
- `export_listening_history(user_id, range)` - CSV
- `export_settings(user_id)` - JSON
- `export_metadata(track_ids)` - CSV

### Frontend Components

#### 9.2 Export UI
**New File:** `src/app/pages/settings/export.tsx`
- Section: Settings Backup
  - Download settings JSON
  - Restore from file
- Section: Playlists
  - Select playlists to export
  - Format selection (JSON/CSV)
- Section: Listening History
  - Date range picker
  - Download CSV
- Section: Library Metadata
  - Select scope
  - Export tags/metadata

---

## Implementation Priority Order

### Sprint 1: Foundation (Backend Focus)
1. Stream count tracking tables + RPC
2. Charts system tables + RPC
3. Playlist follows table + RPC
4. Posts system tables + RPC
5. Direct messaging tables + RPC

### Sprint 2: Core Music UI
6. Charts page
7. Upcoming releases page
8. Enhanced playlist browser
9. Public/private playlist toggle

### Sprint 3: Social UI
10. Posts feed implementation
11. Direct messages UI
12. Enhanced notifications
13. Verified badges display

### Sprint 4: Admin & Moderation
14. Blacklist management
15. Content reports queue
16. Enhanced admin dashboard
17. Pre-upload hidden content

### Sprint 5: Customization & Discovery
18. Layout customization settings
19. Smart playlist builder
20. Advanced search
21. Queue history + drag-drop

### Sprint 6: Editor & Export
22. Bulk tag editor
23. Metadata import
24. Custom tags system
25. Export/backup functionality

### Sprint 7: Polish & Party
26. Animated backgrounds
27. Enhanced lyrics
28. Party activity feed
29. Report system

---

## Technical Dependencies

### New npm Packages Needed
- `@dnd-kit/core`, `@dnd-kit/sortable` - Drag and drop for queue
- `canvas-confetti` - Celebrations/reactions (optional)
- `essentia.js` or `web-audio-beat-detector` - BPM detection (optional)
- `papaparse` - CSV export

### Supabase Configuration
- Enable Realtime for: `messages`, `posts`, `post_replies`, `notifications`
- Create scheduled Edge Functions for charts refresh
- Set up storage buckets for: post images, exported files

### Backend Services
- Extend `tag-writer-service` for metadata operations
- Consider adding `export-service` for large exports

---

## Files to Create (Summary)

### New Pages (~15)
- `/charts`, `/releases`, `/playlists/browse`, `/messages`
- `/search/advanced`, `/editor/bulk`, `/settings/export`

### New Components (~40)
- Releases: `ReleaseCard`, `ReleasesGrid`
- Charts: `ChartList`, `ChartEntry`
- Posts: `PostsFeed`, `PostCard`, `PostComposer`
- Messages: `ConversationList`, `MessageThread`, `MessageInput`
- Playlists: `SmartPlaylistBuilder`, `PlaylistBrowser`
- Queue: `QueueHistory`, `DraggableQueueItem`
- Editor: `BulkTagEditor`, `TagTemplates`, `MetadataImport`, `TagAutocomplete`
- UI: `AnimatedBackground`, `SyncedLyrics`, `LayoutSettings`
- Common: `ReportButton`, `VerifiedBadge`
- Admin: `BlacklistManager`, `ReportsQueue`, `ScheduledContent`

### New Services (~8)
- `chartsService.ts`, `postsService.ts`, `messagesService.ts`
- `smartPlaylistService.ts`, `tagsService.ts`, `lyricsSearch.ts`
- `exportService.ts`, `metadataImportService.ts`

### New Stores (~4)
- `messages.store.ts`, `charts.store.ts`
- `posts.store.ts`, `search.store.ts`

### Database Migrations (~12)
- Stream counts + track stats
- Scheduled releases
- Chart snapshots
- Posts + votes + replies
- Conversations + messages
- Blacklisted words + reports + actions
- User preferences
- Smart playlist rules
- Saved searches
- Queue history
- Custom tags + content tags
- Playlist follows
