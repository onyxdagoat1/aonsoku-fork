import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  ScrollView, 
  StyleSheet, 
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  Keyboard,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useDebouncedCallback } from 'use-debounce';

import { AlbumCard } from '@/components/cards/AlbumCard';
import { SongRow } from '@/components/cards/SongRow';
import { useSearch, useGenres } from '@/hooks/useQueries';
import { usePlayerStore } from '@/store/player.store';
import { ISong, IAlbum, IArtist, IGenre } from '@/types/responses';

const GENRE_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', 
  '#14b8a6', '#06b6d4', '#3b82f6', '#6366f1',
  '#8b5cf6', '#a855f7', '#d946ef', '#ec4899',
];

export default function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const { playSongList } = usePlayerStore();
  
  const { data: searchResults, isLoading } = useSearch(searchQuery);
  const { data: genres } = useGenres();
  
  const debouncedSearch = useDebouncedCallback((value: string) => {
    setSearchQuery(value);
  }, 400);
  
  const handleQueryChange = (text: string) => {
    setQuery(text);
    debouncedSearch(text);
  };
  
  const clearSearch = () => {
    setQuery('');
    setSearchQuery('');
    Keyboard.dismiss();
  };
  
  const handleAlbumPress = (album: IAlbum) => {
    router.push(`/album/${album.id}`);
  };
  
  const handleArtistPress = (artist: IArtist) => {
    router.push(`/artist/${artist.id}`);
  };
  
  const handleSongPress = (songs: ISong[], index: number) => {
    playSongList(songs, index);
  };
  
  const hasResults = searchResults && (
    searchResults.songs?.length || 
    searchResults.albums?.length || 
    searchResults.artists?.length
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Search Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Search</Text>
        
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="rgba(255,255,255,0.4)" />
          <TextInput
            style={styles.searchInput}
            placeholder="Artists, songs, or albums"
            placeholderTextColor="rgba(255,255,255,0.4)"
            value={query}
            onChangeText={handleQueryChange}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={clearSearch}>
              <Ionicons name="close-circle" size={20} color="rgba(255,255,255,0.4)" />
            </TouchableOpacity>
          )}
        </View>
      </View>
      
      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
        {/* Search Results */}
        {searchQuery.length >= 2 ? (
          isLoading ? (
            <View style={styles.centerContent}>
              <Text style={styles.loadingText}>Searching...</Text>
            </View>
          ) : hasResults ? (
            <>
              {/* Songs */}
              {searchResults.songs && searchResults.songs.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Songs</Text>
                  {searchResults.songs.slice(0, 5).map((song: ISong, index: number) => (
                    <SongRow
                      key={song.id}
                      song={song}
                      onPress={() => handleSongPress(searchResults.songs!, index)}
                    />
                  ))}
                </View>
              )}
              
              {/* Albums */}
              {searchResults.albums && searchResults.albums.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Albums</Text>
                  <FlatList
                    horizontal
                    data={searchResults.albums}
                    renderItem={({ item }) => (
                      <AlbumCard 
                        album={item} 
                        onPress={() => handleAlbumPress(item)}
                        size="small"
                      />
                    )}
                    keyExtractor={(item) => item.id}
                    showsHorizontalScrollIndicator={false}
                  />
                </View>
              )}
              
              {/* Artists */}
              {searchResults.artists && searchResults.artists.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Artists</Text>
                  {searchResults.artists.slice(0, 5).map((artist: IArtist) => (
                    <TouchableOpacity 
                      key={artist.id} 
                      style={styles.artistRow}
                      onPress={() => handleArtistPress(artist)}
                    >
                      <View style={styles.artistAvatar}>
                        <Ionicons name="person" size={24} color="#6366f1" />
                      </View>
                      <View style={styles.artistInfo}>
                        <Text style={styles.artistName}>{artist.name}</Text>
                        <Text style={styles.artistMeta}>
                          {artist.albumCount || 0} albums
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.3)" />
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </>
          ) : (
            <View style={styles.centerContent}>
              <Ionicons name="search-outline" size={48} color="rgba(255,255,255,0.2)" />
              <Text style={styles.noResultsText}>No results found</Text>
            </View>
          )
        ) : (
          /* Browse Genres */
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Browse Genres</Text>
            <View style={styles.genreGrid}>
              {genres?.slice(0, 12).map((genre: IGenre, index: number) => (
                <TouchableOpacity 
                  key={genre.value} 
                  style={[
                    styles.genreCard, 
                    { backgroundColor: GENRE_COLORS[index % GENRE_COLORS.length] }
                  ]}
                >
                  <Text style={styles.genreName}>{genre.value}</Text>
                  <Text style={styles.genreCount}>{genre.songCount} songs</Text>
                </TouchableOpacity>
              ))}
            </View>
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
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
  },
  content: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
    gap: 12,
  },
  loadingText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 16,
  },
  noResultsText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 16,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  artistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  artistAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  artistInfo: {
    flex: 1,
  },
  artistName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  artistMeta: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
  },
  genreGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  genreCard: {
    width: '47%',
    height: 100,
    borderRadius: 12,
    padding: 16,
    justifyContent: 'flex-end',
  },
  genreName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  genreCount: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginTop: 4,
  },
  bottomPadding: {
    height: 180,
  },
});
