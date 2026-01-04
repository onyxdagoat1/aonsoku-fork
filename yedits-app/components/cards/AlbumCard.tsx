import { Ionicons } from '@expo/vector-icons'
import React from 'react'
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { subsonic } from '@/service/subsonic'
import { IAlbum } from '@/types/responses'

interface AlbumCardProps {
  album: IAlbum
  onPress?: () => void
  size?: 'small' | 'medium' | 'large'
}

export function AlbumCard({ album, onPress, size = 'medium' }: AlbumCardProps) {
  const dimensions = {
    small: 120,
    medium: 160,
    large: 200,
  }

  const cardSize = dimensions[size]
  const coverArtUrl = album.coverArt
    ? subsonic.getCoverArtUrl(album.coverArt, cardSize * 2)
    : null

  return (
    <TouchableOpacity
      style={[styles.container, { width: cardSize }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View
        style={[styles.imageContainer, { width: cardSize, height: cardSize }]}
      >
        {coverArtUrl ? (
          <Image
            source={{ uri: coverArtUrl }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholder}>
            <Ionicons name="disc" size={cardSize / 3} color="#6366f1" />
          </View>
        )}
      </View>

      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>
          {album.name}
        </Text>
        <Text style={styles.artist} numberOfLines={1}>
          {album.artist || 'Unknown Artist'}
        </Text>
        {album.year && <Text style={styles.year}>{album.year}</Text>}
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    marginRight: 16,
  },
  imageContainer: {
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#1a1a24',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    marginTop: 8,
    paddingRight: 4,
  },
  title: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  artist: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
  },
  year: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    marginTop: 2,
  },
})
