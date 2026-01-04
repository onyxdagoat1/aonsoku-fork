import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput,
  FlatList,
  StyleSheet, 
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { format } from 'date-fns';

import { useSongComments, useAddComment, useDeleteComment, Comment } from '@/hooks/useSocial';
import { isSupabaseConfigured } from '@/lib/supabase';

interface CommentsListProps {
  songId?: string;
  albumId?: string;
  artistId?: string;
}

export function CommentsList({ songId, albumId, artistId }: CommentsListProps) {
  const [newComment, setNewComment] = useState('');
  
  const { data: comments, isLoading } = useSongComments(songId || '');
  const addCommentMutation = useAddComment();
  const deleteCommentMutation = useDeleteComment();

  const handleSubmit = async () => {
    if (!newComment.trim()) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    try {
      await addCommentMutation.mutateAsync({
        content: newComment.trim(),
        songId,
        albumId,
        artistId,
      });
      setNewComment('');
    } catch (error) {
      console.error('Failed to add comment:', error);
    }
  };

  const handleDelete = async (commentId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await deleteCommentMutation.mutateAsync(commentId);
    } catch (error) {
      console.error('Failed to delete comment:', error);
    }
  };

  if (!isSupabaseConfigured()) {
    return (
      <View style={styles.disabledContainer}>
        <Ionicons name="chatbubbles-outline" size={32} color="rgba(255,255,255,0.2)" />
        <Text style={styles.disabledText}>Comments not available</Text>
      </View>
    );
  }

  const renderComment = ({ item }: { item: Comment }) => (
    <View style={styles.commentItem}>
      <View style={styles.avatar}>
        <Ionicons name="person" size={18} color="#6366f1" />
      </View>
      <View style={styles.commentContent}>
        <View style={styles.commentHeader}>
          <Text style={styles.username}>
            {item.user?.username || 'Anonymous'}
          </Text>
          <Text style={styles.timestamp}>
            {format(new Date(item.created_at), 'MMM d, h:mm a')}
          </Text>
        </View>
        <Text style={styles.commentText}>{item.content}</Text>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <Text style={styles.title}>Comments</Text>
      
      {isLoading ? (
        <ActivityIndicator color="#6366f1" style={styles.loader} />
      ) : comments && comments.length > 0 ? (
        <FlatList
          data={comments}
          renderItem={renderComment}
          keyExtractor={(item) => item.id}
          style={styles.list}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No comments yet</Text>
          <Text style={styles.emptySubtext}>Be the first to comment!</Text>
        </View>
      )}
      
      {/* Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Add a comment..."
          placeholderTextColor="rgba(255,255,255,0.3)"
          value={newComment}
          onChangeText={setNewComment}
          multiline
          maxLength={500}
        />
        <TouchableOpacity 
          style={[styles.sendButton, !newComment.trim() && styles.sendButtonDisabled]}
          onPress={handleSubmit}
          disabled={!newComment.trim() || addCommentMutation.isPending}
        >
          {addCommentMutation.isPending ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Ionicons name="send" size={20} color="#fff" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 16,
    padding: 16,
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  disabledContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 8,
  },
  disabledText: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 14,
  },
  loader: {
    paddingVertical: 32,
  },
  list: {
    flex: 1,
    marginBottom: 16,
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  username: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  timestamp: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
  },
  commentText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    lineHeight: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 16,
  },
  emptySubtext: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 13,
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 24,
    paddingLeft: 16,
    paddingRight: 6,
    paddingVertical: 6,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 15,
    maxHeight: 100,
    paddingVertical: 8,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: 'rgba(99, 102, 241, 0.3)',
  },
});
