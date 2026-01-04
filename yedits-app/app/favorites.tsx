import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
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
import { AlbumCard } from '@/components/cards/AlbumCard'
import { SongRow } from '@/components/cards/SongRow'
import { useStarredSongs } from '@/hooks/useQueries'
import { usePlayerStore } from '@/store/player.store'

export default function FavoritesScreen() {
  const router = useRouter()
  const { data: starred, isLoading, refetch, isRefetching } = useStarredSongs()
  const { playSongList, currentSong } = usePlayerStore()

  const songs = starred?.song || []
  const albums = starred?.album || []

  const handlePlayAll = () => {
    if (songs.length > 0) {
      playSongList(songs, 0)
    }
  }

  const handleSongPress = (index: number) => {
    playSongList(songs, index)
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
          <Text style={styles.headerTitle}>Favorites</Text>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading favorites...</Text>
          </View>
        ) : (
          <>
            {/* Favorite Songs */}
            {songs.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View>
                    <Text style={styles.sectionTitle}>Songs</Text>
                    <Text style={styles.sectionCount}>
                      {songs.length} songs
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.playAllButton}
                    onPress={handlePlayAll}
                  >
                    <Ionicons name="play" size={18} color="#fff" />
                    <Text style={styles.playAllText}>Play All</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.songList}>
                  {songs.slice(0, 50).map((song, index) => (
                    <SongRow
                      key={song.id}
                      song={song}
                      showArtwork
                      isActive={currentSong?.id === song.id}
                      onPress={() => handleSongPress(index)}
                    />
                  ))}
                </View>
              </View>
            )}

            {/* Favorite Albums */}
            {albums.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Albums</Text>
                <Text style={styles.sectionCount}>{albums.length} albums</Text>

                <View style={styles.albumGrid}>
                  {albums.map((album) => (
                    <View key={album.id} style={styles.albumItem}>
                      <AlbumCard
                        album={album}
                        onPress={() => router.push(`/album/${album.id}`)}
                        size="medium"
                      />
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Empty State */}
            {songs.length === 0 && albums.length === 0 && (
              <View style={styles.emptyState}>
                <Ionicons
                  name="heart-outline"
                  size={64}
                  color="rgba(255,255,255,0.2)"
                />
                <Text style={styles.emptyTitle}>No Favorites Yet</Text>
                <Text style={styles.emptySubtitle}>
                  Star songs and albums to add them here
                </Text>
              </View>
            )}
          </>
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
  headerTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
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
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    paddingHorizontal: 20,
  },
  sectionCount: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    paddingHorizontal: 20,
    marginTop: 2,
  },
  playAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366f1',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
  },
  playAllText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  songList: {
    paddingHorizontal: 8,
  },
  albumGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
  },
  albumItem: {
    width: '50%',
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 100,
    gap: 12,
  },
  emptyTitle: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 20,
    fontWeight: '600',
  },
  emptySubtitle: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 15,
    textAlign: 'center',
  },
  bottomPadding: {
    height: 160,
  },
})
