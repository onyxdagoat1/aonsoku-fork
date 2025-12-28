-- Comments System Database Schema
-- SQLite implementation for Aonsoku comment system
-- Version: 1.0.0
-- Created: 2025-12-28

-- ============================================
-- Table: comments
-- Stores all user comments on various entities
-- ============================================
CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entity_type TEXT NOT NULL CHECK(entity_type IN ('artist', 'album', 'compilation', 'single')),
    entity_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    username TEXT NOT NULL,
    content TEXT NOT NULL CHECK(length(content) > 0 AND length(content) <= 1000),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT NULL,
    
    -- Denormalized like count for performance
    likes INTEGER NOT NULL DEFAULT 0
);

-- Index for fast lookups by entity
CREATE INDEX IF NOT EXISTS idx_comments_entity 
    ON comments(entity_type, entity_id);

-- Index for fast lookups by user
CREATE INDEX IF NOT EXISTS idx_comments_user 
    ON comments(user_id);

-- Index for sorting by date
CREATE INDEX IF NOT EXISTS idx_comments_created 
    ON comments(created_at DESC);

-- Composite index for common query pattern
CREATE INDEX IF NOT EXISTS idx_comments_entity_created 
    ON comments(entity_type, entity_id, created_at DESC);

-- ============================================
-- Table: comment_likes
-- Tracks which users liked which comments
-- ============================================
CREATE TABLE IF NOT EXISTS comment_likes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    comment_id INTEGER NOT NULL,
    user_id TEXT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key to comments table
    FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE,
    
    -- Ensure a user can only like a comment once
    UNIQUE(comment_id, user_id)
);

-- Index for fast lookups by comment
CREATE INDEX IF NOT EXISTS idx_comment_likes_comment 
    ON comment_likes(comment_id);

-- Index for fast lookups by user
CREATE INDEX IF NOT EXISTS idx_comment_likes_user 
    ON comment_likes(user_id);

-- ============================================
-- Triggers
-- Automatically update like counts
-- ============================================

-- Increment like count when a like is added
CREATE TRIGGER IF NOT EXISTS increment_comment_likes
AFTER INSERT ON comment_likes
FOR EACH ROW
BEGIN
    UPDATE comments 
    SET likes = likes + 1 
    WHERE id = NEW.comment_id;
END;

-- Decrement like count when a like is removed
CREATE TRIGGER IF NOT EXISTS decrement_comment_likes
AFTER DELETE ON comment_likes
FOR EACH ROW
BEGIN
    UPDATE comments 
    SET likes = likes - 1 
    WHERE id = OLD.comment_id;
END;

-- Update the updated_at timestamp when a comment is modified
CREATE TRIGGER IF NOT EXISTS update_comment_timestamp
AFTER UPDATE ON comments
FOR EACH ROW
WHEN NEW.content != OLD.content
BEGIN
    UPDATE comments 
    SET updated_at = CURRENT_TIMESTAMP 
    WHERE id = NEW.id;
END;

-- ============================================
-- Views
-- Convenient views for common queries
-- ============================================

-- View: comments_with_user_likes
-- Shows comments with flag indicating if current user has liked
-- Usage: Replace :user_id with actual user ID in your queries
CREATE VIEW IF NOT EXISTS comments_with_details AS
SELECT 
    c.id,
    c.entity_type,
    c.entity_id,
    c.user_id,
    c.username,
    c.content,
    c.created_at,
    c.updated_at,
    c.likes,
    -- Count of replies (for future enhancement)
    0 as reply_count
FROM comments c;

-- ============================================
-- Sample Data (Optional - for testing)
-- Uncomment to insert sample data
-- ============================================

