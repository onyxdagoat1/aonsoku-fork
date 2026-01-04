import { Ionicons } from '@expo/vector-icons'
import { BlurView } from 'expo-blur'
import React, { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { subsonic } from '@/service/subsonic'
import { useCurrentSong } from '@/store/player.store'

interface LyricsLine {
  start: number
  value: string
}

interface LyricsViewProps {
  visible: boolean
  onClose: () => void
}

export function LyricsView({ visible, onClose }: LyricsViewProps) {
  const currentSong = useCurrentSong()
  const [lyrics, setLyrics] = useState<string | null>(null)
  const [structuredLyrics, setStructuredLyrics] = useState<LyricsLine[] | null>(
    null,
  )
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (visible && currentSong) {
      fetchLyrics()
    }
  }, [visible, currentSong?.id])

  const fetchLyrics = async () => {
    if (!currentSong) return

    setIsLoading(true)
    setError(null)
    setLyrics(null)
    setStructuredLyrics(null)

    try {
      // Try structured lyrics first
      const structured = await subsonic.getLyricsBySongId(currentSong.id)
      if (structured && structured.length > 0) {
        const syncedLyrics = structured.find((l: any) => l.synced)
        if (syncedLyrics?.line) {
          setStructuredLyrics(syncedLyrics.line)
          setIsLoading(false)
          return
        }
        const plainLyrics = structured.find((l: any) => !l.synced)
        if (plainLyrics?.line) {
          setLyrics(plainLyrics.line.map((l: any) => l.value).join('\n'))
          setIsLoading(false)
          return
        }
      }

      // Fallback to basic lyrics
      const basic = await subsonic.getLyrics(
        currentSong.artist,
        currentSong.title,
      )
      if (basic?.value) {
        setLyrics(basic.value)
      } else {
        setError('No lyrics found')
      }
    } catch (e) {
      setError('Failed to load lyrics')
    } finally {
      setIsLoading(false)
    }
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

            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>Lyrics</Text>
              <Text style={styles.songTitle} numberOfLines={1}>
                {currentSong?.title || 'No song playing'}
              </Text>
            </View>

            <View style={styles.placeholder} />
          </View>

          {/* Lyrics Content */}
          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
          >
            {isLoading ? (
              <View style={styles.centerContent}>
                <ActivityIndicator size="large" color="#6366f1" />
                <Text style={styles.loadingText}>Loading lyrics...</Text>
              </View>
            ) : error ? (
              <View style={styles.centerContent}>
                <Ionicons
                  name="text-outline"
                  size={48}
                  color="rgba(255,255,255,0.2)"
                />
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity
                  onPress={fetchLyrics}
                  style={styles.retryButton}
                >
                  <Text style={styles.retryText}>Try Again</Text>
                </TouchableOpacity>
              </View>
            ) : structuredLyrics ? (
              structuredLyrics.map((line, index) => (
                <Text key={index} style={styles.lyricsLine}>
                  {line.value || '\n'}
                </Text>
              ))
            ) : lyrics ? (
              <Text style={styles.lyricsText}>{lyrics}</Text>
            ) : (
              <View style={styles.centerContent}>
                <Ionicons
                  name="text-outline"
                  size={48}
                  color="rgba(255,255,255,0.2)"
                />
                <Text style={styles.errorText}>No lyrics available</Text>
              </View>
            )}
          </ScrollView>
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
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  headerTitle: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  songTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 24,
    paddingBottom: 100,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
    gap: 16,
  },
  loadingText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 16,
  },
  errorText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 16,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    borderRadius: 20,
    marginTop: 8,
  },
  retryText: {
    color: '#6366f1',
    fontSize: 15,
    fontWeight: '500',
  },
  lyricsText: {
    color: '#fff',
    fontSize: 20,
    lineHeight: 36,
    textAlign: 'center',
    fontWeight: '500',
  },
  lyricsLine: {
    color: '#fff',
    fontSize: 22,
    lineHeight: 40,
    textAlign: 'center',
    fontWeight: '500',
    marginBottom: 8,
  },
})
