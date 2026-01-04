import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { ISong } from '@/types/responses';
import { subsonic } from '@/service/subsonic';
import { usePlayerStore } from '@/store/player.store';

interface SongRowProps {
  song: ISong;
  index?: number;
  showIndex?: boolean;
  showArtwork?: boolean;
  isActive?: boolean;
  onPress?: () => void;
  onOptionsPress?: () => void;
}

export function SongRow({ 
  song, 
  index, 
  showIndex = false, 
  showArtwork = true,
  isActive = false,
  onPress,
  onOptionsPress,
}: SongRowProps) {
  const coverArtUrl = song.coverArt 
    ? subsonic.getCoverArtUrl(song.coverArt, 100) 
    : null;
  
  const formatDuration = (seconds?: number): string => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  const handlePress = () => {
    Haptics.selectionAsync();
    onPress?.();
  };
  
  return (
    <TouchableOpacity 
      style={[styles.container, isActive && styles.activeContainer]} 
      onPress={handlePress}
      activeOpacity={0.7}
    >
      {/* Index or Artwork */}
      {showIndex && index !== undefined ? (
        <View style={styles.indexContainer}>
          {isActive ? (
            <Ionicons name="volume-high" size={16} color="#6366f1" />
          ) : (
            <Text style={styles.index}>{index + 1}</Text>
          )}
        </View>
      ) : showArtwork && (
        <View style={styles.artworkContainer}>
          {coverArtUrl ? (
            <Image source={{ uri: coverArtUrl }} style={styles.artwork} />
          ) : (
            <View style={styles.artworkPlaceholder}>
              <Ionicons name="musical-note" size={20} color="#6366f1" />
            </View>
          )}
          {isActive && (
            <View style={styles.playingIndicator}>
              <Ionicons name="volume-high" size={14} color="#fff" />
            </View>
          )}
        </View>
      )}
      
      {/* Song Info */}
      <View style={styles.info}>
        <Text 
          style={[styles.title, isActive && styles.activeTitle]} 
          numberOfLines={1}
        >
          {song.title}
        </Text>
        <Text style={styles.artist} numberOfLines={1}>
          {song.artist || 'Unknown Artist'}
        </Text>
      </View>
      
      {/* Duration */}
      <Text style={styles.duration}>
        {formatDuration(song.duration)}
      </Text>
      
      {/* Options Button */}
      <TouchableOpacity 
        style={styles.optionsButton}
        onPress={onOptionsPress}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="ellipsis-horizontal" size={20} color="rgba(255,255,255,0.4)" />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  activeContainer: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderRadius: 8,
    marginHorizontal: 8,
    paddingHorizontal: 8,
  },
  indexContainer: {
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  index: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 14,
    fontWeight: '500',
  },
  artworkContainer: {
    width: 48,
    height: 48,
    borderRadius: 6,
    overflow: 'hidden',
    marginRight: 12,
  },
  artwork: {
    width: '100%',
    height: '100%',
  },
  artworkPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playingIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(99, 102, 241, 0.9)',
    paddingVertical: 2,
    alignItems: 'center',
  },
  info: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 2,
  },
  activeTitle: {
    color: '#6366f1',
  },
  artist: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
  },
  duration: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 13,
    marginRight: 8,
  },
  optionsButton: {
    padding: 8,
  },
});
