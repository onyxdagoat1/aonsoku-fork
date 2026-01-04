import React, { useCallback } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Image, 
  StyleSheet, 
  Dimensions,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { usePlayerStore, useCurrentSong, useIsPlaying } from '@/store/player.store';
import { subsonic } from '@/service/subsonic';
import { LoopState } from '@/types/playerContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const ARTWORK_SIZE = SCREEN_WIDTH - 80;

interface FullPlayerProps {
  onClose?: () => void;
}

export function FullPlayer({ onClose }: FullPlayerProps) {
  const currentSong = useCurrentSong();
  const isPlaying = useIsPlaying();
  const { 
    togglePlayPause, 
    skipToNext, 
    skipToPrevious,
    seekTo,
    toggleLoop,
    toggleShuffle,
    progress, 
    duration,
    loopState,
    isShuffleActive,
    currentSongColor,
    setQueueOpen,
    setLyricsOpen,
  } = usePlayerStore();
  
  if (!currentSong) {
    return null;
  }
  
  const coverArtUrl = currentSong.coverArt 
    ? subsonic.getCoverArtUrl(currentSong.coverArt, 800) 
    : null;
  
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  const handlePlayPause = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await togglePlayPause();
  };
  
  const handleNext = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await skipToNext();
  };
  
  const handlePrevious = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await skipToPrevious();
  };
  
  const handleSeek = async (value: number) => {
    await seekTo(value);
  };
  
  const handleToggleLoop = () => {
    Haptics.selectionAsync();
    toggleLoop();
  };
  
  const handleToggleShuffle = () => {
    Haptics.selectionAsync();
    toggleShuffle();
  };
  
  const getLoopIcon = (): keyof typeof Ionicons.glyphMap => {
    switch (loopState) {
      case LoopState.One:
        return 'repeat';
      case LoopState.All:
        return 'repeat';
      default:
        return 'repeat';
    }
  };
  
  const gradientColors = currentSongColor 
    ? [currentSongColor, '#0a0a0f', '#0a0a0f']
    : ['#1a1a24', '#0a0a0f', '#0a0a0f'];
  
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <LinearGradient
        colors={gradientColors as any}
        style={styles.gradient}
        locations={[0, 0.5, 1]}
      >
        <SafeAreaView style={styles.safeArea}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.headerButton}>
              <Ionicons name="chevron-down" size={28} color="#fff" />
            </TouchableOpacity>
            
            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>NOW PLAYING</Text>
              <Text style={styles.headerSubtitle} numberOfLines={1}>
                {currentSong.album || 'Unknown Album'}
              </Text>
            </View>
            
            <TouchableOpacity style={styles.headerButton}>
              <Ionicons name="ellipsis-horizontal" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          
          {/* Artwork */}
          <View style={styles.artworkContainer}>
            {coverArtUrl ? (
              <Image 
                source={{ uri: coverArtUrl }} 
                style={styles.artwork}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.artworkPlaceholder}>
                <Ionicons name="musical-notes" size={120} color="#6366f1" />
              </View>
            )}
          </View>
          
          {/* Song Info */}
          <View style={styles.songInfo}>
            <View style={styles.titleRow}>
              <View style={styles.titleContainer}>
                <Text style={styles.title} numberOfLines={1}>
                  {currentSong.title}
                </Text>
                <Text style={styles.artist} numberOfLines={1}>
                  {currentSong.artist || 'Unknown Artist'}
                </Text>
              </View>
              <TouchableOpacity style={styles.likeButton}>
                <Ionicons 
                  name={currentSong.starred ? 'heart' : 'heart-outline'} 
                  size={28} 
                  color={currentSong.starred ? '#f472b6' : 'rgba(255,255,255,0.6)'} 
                />
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Progress Slider */}
          <View style={styles.progressSection}>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={duration || 1}
              value={progress}
              onSlidingComplete={handleSeek}
              minimumTrackTintColor="#6366f1"
              maximumTrackTintColor="rgba(255,255,255,0.2)"
              thumbTintColor="#fff"
            />
            <View style={styles.timeRow}>
              <Text style={styles.timeText}>{formatTime(progress)}</Text>
              <Text style={styles.timeText}>{formatTime(duration)}</Text>
            </View>
          </View>
          
          {/* Main Controls */}
          <View style={styles.mainControls}>
            <TouchableOpacity 
              onPress={handleToggleShuffle} 
              style={styles.secondaryButton}
            >
              <Ionicons 
                name="shuffle" 
                size={24} 
                color={isShuffleActive ? '#6366f1' : 'rgba(255,255,255,0.6)'} 
              />
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={handlePrevious} 
              style={styles.skipButton}
            >
              <Ionicons name="play-skip-back" size={32} color="#fff" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={handlePlayPause} 
              style={styles.playButton}
            >
              <Ionicons 
                name={isPlaying ? 'pause' : 'play'} 
                size={40} 
                color="#0a0a0f" 
              />
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={handleNext} 
              style={styles.skipButton}
            >
              <Ionicons name="play-skip-forward" size={32} color="#fff" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={handleToggleLoop} 
              style={styles.secondaryButton}
            >
              <View>
                <Ionicons 
                  name={getLoopIcon()} 
                  size={24} 
                  color={loopState !== LoopState.Off ? '#6366f1' : 'rgba(255,255,255,0.6)'} 
                />
                {loopState === LoopState.One && (
                  <Text style={styles.loopOneIndicator}>1</Text>
                )}
              </View>
            </TouchableOpacity>
          </View>
          
          {/* Bottom Controls */}
          <View style={styles.bottomControls}>
            <TouchableOpacity 
              onPress={() => setLyricsOpen(true)}
              style={styles.bottomButton}
            >
              <Ionicons name="text" size={22} color="rgba(255,255,255,0.6)" />
              <Text style={styles.bottomButtonText}>Lyrics</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.bottomButton}>
              <Ionicons name="share-outline" size={22} color="rgba(255,255,255,0.6)" />
              <Text style={styles.bottomButtonText}>Share</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={() => setQueueOpen(true)}
              style={styles.bottomButton}
            >
              <Ionicons name="list" size={22} color="rgba(255,255,255,0.6)" />
              <Text style={styles.bottomButtonText}>Queue</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0f',
  },
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.5,
  },
  headerSubtitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 2,
  },
  artworkContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 32,
  },
  artwork: {
    width: ARTWORK_SIZE,
    height: ARTWORK_SIZE,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 20,
  },
  artworkPlaceholder: {
    width: ARTWORK_SIZE,
    height: ARTWORK_SIZE,
    borderRadius: 16,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  songInfo: {
    marginBottom: 24,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  titleContainer: {
    flex: 1,
    marginRight: 16,
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  artist: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 18,
  },
  likeButton: {
    padding: 4,
  },
  progressSection: {
    marginBottom: 24,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -8,
  },
  timeText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    fontWeight: '500',
  },
  mainControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    marginBottom: 40,
  },
  secondaryButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  skipButton: {
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  loopOneIndicator: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    fontSize: 10,
    fontWeight: '700',
    color: '#6366f1',
  },
  bottomControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingBottom: 20,
  },
  bottomButton: {
    alignItems: 'center',
    gap: 4,
  },
  bottomButtonText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
  },
});
