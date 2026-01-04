import { Ionicons } from '@expo/vector-icons'
import { useQuery } from '@tanstack/react-query'
import * as Haptics from 'expo-haptics'
import { useRouter } from 'expo-router'
import React from 'react'
import {
  FlatList,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'

import { SongRow } from '@/components/cards/SongRow'
import { useRecentListening } from '@/hooks/useSocial'
import { subsonic } from '@/service/subsonic'
import { usePlayerStore } from '@/store/player.store'
import { ISong } from '@/types/responses'

export default function HistoryScreen() {
  const router = useRouter()
  const { data: history, isLoading } = useRecentListening()
  const { playSongList, currentSong } = usePlayerStore()

  // Also fetch from local player history
  const { data: recentlyPlayed } = useQuery({
    queryKey: ['recently-played'],
    queryFn: () => subsonic.getAlbumList2('recent', 50),
  })

  const handleSongPress = (songs: ISong[], index: number) => {
    playSongList(songs, index)
  }

  const handleClearHistory = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    // Would clear local history here
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Listening History</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{history?.length || 0}</Text>
            <Text style={styles.statLabel}>Songs played</Text>
          </View>
        </View>

        {/* Recently Played */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading history...</Text>
          </View>
        ) : history && history.length > 0 ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent</Text>
              <TouchableOpacity onPress={handleClearHistory}>
                <Text style={styles.clearText}>Clear</Text>
              </TouchableOpacity>
            </View>

            {/* Would render history items here */}
            <View style={styles.emptyHistoryNote}>
              <Text style={styles.noteText}>
                Your listening history syncs when logged into Supabase
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons
              name="time-outline"
              size={64}
              color="rgba(255,255,255,0.2)"
            />
            <Text style={styles.emptyTitle}>No History Yet</Text>
            <Text style={styles.emptySubtitle}>
              Start listening to build your history
            </Text>
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
  headerTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    marginHorizontal: 16,
    borderRadius: 16,
    paddingVertical: 20,
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  statValue: {
    color: '#6366f1',
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
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
    marginBottom: 24,
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
  },
  clearText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '500',
  },
  emptyHistoryNote: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  noteText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 14,
    textAlign: 'center',
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
