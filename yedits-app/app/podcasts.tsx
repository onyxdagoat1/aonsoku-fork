import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { useRouter } from 'expo-router'
import React from 'react'
import {
  Image,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'

import { usePodcasts } from '@/hooks/useQueries'
import { subsonic } from '@/service/subsonic'
import { IPodcast, IPodcastEpisode } from '@/types/responses'

export default function PodcastsScreen() {
  const router = useRouter()
  const { data: podcasts, isLoading, refetch, isRefetching } = usePodcasts()

  const renderPodcast = (podcast: IPodcast) => {
    const coverArtUrl = podcast.coverArt
      ? subsonic.getCoverArtUrl(podcast.coverArt, 200)
      : null

    return (
      <TouchableOpacity
        key={podcast.id}
        style={styles.podcastItem}
        onPress={() => {
          Haptics.selectionAsync()
        }}
      >
        {coverArtUrl ? (
          <Image source={{ uri: coverArtUrl }} style={styles.podcastCover} />
        ) : (
          <View style={styles.podcastCoverPlaceholder}>
            <Ionicons name="mic" size={32} color="#6366f1" />
          </View>
        )}
        <View style={styles.podcastInfo}>
          <Text style={styles.podcastTitle} numberOfLines={2}>
            {podcast.title}
          </Text>
          {podcast.description && (
            <Text style={styles.podcastDescription} numberOfLines={2}>
              {podcast.description}
            </Text>
          )}
          <Text style={styles.episodeCount}>
            {podcast.episodes?.length || 0} episodes
          </Text>
        </View>
      </TouchableOpacity>
    )
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
          <Text style={styles.headerTitle}>Podcasts</Text>
        </View>

        {/* Podcasts */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading podcasts...</Text>
          </View>
        ) : podcasts && podcasts.length > 0 ? (
          <View style={styles.podcastList}>{podcasts.map(renderPodcast)}</View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons
              name="mic-outline"
              size={60}
              color="rgba(255,255,255,0.2)"
            />
            <Text style={styles.emptyTitle}>No Podcasts</Text>
            <Text style={styles.emptySubtitle}>
              Add podcast feeds in your Navidrome server
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
  podcastList: {
    paddingHorizontal: 16,
  },
  podcastItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  podcastCover: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 14,
  },
  podcastCoverPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  podcastInfo: {
    flex: 1,
  },
  podcastTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 4,
  },
  podcastDescription: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  episodeCount: {
    color: '#6366f1',
    fontSize: 13,
    fontWeight: '500',
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
