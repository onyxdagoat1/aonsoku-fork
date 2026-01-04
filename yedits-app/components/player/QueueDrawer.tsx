import { Ionicons } from '@expo/vector-icons'
import { BlurView } from 'expo-blur'
import * as Haptics from 'expo-haptics'
import React from 'react'
import {
  FlatList,
  Modal,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'

import { SongRow } from '@/components/cards/SongRow'
import { useCurrentSong, usePlayerStore, useQueue } from '@/store/player.store'
import { ISong } from '@/types/responses'

interface QueueDrawerProps {
  visible: boolean
  onClose: () => void
}

export function QueueDrawer({ visible, onClose }: QueueDrawerProps) {
  const queue = useQueue()
  const currentSong = useCurrentSong()
  const { playSongList, removeFromQueue, clearQueue, currentIndex } =
    usePlayerStore()

  const handleSongPress = (index: number) => {
    Haptics.selectionAsync()
    playSongList(queue, index)
  }

  const handleRemove = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    removeFromQueue(index)
  }

  const handleClearQueue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
    clearQueue()
    onClose()
  }

  // Split queue into played, current, and upcoming
  const upcomingQueue = queue.slice(currentIndex + 1)
  const playedQueue = queue.slice(0, currentIndex)

  const renderSongItem = ({ item, index }: { item: ISong; index: number }) => {
    const realIndex = currentIndex + 1 + index
    return (
      <View style={styles.queueItem}>
        <View style={styles.songContent}>
          <SongRow
            song={item}
            showArtwork
            isActive={false}
            onPress={() => handleSongPress(realIndex)}
          />
        </View>
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => handleRemove(realIndex)}
        >
          <Ionicons name="close" size={20} color="rgba(255,255,255,0.4)" />
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <BlurView intensity={100} tint="dark" style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="chevron-down" size={28} color="#fff" />
            </TouchableOpacity>

            <Text style={styles.headerTitle}>Queue</Text>

            <TouchableOpacity
              onPress={handleClearQueue}
              style={styles.clearButton}
            >
              <Text style={styles.clearText}>Clear</Text>
            </TouchableOpacity>
          </View>

          {/* Now Playing */}
          {currentSong && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Now Playing</Text>
              <SongRow song={currentSong} showArtwork isActive />
            </View>
          )}

          {/* Up Next */}
          <View style={styles.upNextSection}>
            <Text style={styles.sectionTitle}>
              Up Next ({upcomingQueue.length})
            </Text>

            {upcomingQueue.length > 0 ? (
              <FlatList
                data={upcomingQueue}
                renderItem={renderSongItem}
                keyExtractor={(item, index) => `${item.id}-${index}`}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
              />
            ) : (
              <View style={styles.emptyState}>
                <Ionicons
                  name="musical-notes-outline"
                  size={40}
                  color="rgba(255,255,255,0.2)"
                />
                <Text style={styles.emptyText}>No upcoming songs</Text>
              </View>
            )}
          </View>
        </SafeAreaView>
      </BlurView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(10, 10, 15, 0.95)',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  clearText: {
    color: '#ef4444',
    fontSize: 15,
    fontWeight: '500',
  },
  section: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  sectionTitle: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  upNextSection: {
    flex: 1,
    paddingTop: 16,
  },
  listContent: {
    paddingBottom: 100,
  },
  queueItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  songContent: {
    flex: 1,
  },
  removeButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    paddingBottom: 100,
  },
  emptyText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 16,
  },
})
