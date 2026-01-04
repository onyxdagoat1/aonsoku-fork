import { Ionicons } from '@expo/vector-icons'
import { BlurView } from 'expo-blur'
import * as Haptics from 'expo-haptics'
import React, { useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Modal,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'

import { usePlaylists } from '@/hooks/useQueries'
import { subsonic } from '@/service/subsonic'
import { IPlaylist } from '@/types/responses'

interface AddToPlaylistModalProps {
  visible: boolean
  onClose: () => void
  songIds: string[]
  onCreateNew?: () => void
}

export function AddToPlaylistModal({
  visible,
  onClose,
  songIds,
  onCreateNew,
}: AddToPlaylistModalProps) {
  const { data: playlists, isLoading } = usePlaylists()
  const [adding, setAdding] = useState<string | null>(null)

  const handleAddToPlaylist = async (playlist: IPlaylist) => {
    setAdding(playlist.id)
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)

    try {
      await subsonic.updatePlaylist(
        playlist.id,
        undefined,
        undefined,
        undefined,
        songIds,
      )
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      onClose()
    } catch (e) {
      console.error('Failed to add to playlist:', e)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
    } finally {
      setAdding(null)
    }
  }

  const renderPlaylistItem = ({ item }: { item: IPlaylist }) => (
    <TouchableOpacity
      style={styles.playlistItem}
      onPress={() => handleAddToPlaylist(item)}
      disabled={adding !== null}
    >
      <View style={styles.playlistIcon}>
        <Ionicons name="musical-notes" size={24} color="#6366f1" />
      </View>
      <View style={styles.playlistInfo}>
        <Text style={styles.playlistName}>{item.name}</Text>
        <Text style={styles.playlistCount}>{item.songCount || 0} songs</Text>
      </View>
      {adding === item.id ? (
        <ActivityIndicator size="small" color="#6366f1" />
      ) : (
        <Ionicons name="add-circle-outline" size={24} color="#6366f1" />
      )}
    </TouchableOpacity>
  )

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

            <Text style={styles.headerTitle}>Add to Playlist</Text>

            <View style={styles.placeholder} />
          </View>

          {/* Create New Playlist Option */}
          <TouchableOpacity
            style={styles.createOption}
            onPress={() => {
              onClose()
              onCreateNew?.()
            }}
          >
            <View style={styles.createIcon}>
              <Ionicons name="add" size={28} color="#6366f1" />
            </View>
            <View style={styles.playlistInfo}>
              <Text style={styles.createText}>Create New Playlist</Text>
              <Text style={styles.playlistCount}>
                Add {songIds.length} song{songIds.length !== 1 ? 's' : ''} to a
                new playlist
              </Text>
            </View>
          </TouchableOpacity>

          {/* Playlist List */}
          {isLoading ? (
            <View style={styles.centerContent}>
              <ActivityIndicator size="large" color="#6366f1" />
            </View>
          ) : playlists && playlists.length > 0 ? (
            <FlatList
              data={playlists}
              renderItem={renderPlaylistItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <View style={styles.centerContent}>
              <Ionicons
                name="musical-notes-outline"
                size={48}
                color="rgba(255,255,255,0.2)"
              />
              <Text style={styles.emptyText}>No playlists yet</Text>
              <Text style={styles.emptySubtext}>
                Create a new playlist to get started
              </Text>
            </View>
          )}
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
  placeholder: {
    width: 40,
  },
  createOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
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
  createText: {
    color: '#6366f1',
    fontSize: 17,
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: 100,
  },
  playlistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  playlistIcon: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  playlistInfo: {
    flex: 1,
  },
  playlistName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  playlistCount: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
})
