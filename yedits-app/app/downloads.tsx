import React from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  SafeAreaView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { SongRow } from '@/components/cards/SongRow';
import { useDownloadStore, useDownloads, useTotalDownloadSize } from '@/store/download.store';
import { usePlayerStore } from '@/store/player.store';
import { subsonic } from '@/service/subsonic';

// Format bytes to readable string
const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

export default function DownloadsScreen() {
  const router = useRouter();
  const downloads = useDownloads();
  const totalSize = useTotalDownloadSize();
  const { removeSong, clearAllDownloads } = useDownloadStore();
  const { playSongList, currentSong } = usePlayerStore();

  const handlePlayAll = () => {
    if (downloads.length > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      playSongList(downloads, 0);
    }
  };

  const handleSongPress = (index: number) => {
    playSongList(downloads, index);
  };

  const handleRemove = (songId: string, title: string) => {
    Alert.alert(
      'Remove Download',
      `Remove "${title}" from downloads?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: async () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            await removeSong(songId);
          }
        },
      ]
    );
  };

  const handleClearAll = () => {
    Alert.alert(
      'Clear All Downloads',
      `This will remove ${downloads.length} songs (${formatBytes(totalSize)}) from your device.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear All', 
          style: 'destructive',
          onPress: async () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            await clearAllDownloads();
          }
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Downloads</Text>
        </View>

        {/* Stats */}
        <View style={styles.stats}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{downloads.length}</Text>
            <Text style={styles.statLabel}>Songs</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{formatBytes(totalSize)}</Text>
            <Text style={styles.statLabel}>Storage</Text>
          </View>
        </View>

        {downloads.length > 0 ? (
          <>
            {/* Actions */}
            <View style={styles.actions}>
              <TouchableOpacity style={styles.playButton} onPress={handlePlayAll}>
                <Ionicons name="play" size={20} color="#fff" />
                <Text style={styles.playButtonText}>Play All</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.clearButton} onPress={handleClearAll}>
                <Ionicons name="trash-outline" size={20} color="#ef4444" />
              </TouchableOpacity>
            </View>

            {/* Downloaded Songs */}
            <View style={styles.songList}>
              {downloads.map((song, index) => (
                <View key={song.id} style={styles.songItem}>
                  <View style={styles.songContent}>
                    <SongRow
                      song={song}
                      showArtwork
                      isActive={currentSong?.id === song.id}
                      onPress={() => handleSongPress(index)}
                    />
                  </View>
                  <View style={styles.songMeta}>
                    <Text style={styles.fileSize}>{formatBytes(song.fileSize)}</Text>
                    <TouchableOpacity 
                      style={styles.removeButton}
                      onPress={() => handleRemove(song.id, song.title)}
                    >
                      <Ionicons name="close-circle" size={22} color="rgba(255,255,255,0.4)" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="cloud-download-outline" size={64} color="rgba(255,255,255,0.2)" />
            <Text style={styles.emptyTitle}>No Downloads</Text>
            <Text style={styles.emptySubtitle}>
              Download songs to listen offline
            </Text>
          </View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
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
  stats: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
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
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 12,
  },
  playButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366f1',
    paddingVertical: 14,
    borderRadius: 28,
    gap: 8,
  },
  playButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  clearButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  songList: {
    paddingHorizontal: 8,
  },
  songItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  songContent: {
    flex: 1,
  },
  songMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingRight: 8,
  },
  fileSize: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
  },
  removeButton: {
    padding: 4,
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
});
