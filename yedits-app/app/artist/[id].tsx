import { Ionicons } from '@expo/vector-icons'
import { BlurView } from 'expo-blur'
import * as Haptics from 'expo-haptics'
import { LinearGradient } from 'expo-linear-gradient'
import { useLocalSearchParams, useRouter } from 'expo-router'
import React from 'react'
import {
  Dimensions,
  FlatList,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'

import { AlbumCard } from '@/components/cards/AlbumCard'
import { useArtist } from '@/hooks/useQueries'
import { subsonic } from '@/service/subsonic'
import { usePlayerStore } from '@/store/player.store'
import { IAlbum } from '@/types/responses'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

export default function ArtistDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { playSongList } = usePlayerStore()

  const { data: artist, isLoading } = useArtist(id!)

  const handleAlbumPress = (album: IAlbum) => {
    router.push(`/album/${album.id}`)
  }

  const handlePlayAll = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    // Get all songs from all albums
    if (artist?.album) {
      const allSongs: any[] = []
      for (const album of artist.album) {
        try {
          const albumData = await subsonic.getAlbum(album.id)
          if (albumData?.song) {
            allSongs.push(...albumData.song)
          }
        } catch (e) {
          console.error('Failed to get album:', e)
        }
      }
      if (allSongs.length > 0) {
        playSongList(allSongs, 0)
      }
    }
  }

  const handleShuffleAll = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    if (artist?.album) {
      const allSongs: any[] = []
      for (const album of artist.album) {
        try {
          const albumData = await subsonic.getAlbum(album.id)
          if (albumData?.song) {
            allSongs.push(...albumData.song)
          }
        } catch (e) {
          console.error('Failed to get album:', e)
        }
      }
      if (allSongs.length > 0) {
        playSongList(allSongs, 0, true)
      }
    }
  }

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    )
  }

  if (!artist) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Artist not found</Text>
      </View>
    )
  }

  const coverArtUrl = artist.coverArt
    ? subsonic.getCoverArtUrl(artist.coverArt, 600)
    : null

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
          </View>
        </SafeAreaView>

        {/* Artist Image / Header */}
        <LinearGradient
          colors={['#6366f1', '#0a0a0f']}
          style={styles.heroSection}
        >
          <View style={styles.artistImageContainer}>
            {coverArtUrl ? (
              <Image source={{ uri: coverArtUrl }} style={styles.artistImage} />
            ) : (
              <View style={styles.artistImagePlaceholder}>
                <Ionicons name="person" size={80} color="#6366f1" />
              </View>
            )}
          </View>

          <Text style={styles.artistName}>{artist.name}</Text>
          <Text style={styles.artistMeta}>
            {artist.albumCount || artist.album?.length || 0} albums
          </Text>
        </LinearGradient>

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
              name="heart-outline"
              size={22}
              color="rgba(255,255,255,0.6)"
            />
          </TouchableOpacity>
        </View>

        {/* Albums Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Albums</Text>
          <View style={styles.albumGrid}>
            {artist.album?.map((album: IAlbum) => (
              <View key={album.id} style={styles.albumGridItem}>
                <AlbumCard
                  album={album}
                  onPress={() => handleAlbumPress(album)}
                  size="medium"
                />
              </View>
            ))}
          </View>
        </View>

        {/* Biography if available */}
        {artist.biography && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.biography}>{artist.biography}</Text>
          </View>
        )}

        {/* Similar Artists */}
        {artist.similarArtist && artist.similarArtist.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Similar Artists</Text>
            <FlatList
              horizontal
              data={artist.similarArtist}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.similarArtist}
                  onPress={() => router.push(`/artist/${item.id}`)}
                >
                  <View style={styles.similarArtistImage}>
                    <Ionicons name="person" size={32} color="#6366f1" />
                  </View>
                  <Text style={styles.similarArtistName} numberOfLines={1}>
                    {item.name}
                  </Text>
                </TouchableOpacity>
              )}
              keyExtractor={(item) => item.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.similarList}
            />
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
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  backButton: {
    overflow: 'hidden',
    borderRadius: 20,
    width: 40,
    height: 40,
  },
  backButtonBlur: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroSection: {
    paddingTop: 100,
    paddingBottom: 32,
    alignItems: 'center',
  },
  artistImageContainer: {
    marginBottom: 20,
  },
  artistImage: {
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  artistImagePlaceholder: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  artistName: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  artistMeta: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 16,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
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
  section: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 16,
  },
  albumGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  albumGridItem: {
    width: '50%',
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  biography: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 15,
    lineHeight: 24,
  },
  similarList: {
    paddingRight: 20,
  },
  similarArtist: {
    alignItems: 'center',
    marginRight: 20,
    width: 100,
  },
  similarArtistImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  similarArtistName: {
    color: '#fff',
    fontSize: 13,
    textAlign: 'center',
  },
  bottomPadding: {
    height: 160,
  },
})
