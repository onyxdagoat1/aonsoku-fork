import { Ionicons } from '@expo/vector-icons'
import { BlurView } from 'expo-blur'
import * as Haptics from 'expo-haptics'
import React, { useState } from 'react'
import {
  Modal,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'

import { usePlayerStore } from '@/store/player.store'
import { ISong } from '@/types/responses'

interface SongActionsSheetProps {
  visible: boolean
  onClose: () => void
  song: ISong | null
  onAddToPlaylist?: () => void
  onGoToAlbum?: () => void
  onGoToArtist?: () => void
}

export function SongActionsSheet({
  visible,
  onClose,
  song,
  onAddToPlaylist,
  onGoToAlbum,
  onGoToArtist,
}: SongActionsSheetProps) {
  const { addToQueue } = usePlayerStore()

  const handleAction = (action: () => void) => {
    Haptics.selectionAsync()
    action()
    onClose()
  }

  const handlePlayNext = () => {
    if (song) {
      addToQueue([song], true)
    }
  }

  const handleAddToQueue = () => {
    if (song) {
      addToQueue([song], false)
    }
  }

  const actions = [
    {
      icon: 'play-forward' as const,
      label: 'Play Next',
      onPress: () => handleAction(handlePlayNext),
    },
    {
      icon: 'list' as const,
      label: 'Add to Queue',
      onPress: () => handleAction(handleAddToQueue),
    },
    {
      icon: 'add-circle' as const,
      label: 'Add to Playlist',
      onPress: () => handleAction(() => onAddToPlaylist?.()),
    },
    {
      icon: 'disc' as const,
      label: 'Go to Album',
      onPress: () => handleAction(() => onGoToAlbum?.()),
      hidden: !song?.albumId,
    },
    {
      icon: 'person' as const,
      label: 'Go to Artist',
      onPress: () => handleAction(() => onGoToArtist?.()),
      hidden: !song?.artistId,
    },
    {
      icon: 'share' as const,
      label: 'Share',
      onPress: () => handleAction(() => {}),
    },
  ]

  if (!song) return null

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={onClose}
      />

      <View style={styles.sheetContainer}>
        <BlurView intensity={100} tint="dark" style={styles.sheet}>
          <SafeAreaView>
            {/* Song Info */}
            <View style={styles.songInfo}>
              <View style={styles.songIcon}>
                <Ionicons name="musical-note" size={24} color="#6366f1" />
              </View>
              <View style={styles.songDetails}>
                <Text style={styles.songTitle} numberOfLines={1}>
                  {song.title}
                </Text>
                <Text style={styles.songArtist} numberOfLines={1}>
                  {song.artist}
                </Text>
              </View>
            </View>

            {/* Actions */}
            <View style={styles.actions}>
              {actions
                .filter((a) => !a.hidden)
                .map((action, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.actionItem}
                    onPress={action.onPress}
                  >
                    <Ionicons name={action.icon} size={24} color="#fff" />
                    <Text style={styles.actionLabel}>{action.label}</Text>
                  </TouchableOpacity>
                ))}
            </View>

            {/* Cancel Button */}
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </SafeAreaView>
        </BlurView>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheetContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
    paddingTop: 16,
    paddingBottom: 24,
  },
  songInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    marginBottom: 8,
  },
  songIcon: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  songDetails: {
    flex: 1,
  },
  songTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 2,
  },
  songArtist: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
  },
  actions: {
    paddingHorizontal: 8,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 16,
  },
  actionLabel: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '500',
  },
  cancelButton: {
    marginTop: 8,
    marginHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    alignItems: 'center',
  },
  cancelText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
})
