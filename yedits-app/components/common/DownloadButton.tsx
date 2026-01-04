import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import React from 'react'
import {
  Animated,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { useDownloadStore, useIsDownloaded } from '@/store/download.store'
import { ISong } from '@/types/responses'

interface DownloadButtonProps {
  song: ISong
  size?: 'small' | 'medium' | 'large'
}

export function DownloadButton({ song, size = 'medium' }: DownloadButtonProps) {
  const isDownloaded = useIsDownloaded(song.id)
  const { downloadSong, removeSong, activeDownloads } = useDownloadStore()
  const progress = activeDownloads[song.id]

  const iconSize = size === 'small' ? 18 : size === 'medium' ? 22 : 28
  const buttonSize = size === 'small' ? 32 : size === 'medium' ? 40 : 48

  const handlePress = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)

    if (isDownloaded) {
      await removeSong(song.id)
    } else if (!progress) {
      await downloadSong(song)
    }
  }

  const isDownloading = progress?.status === 'downloading'

  return (
    <TouchableOpacity
      style={[styles.button, { width: buttonSize, height: buttonSize }]}
      onPress={handlePress}
      disabled={isDownloading}
    >
      {isDownloading ? (
        <View style={styles.progressContainer}>
          <View
            style={[
              styles.progressCircle,
              { width: iconSize + 8, height: iconSize + 8 },
            ]}
          >
            <View
              style={[
                styles.progressFill,
                {
                  width: iconSize + 8,
                  height: iconSize + 8,
                  transform: [
                    { rotate: `${(progress?.progress || 0) * 360}deg` },
                  ],
                },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {Math.round((progress?.progress || 0) * 100)}%
          </Text>
        </View>
      ) : (
        <Ionicons
          name={isDownloaded ? 'checkmark-circle' : 'cloud-download-outline'}
          size={iconSize}
          color={isDownloaded ? '#10b981' : 'rgba(255,255,255,0.6)'}
        />
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  progressContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressCircle: {
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(99, 102, 241, 0.3)',
    position: 'absolute',
  },
  progressFill: {
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#6366f1',
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  progressText: {
    color: '#6366f1',
    fontSize: 10,
    fontWeight: '600',
  },
})
