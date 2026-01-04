import React from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  SafeAreaView,
  Image,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { SongRow } from '@/components/cards/SongRow';
import { useAlbum } from '@/hooks/useQueries';
import { usePlayerStore } from '@/store/player.store';
import { subsonic } from '@/service/subsonic';
import { ISong } from '@/types/responses';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ARTWORK_SIZE = SCREEN_WIDTH - 80;

export default function AlbumDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { playSongList, currentSong } = usePlayerStore();
  
  const { data: album, isLoading } = useAlbum(id!);
  
  const handlePlayAll = () => {
    if (album?.song) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      playSongList(album.song, 0);
    }
  };
  
  const handleShuffleAll = () => {
    if (album?.song) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      playSongList(album.song, 0, true);
    }
  };
  
  const handleSongPress = (songs: ISong[], index: number) => {
    playSongList(songs, index);
  };
  
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }
  
  if (!album) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Album not found</Text>
      </View>
    );
  }
  
  const coverArtUrl = album.coverArt 
    ? subsonic.getCoverArtUrl(album.coverArt, 800) 
    : null;
  
  const totalDuration = album.song?.reduce((acc, song) => acc + (song.duration || 0), 0) || 0;
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours} hr ${mins} min`;
    }
    return `${mins} min`;
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header with Back Button */}
        <SafeAreaView style={styles.headerSafe}>
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={() => router.back()}
            >
              <BlurView intensity={80} tint="dark" style={styles.backButtonBlur}>
                <Ionicons name="chevron-back" size={24} color="#fff" />
              </BlurView>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.moreButton}>
              <Ionicons name="ellipsis-horizontal" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
        
        {/* Album Art */}
        <View style={styles.artworkContainer}>
          {coverArtUrl ? (
            <Image 
              source={{ uri: coverArtUrl }} 
              style={styles.artwork}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.artworkPlaceholder}>
              <Ionicons name="disc" size={100} color="#6366f1" />
            </View>
          )}
        </View>
        
        {/* Album Info */}
        <View style={styles.albumInfo}>
          <Text style={styles.albumTitle} numberOfLines={2}>
            {album.name}
          </Text>
          <TouchableOpacity onPress={() => router.push(`/artist/${album.artistId}`)}>
            <Text style={styles.artistName}>{album.artist || 'Unknown Artist'}</Text>
          </TouchableOpacity>
          <Text style={styles.albumMeta}>
            {album.year && `${album.year} • `}
            {album.songCount || album.song?.length || 0} songs • {formatDuration(totalDuration)}
          </Text>
        </View>
        
        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity 
            style={styles.playButton}
            onPress={handlePlayAll}
          >
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
            <Ionicons name="heart-outline" size={22} color="rgba(255,255,255,0.6)" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.shuffleButton}>
            <Ionicons name="download-outline" size={22} color="rgba(255,255,255,0.6)" />
          </TouchableOpacity>
        </View>
        
        {/* Track List */}
        <View style={styles.trackList}>
          {album.song?.map((song, index) => (
            <SongRow
              key={song.id}
              song={song}
              index={index}
              showIndex
              showArtwork={false}
              isActive={currentSong?.id === song.id}
              onPress={() => handleSongPress(album.song!, index)}
            />
          ))}
        </View>
        
        {/* Bottom padding */}
        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
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
  scrollContent: {
    paddingBottom: 20,
  },
  headerSafe: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  backButton: {
    overflow: 'hidden',
    borderRadius: 20,
  },
  backButtonBlur: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  artworkContainer: {
    alignItems: 'center',
    marginTop: 80,
    marginBottom: 24,
  },
  artwork: {
    width: ARTWORK_SIZE,
    height: ARTWORK_SIZE,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 20,
  },
  artworkPlaceholder: {
    width: ARTWORK_SIZE,
    height: ARTWORK_SIZE,
    borderRadius: 12,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  albumInfo: {
    paddingHorizontal: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  albumTitle: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  artistName: {
    color: '#6366f1',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  albumMeta: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    marginBottom: 24,
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
  trackList: {
    paddingHorizontal: 8,
  },
  bottomPadding: {
    height: 160,
  },
});
