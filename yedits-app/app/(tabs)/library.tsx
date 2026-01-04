import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import React, { useState } from 'react'
import {
  FlatList,
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
import { useAlbumList, usePlaylists, useStarredSongs } from '@/hooks/useQueries'
import { usePlayerStore } from '@/store/player.store'
import { IAlbum, IPlaylist, ISong } from '@/types/responses'

type LibraryTab = 'playlists' | 'albums' | 'artists' | 'songs'

export default function LibraryScreen() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<LibraryTab>('playlists')
  const [refreshing, setRefreshing] = useState(false)
  const { playSongList } = usePlayerStore()

  const {
    data: playlists,
    refetch: refetchPlaylists,
    isLoading: loadingPlaylists,
  } = usePlaylists()
  const {
    data: starred,
    refetch: refetchStarred,
    isLoading: loadingStarred,
  } = useStarredSongs()
  const {
    data: albums,
    refetch: refetchAlbums,
    isLoading: loadingAlbums,
  } = useAlbumList('alphabeticalByName', 0, 50)

  const onRefresh = async () => {
    setRefreshing(true)
    await Promise.all([refetchPlaylists(), refetchStarred(), refetchAlbums()])
    setRefreshing(false)
  }

  const handlePlaylistPress = (playlist: IPlaylist) => {
    router.push(`/playlist/${playlist.id}`)
  }

  const handleAlbumPress = (album: IAlbum) => {
    router.push(`/album/${album.id}`)
  }

  const handleSongPress = (songs: ISong[], index: number) => {
    playSongList(songs, index)
  }

  const tabs: {
    id: LibraryTab
    label: string
    icon: keyof typeof Ionicons.glyphMap
  }[] = [
    { id: 'playlists', label: 'Playlists', icon: 'list' },
    { id: 'albums', label: 'Albums', icon: 'disc' },
    { id: 'artists', label: 'Artists', icon: 'people' },
    { id: 'songs', label: 'Songs', icon: 'musical-notes' },
  ]

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Library</Text>
      </View>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, activeTab === tab.id && styles.activeTab]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Ionicons
              name={tab.icon}
              size={18}
              color={activeTab === tab.id ? '#fff' : 'rgba(255,255,255,0.5)'}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === tab.id && styles.activeTabText,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#6366f1"
          />
        }
      >
        {/* Playlists Tab */}
        {activeTab === 'playlists' && (
          <View style={styles.section}>
            {/* Create Playlist Button */}
            <TouchableOpacity style={styles.createButton}>
              <View style={styles.createIcon}>
                <Ionicons name="add" size={28} color="#6366f1" />
              </View>
              <View style={styles.createInfo}>
                <Text style={styles.createTitle}>Create Playlist</Text>
                <Text style={styles.createSubtitle}>
                  Add songs to a new playlist
                </Text>
              </View>
            </TouchableOpacity>

            {/* Favorites Section */}
            <TouchableOpacity style={styles.libraryItem}>
              <View style={[styles.itemIcon, { backgroundColor: '#f472b6' }]}>
                <Ionicons name="heart" size={24} color="#fff" />
              </View>
              <View style={styles.itemInfo}>
                <Text style={styles.itemTitle}>Favorites</Text>
                <Text style={styles.itemSubtitle}>
                  {starred?.song?.length || 0} songs
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color="rgba(255,255,255,0.3)"
              />
            </TouchableOpacity>

            {/* Playlists List */}
            {loadingPlaylists ? (
              <Text style={styles.loadingText}>Loading...</Text>
            ) : (
              playlists?.map((playlist: IPlaylist) => (
                <TouchableOpacity
                  key={playlist.id}
                  style={styles.libraryItem}
                  onPress={() => handlePlaylistPress(playlist)}
                >
                  <View style={styles.itemIcon}>
                    <Ionicons name="musical-notes" size={24} color="#6366f1" />
                  </View>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemTitle}>{playlist.name}</Text>
                    <Text style={styles.itemSubtitle}>
                      {playlist.songCount || 0} songs
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color="rgba(255,255,255,0.3)"
                  />
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        {/* Albums Tab */}
        {activeTab === 'albums' && (
          <View style={styles.albumGrid}>
            {loadingAlbums ? (
              <Text style={styles.loadingText}>Loading...</Text>
            ) : (
              <FlatList
                data={albums}
                numColumns={2}
                scrollEnabled={false}
                renderItem={({ item }) => (
                  <View style={styles.albumGridItem}>
                    <AlbumCard
                      album={item}
                      onPress={() => handleAlbumPress(item)}
                      size="medium"
                    />
                  </View>
                )}
                keyExtractor={(item) => item.id}
                columnWrapperStyle={styles.albumRow}
              />
            )}
          </View>
        )}

        {/* Songs Tab (Favorites) */}
        {activeTab === 'songs' && (
          <View style={styles.section}>
            {loadingStarred ? (
              <Text style={styles.loadingText}>Loading...</Text>
            ) : starred?.song?.length ? (
              starred.song.map((song: ISong, index: number) => (
                <SongRow
                  key={song.id}
                  song={song}
                  onPress={() => handleSongPress(starred.song!, index)}
                />
              ))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons
                  name="heart-outline"
                  size={48}
                  color="rgba(255,255,255,0.2)"
                />
                <Text style={styles.emptyText}>No favorite songs yet</Text>
                <Text style={styles.emptySubtext}>
                  Songs you love will appear here
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Artists Tab Placeholder */}
        {activeTab === 'artists' && (
          <View style={styles.emptyState}>
            <Ionicons
              name="people-outline"
              size={48}
              color="rgba(255,255,255,0.2)"
            />
            <Text style={styles.emptyText}>Artists coming soon</Text>
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
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    gap: 6,
  },
  activeTab: {
    backgroundColor: '#6366f1',
  },
  tabText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    fontWeight: '500',
  },
  activeTabText: {
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 20,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  createIcon: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  createInfo: {
    flex: 1,
  },
  createTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 2,
  },
  createSubtitle: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
  },
  libraryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  itemIcon: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  itemInfo: {
    flex: 1,
  },
  itemTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  itemSubtitle: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
  },
  albumGrid: {
    paddingHorizontal: 16,
  },
  albumGridItem: {
    width: '50%',
    paddingHorizontal: 4,
    marginBottom: 16,
  },
  albumRow: {
    justifyContent: 'flex-start',
  },
  loadingText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 40,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
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
    height: 180,
  },
})
