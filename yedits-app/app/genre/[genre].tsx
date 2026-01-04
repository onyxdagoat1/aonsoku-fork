import { Ionicons } from '@expo/vector-icons'
import { useQuery } from '@tanstack/react-query'
import * as Haptics from 'expo-haptics'
import { useLocalSearchParams, useRouter } from 'expo-router'
import React from 'react'
import {
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'

import { SongRow } from '@/components/cards/SongRow'
import { subsonic } from '@/service/subsonic'
import { usePlayerStore } from '@/store/player.store'
import { ISong } from '@/types/responses'

export default function GenreSongsScreen() {
  const { genre } = useLocalSearchParams<{ genre: string }>()
  const router = useRouter()
  const { playSongList, currentSong } = usePlayerStore()

  const {
    data: songs,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['songs', 'byGenre', genre],
    queryFn: () => subsonic.getSongsByGenre(genre!, 100),
    enabled: !!genre,
  })

  const handlePlayAll = () => {
    if (songs && songs.length > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
      playSongList(songs, 0)
    }
  }

  const handleShuffleAll = () => {
    if (songs && songs.length > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
      playSongList(songs, 0, true)
    }
  }

  const handleSongPress = (songList: ISong[], index: number) => {
    playSongList(songList, index)
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor="#6366f1"
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={styles.headerLabel}>Genre</Text>
            <Text style={styles.headerTitle}>{genre}</Text>
          </View>
        </View>

        {/* Actions */}
        {songs && songs.length > 0 && (
          <View style={styles.actions}>
            <TouchableOpacity style={styles.playButton} onPress={handlePlayAll}>
              <Ionicons name="play" size={20} color="#fff" />
              <Text style={styles.playButtonText}>Play</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.shuffleButton}
              onPress={handleShuffleAll}
            >
              <Ionicons name="shuffle" size={20} color="#6366f1" />
            </TouchableOpacity>
          </View>
        )}

        {/* Songs */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading songs...</Text>
          </View>
        ) : songs && songs.length > 0 ? (
          <View style={styles.songList}>
            <Text style={styles.songCount}>{songs.length} songs</Text>
            {songs.map((song: ISong, index: number) => (
              <SongRow
                key={`${song.id}-${index}`}
                song={song}
                showArtwork
                isActive={currentSong?.id === song.id}
                onPress={() => handleSongPress(songs, index)}
              />
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons
              name="musical-notes-outline"
              size={48}
              color="rgba(255,255,255,0.2)"
            />
            <Text style={styles.emptyText}>No songs found in this genre</Text>
          </View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0f',
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  headerLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 20,
    gap: 12,
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366f1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
  },
  playButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  shuffleButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  loadingText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 16,
  },
  songList: {
    paddingHorizontal: 8,
  },
  songCount: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 100,
    gap: 12,
  },
  emptyText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 16,
  },
  bottomPadding: {
    height: 160,
  },
})
