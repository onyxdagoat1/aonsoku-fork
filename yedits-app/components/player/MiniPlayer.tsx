import { Ionicons } from '@expo/vector-icons'
import { BlurView } from 'expo-blur'
import * as Haptics from 'expo-haptics'
import { LinearGradient } from 'expo-linear-gradient'
import React from 'react'
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { subsonic } from '@/service/subsonic'
import {
  useCurrentSong,
  useIsPlaying,
  usePlayerStore,
} from '@/store/player.store'

interface MiniPlayerProps {
  onPress?: () => void
}

export function MiniPlayer({ onPress }: MiniPlayerProps) {
  const currentSong = useCurrentSong()
  const isPlaying = useIsPlaying()
  const { togglePlayPause, skipToNext, isPlayerVisible, progress, duration } =
    usePlayerStore()

  if (!isPlayerVisible || !currentSong) {
    return null
  }

  const coverArtUrl = currentSong.coverArt
    ? subsonic.getCoverArtUrl(currentSong.coverArt, 200)
    : null

  const progressPercent = duration > 0 ? (progress / duration) * 100 : 0

  const handlePlayPause = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    await togglePlayPause()
  }

  const handleNext = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    await skipToNext()
  }

  return (
    <Pressable onPress={onPress} style={styles.container}>
      <BlurView intensity={90} tint="dark" style={styles.blurContainer}>
        {/* Progress bar at top */}
        <View style={styles.progressContainer}>
          <View
            style={[styles.progressBar, { width: `${progressPercent}%` }]}
          />
        </View>

        <View style={styles.content}>
          {/* Album Art */}
          <View style={styles.artContainer}>
            {coverArtUrl ? (
              <Image source={{ uri: coverArtUrl }} style={styles.artwork} />
            ) : (
              <View style={styles.artworkPlaceholder}>
                <Ionicons name="musical-notes" size={24} color="#6366f1" />
              </View>
            )}
          </View>

          {/* Song Info */}
          <View style={styles.info}>
            <Text style={styles.title} numberOfLines={1}>
              {currentSong.title}
            </Text>
            <Text style={styles.artist} numberOfLines={1}>
              {currentSong.artist || 'Unknown Artist'}
            </Text>
          </View>

          {/* Controls */}
          <View style={styles.controls}>
            <TouchableOpacity
              onPress={handlePlayPause}
              style={styles.playButton}
              activeOpacity={0.7}
            >
              <Ionicons
                name={isPlaying ? 'pause' : 'play'}
                size={28}
                color="#fff"
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleNext}
              style={styles.nextButton}
              activeOpacity={0.7}
            >
              <Ionicons name="play-forward" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </BlurView>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 80, // Above tab bar
    left: 8,
    right: 8,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  blurContainer: {
    overflow: 'hidden',
    borderRadius: 16,
  },
  progressContainer: {
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.1)',
    width: '100%',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#6366f1',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingTop: 10,
  },
  artContainer: {
    width: 48,
    height: 48,
    borderRadius: 8,
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
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  artist: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  playButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(99, 102, 241, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
})
