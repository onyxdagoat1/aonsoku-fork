import { Ionicons } from '@expo/vector-icons'
import { BlurView } from 'expo-blur'
import * as Haptics from 'expo-haptics'
import { LinearGradient } from 'expo-linear-gradient'
import { useLocalSearchParams, useRouter } from 'expo-router'
import React from 'react'
import {
  Alert,
  Dimensions,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'

import { SongRow } from '@/components/cards/SongRow'
import { useDeletePlaylist, usePlaylist } from '@/hooks/useQueries'
import { subsonic } from '@/service/subsonic'
import { usePlayerStore } from '@/store/player.store'
import { ISong } from '@/types/responses'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const ARTWORK_SIZE = SCREEN_WIDTH - 120

export default function PlaylistDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { playSongList, currentSong } = usePlayerStore()
  const deletePlaylistMutation = useDeletePlaylist()

  const { data: playlist, isLoading } = usePlaylist(id!)

  const handlePlayAll = () => {
    if (playlist?.entry) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
      playSongList(playlist.entry, 0)
    }
  }

  const handleShuffleAll = () => {
    if (playlist?.entry) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
      playSongList(playlist.entry, 0, true)
    }
  }

  const handleSongPress = (songs: ISong[], index: number) => {
    playSongList(songs, index)
  }

  const handleDeletePlaylist = () => {
    Alert.alert(
      'Delete Playlist',
      `Are you sure you want to delete "${playlist?.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePlaylistMutation.mutateAsync(id!)
              router.back()
            } catch (e) {
              Alert.alert('Error', 'Failed to delete playlist')
            }
          },
        },
      ],
    )
  }

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    )
  }

  if (!playlist) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Playlist not found</Text>
      </View>
    )
  }

  const coverArtUrl = playlist.coverArt
    ? subsonic.getCoverArtUrl(playlist.coverArt, 600)
    : null

  const totalDuration =
    playlist.entry?.reduce((acc, song) => acc + (song.duration || 0), 0) || 0
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    if (hours > 0) {
      return `${hours} hr ${mins} min`
    }
    return `${mins} min`
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header with Back Button */}
        <SafeAreaView style={styles.headerSafe}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <BlurView
                intensity={80}
                tint="dark"
                style={styles.backButtonBlur}
              >
                <Ionicons name="chevron-back" size={24} color="#fff" />
              </BlurView>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.moreButton}
              onPress={handleDeletePlaylist}
            >
              <Ionicons name="trash-outline" size={22} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>

        {/* Playlist Art */}
        <View style={styles.artworkContainer}>
          {coverArtUrl ? (
            <Image
              source={{ uri: coverArtUrl }}
              style={styles.artwork}
              resizeMode="cover"
            />
          ) : (
            <LinearGradient
              colors={['#6366f1', '#8b5cf6']}
              style={styles.artworkPlaceholder}
            >
              <Ionicons
                name="musical-notes"
                size={80}
                color="rgba(255,255,255,0.8)"
              />
            </LinearGradient>
          )}
        </View>

        {/* Playlist Info */}
        <View style={styles.playlistInfo}>
          <Text style={styles.playlistTitle} numberOfLines={2}>
            {playlist.name}
          </Text>
          {playlist.comment && (
            <Text style={styles.playlistDescription} numberOfLines={2}>
              {playlist.comment}
            </Text>
          )}
          <Text style={styles.playlistMeta}>
            {playlist.songCount || playlist.entry?.length || 0} songs •{' '}
            {formatDuration(totalDuration)}
          </Text>
          {playlist.owner && (
            <Text style={styles.playlistOwner}>by {playlist.owner}</Text>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.playButton} onPress={handlePlayAll}>
            <Ionicons name="play" size={24} color="#fff" />
            <Text style={styles.playButtonText}>Play</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.shuffleButton}
            onPress={handleShuffleAll}
          >
            <Ionicons name="shuffle" size={22} color="#6366f1" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.shuffleButton}>
            <Ionicons
              name="download-outline"
              size={22}
              color="rgba(255,255,255,0.6)"
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.shuffleButton}>
            <Ionicons
              name="share-outline"
              size={22}
              color="rgba(255,255,255,0.6)"
            />
          </TouchableOpacity>
        </View>

        {/* Track List */}
        <View style={styles.trackList}>
          {playlist.entry?.map((song: ISong, index: number) => (
            <SongRow
              key={`${song.id}-${index}`}
              song={song}
              index={index}
              showIndex
              showArtwork={false}
              isActive={currentSong?.id === song.id}
              onPress={() => handleSongPress(playlist.entry!, index)}
            />
          ))}
        </View>

        {/* Empty state */}
        {(!playlist.entry || playlist.entry.length === 0) && (
          <View style={styles.emptyState}>
            <Ionicons
              name="musical-notes-outline"
              size={48}
              color="rgba(255,255,255,0.2)"
            />
            <Text style={styles.emptyText}>This playlist is empty</Text>
            <Text style={styles.emptySubtext}>Add songs to get started</Text>
          </View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0f',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0a0a0f',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  headerSafe: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  backButton: {
    overflow: 'hidden',
    borderRadius: 20,
  },
  backButtonBlur: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  artworkContainer: {
    alignItems: 'center',
    marginTop: 80,
    marginBottom: 24,
  },
  artwork: {
    width: ARTWORK_SIZE,
    height: ARTWORK_SIZE,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 20,
  },
  artworkPlaceholder: {
    width: ARTWORK_SIZE,
    height: ARTWORK_SIZE,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playlistInfo: {
    paddingHorizontal: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  playlistTitle: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  playlistDescription: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 8,
  },
  playlistMeta: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    marginBottom: 4,
  },
  playlistOwner: {
    color: '#6366f1',
    fontSize: 14,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    marginBottom: 24,
    gap: 16,
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366f1',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 28,
    gap: 8,
  },
  playButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  shuffleButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  trackList: {
    paddingHorizontal: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 18,
    fontWeight: '600',
  },
  emptySubtext: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 14,
  },
  bottomPadding: {
    height: 160,
  },
})