/*
-- Sample artist comment
INSERT INTO comments (entity_type, entity_id, user_id, username, content, created_at) 
VALUES 
    ('artist', 'artist-123', 'user1', 'MusicLover42', 'This artist is amazing! Their latest album is fire 🔥', datetime('now', '-2 hours')),
    ('artist', 'artist-123', 'user2', 'JazzFan', 'Been listening to them for years. True talent!', datetime('now', '-1 hour')),
    ('artist', 'artist-123', 'user3', 'VinylCollector', 'Just saw them live last week. Incredible performance!', datetime('now', '-30 minutes'));

-- Sample album comments
INSERT INTO comments (entity_type, entity_id, user_id, username, content, created_at) 
VALUES 
    ('album', 'album-456', 'user1', 'MusicLover42', 'This album is a masterpiece. Track 3 is my favorite!', datetime('now', '-3 hours')),
    ('album', 'album-456', 'user4', 'AudiophileJoe', 'The production quality is outstanding. Definitely in my top 10.', datetime('now', '-2 hours'));

-- Sample single comment
INSERT INTO comments (entity_type, entity_id, user_id, username, content, created_at) 
VALUES 
    ('single', 'single-789', 'user2', 'JazzFan', 'This single is on repeat! Can''t wait for the full album.', datetime('now', '-1 hour'));

-- Sample likes
INSERT INTO comment_likes (comment_id, user_id) 
VALUES 
    (1, 'user2'),
    (1, 'user3'),
    (1, 'user4'),
    (2, 'user1'),
    (3, 'user1'),
    (3, 'user2'),
    (4, 'user2'),
    (4, 'user3');
*/

-- ============================================
-- Utility Queries
-- Common queries you might need
-- ============================================

/*
-- Get all comments for an entity with user like status
SELECT 
    c.*,
    CASE WHEN cl.id IS NOT NULL THEN 1 ELSE 0 END as user_has_liked
FROM comments c
LEFT JOIN comment_likes cl ON c.id = cl.comment_id AND cl.user_id = :user_id
WHERE c.entity_type = :entity_type 
  AND c.entity_id = :entity_id
ORDER BY c.created_at DESC;

-- Get comment count by entity
SELECT entity_type, entity_id, COUNT(*) as comment_count
FROM comments
GROUP BY entity_type, entity_id;

-- Get most liked comments
SELECT c.*, c.likes
FROM comments c
WHERE c.entity_type = :entity_type 
  AND c.entity_id = :entity_id
ORDER BY c.likes DESC, c.created_at DESC
LIMIT 10;

-- Get user's comment history
SELECT c.*, c.likes
FROM comments c
WHERE c.user_id = :user_id
ORDER BY c.created_at DESC;

-- Get comment statistics
SELECT 
    COUNT(*) as total_comments,
    COUNT(DISTINCT user_id) as unique_commenters,
    SUM(likes) as total_likes,
    AVG(likes) as avg_likes_per_comment
FROM comments
WHERE entity_type = :entity_type 
  AND entity_id = :entity_id;
*/

-- ============================================
-- Maintenance Queries
-- ============================================

/*
-- Clean up orphaned likes (shouldn't happen with FK constraints, but just in case)
DELETE FROM comment_likes 
WHERE comment_id NOT IN (SELECT id FROM comments);

-- Recalculate like counts (in case they get out of sync)
UPDATE comments 
SET likes = (
    SELECT COUNT(*) 
    FROM comment_likes 
    WHERE comment_id = comments.id
);

-- Delete old comments (example: older than 1 year)
DELETE FROM comments 
WHERE created_at < datetime('now', '-1 year');

-- Get database statistics
SELECT 
    'comments' as table_name,
    COUNT(*) as row_count
FROM comments
UNION ALL
SELECT 
    'comment_likes' as table_name,
    COUNT(*) as row_count
FROM comment_likes;
*/

-- ============================================
-- Notes
-- ============================================

/*
Schema Design Decisions:

1. Entity Types: Limited to specific types via CHECK constraint
2. Content Length: Max 1000 characters enforced at DB level
3. Denormalized Likes: Stored as count for performance (updated via triggers)
4. Soft Deletes: Not implemented (hard deletes with CASCADE)
5. Timestamps: Using CURRENT_TIMESTAMP for consistency
6. Indexes: Optimized for common query patterns
7. Foreign Keys: Enabled for data integrity

Performance Considerations:

- Indexes on frequently queried columns
- Denormalized like count to avoid COUNT(*) queries
- Triggers maintain data consistency automatically
- Composite indexes for multi-column queries

Future Enhancements:

- Add replies/nested comments (parent_comment_id field)
- Add edit history (separate table)
- Add moderation flags (is_flagged, is_approved)
- Add user mentions (separate table)
- Add soft deletes (is_deleted, deleted_at)
*/
