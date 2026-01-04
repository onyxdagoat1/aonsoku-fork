import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import React from 'react'
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
import { useAlbumList, useRandomSongs } from '@/hooks/useQueries'
import { usePlayerStore } from '@/store/player.store'
import { IAlbum, ISong } from '@/types/responses'

function SectionHeader({
  title,
  onSeeAll,
}: {
  title: string
  onSeeAll?: () => void
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {onSeeAll && (
        <TouchableOpacity onPress={onSeeAll} style={styles.seeAllButton}>
          <Text style={styles.seeAllText}>See All</Text>
          <Ionicons name="chevron-forward" size={16} color="#6366f1" />
        </TouchableOpacity>
      )}
    </View>
  )
}

export default function HomeScreen() {
  const router = useRouter()
  const { playSongList } = usePlayerStore()

  // Fetch data
  const {
    data: recentAlbums,
    isLoading: loadingRecent,
    refetch: refetchRecent,
  } = useAlbumList('recent', 0, 10)

  const {
    data: newestAlbums,
    isLoading: loadingNewest,
    refetch: refetchNewest,
  } = useAlbumList('newest', 0, 10)

  const {
    data: randomSongs,
    isLoading: loadingRandom,
    refetch: refetchRandom,
  } = useRandomSongs(10)

  const [refreshing, setRefreshing] = React.useState(false)

  const onRefresh = async () => {
    setRefreshing(true)
    await Promise.all([refetchRecent(), refetchNewest(), refetchRandom()])
    setRefreshing(false)
  }

  const handleAlbumPress = (album: IAlbum) => {
    router.push(`/album/${album.id}`)
  }

  const handleSongPress = (songs: ISong[], index: number) => {
    playSongList(songs, index)
  }

  const handleSettingsPress = () => {
    router.push('/settings')
  }

  const renderAlbumItem = ({ item }: { item: IAlbum }) => (
    <AlbumCard
      album={item}
      onPress={() => handleAlbumPress(item)}
      size="medium"
    />
  )

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#6366f1"
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good Evening</Text>
            <Text style={styles.headerTitle}>Listen Now</Text>
          </View>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={handleSettingsPress}
          >
            <Ionicons name="person-circle-outline" size={32} color="#6366f1" />
          </TouchableOpacity>
        </View>

        {/* Recently Played */}
        <View style={styles.section}>
          <SectionHeader title="Recently Played" onSeeAll={() => {}} />
          {loadingRecent ? (
            <View style={styles.loadingPlaceholder}>
              <Text style={styles.loadingText}>Loading...</Text>
            </View>
          ) : (
            <FlatList
              horizontal
              data={recentAlbums || []}
              renderItem={renderAlbumItem}
              keyExtractor={(item) => item.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
            />
          )}
        </View>

        {/* New Releases */}
        <View style={styles.section}>
          <SectionHeader title="New Releases" onSeeAll={() => {}} />
          {loadingNewest ? (
            <View style={styles.loadingPlaceholder}>
              <Text style={styles.loadingText}>Loading...</Text>
            </View>
          ) : (
            <FlatList
              horizontal
              data={newestAlbums || []}
              renderItem={renderAlbumItem}
              keyExtractor={(item) => item.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
            />
          )}
        </View>

        {/* Quick Picks */}
        <View style={styles.section}>
          <SectionHeader title="Quick Picks" />
          <View style={styles.songList}>
            {loadingRandom ? (
              <View style={styles.loadingPlaceholder}>
                <Text style={styles.loadingText}>Loading...</Text>
              </View>
            ) : (
              randomSongs
                ?.slice(0, 5)
                .map((song: ISong, index: number) => (
                  <SongRow
                    key={song.id}
                    song={song}
                    onPress={() => handleSongPress(randomSongs, index)}
                  />
                ))
            )}
          </View>
        </View>

        {/* Bottom padding for mini player */}
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  greeting: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    marginBottom: 4,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '700',
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  seeAllText: {
    color: '#6366f1',
    fontSize: 14,
    fontWeight: '500',
  },
  horizontalList: {
    paddingLeft: 20,
    paddingRight: 4,
  },
  songList: {
    paddingHorizontal: 4,
  },
  loadingPlaceholder: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 14,
  },
  bottomPadding: {
    height: 180, // Space for mini player + tab bar
  },
})
