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

import { useRadios } from '@/hooks/useQueries'
import { subsonic } from '@/service/subsonic'
import { usePlayerStore } from '@/store/player.store'
import { IRadio } from '@/types/responses'

export default function RadioScreen() {
  const router = useRouter()
  const { playRadio } = usePlayerStore()
  const { data: radios, isLoading, refetch, isRefetching } = useRadios()

  const handlePlay = (radio: IRadio) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    playRadio(radio)
  }

  const renderRadioItem = (radio: IRadio) => (
    <TouchableOpacity
      key={radio.id}
      style={styles.radioItem}
      onPress={() => handlePlay(radio)}
    >
      <View style={styles.radioIcon}>
        <Ionicons name="radio" size={28} color="#6366f1" />
      </View>
      <View style={styles.radioInfo}>
        <Text style={styles.radioName}>{radio.name}</Text>
        {radio.homePageUrl && (
          <Text style={styles.radioUrl} numberOfLines={1}>
            {radio.homePageUrl}
          </Text>
        )}
      </View>
      <TouchableOpacity style={styles.playButton}>
        <Ionicons name="play" size={20} color="#fff" />
      </TouchableOpacity>
    </TouchableOpacity>
  )

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
          <Text style={styles.headerTitle}>Internet Radio</Text>
        </View>

        {/* Radio Stations */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading stations...</Text>
          </View>
        ) : radios && radios.length > 0 ? (
          <View style={styles.radioList}>{radios.map(renderRadioItem)}</View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons
              name="radio-outline"
              size={60}
              color="rgba(255,255,255,0.2)"
            />
            <Text style={styles.emptyTitle}>No Radio Stations</Text>
            <Text style={styles.emptySubtitle}>
              Add stations in your Navidrome server
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
  radioList: {
    paddingHorizontal: 16,
  },
  radioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  radioIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  radioInfo: {
    flex: 1,
  },
  radioName: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 2,
  },
  radioUrl: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 13,
  },
  playButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
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
