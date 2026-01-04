import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import React from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

import { useMyRating, useRateSong, useSongRatings } from '@/hooks/useSocial'
import { isSupabaseConfigured } from '@/lib/supabase'

interface StarRatingProps {
  songId?: string
  albumId?: string
  size?: 'small' | 'medium' | 'large'
  showCount?: boolean
}

export function StarRating({
  songId,
  albumId,
  size = 'medium',
  showCount = true,
}: StarRatingProps) {
  const { data: ratings } = useSongRatings(songId || '')
  const { data: myRating } = useMyRating('song', songId || '')
  const rateMutation = useRateSong()

  const handleRate = async (rating: number) => {
    if (!songId) return

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)

    try {
      await rateMutation.mutateAsync({ songId, rating })
    } catch (error) {
      console.error('Failed to rate:', error)
    }
  }

  if (!isSupabaseConfigured()) {
    return null
  }

  const starSize = size === 'small' ? 16 : size === 'medium' ? 24 : 32
  const currentRating = myRating?.rating || 0

  return (
    <View style={styles.container}>
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => handleRate(star)}
            disabled={rateMutation.isPending}
          >
            <Ionicons
              name={star <= currentRating ? 'star' : 'star-outline'}
              size={starSize}
              color={
                star <= currentRating ? '#fbbf24' : 'rgba(255,255,255,0.3)'
              }
            />
          </TouchableOpacity>
        ))}
      </View>

      {showCount && ratings && ratings.count > 0 && (
        <Text style={styles.ratingText}>
          {ratings.average.toFixed(1)} ({ratings.count})
        </Text>
      )}
    </View>
  )
}

interface RatingDisplayProps {
  average: number
  count: number
  size?: 'small' | 'medium' | 'large'
}

export function RatingDisplay({
  average,
  count,
  size = 'medium',
}: RatingDisplayProps) {
  const starSize = size === 'small' ? 14 : size === 'medium' ? 18 : 24

  return (
    <View style={styles.displayContainer}>
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = star <= Math.round(average)
          const half = !filled && star - 0.5 <= average

          return (
            <Ionicons
              key={star}
              name={filled ? 'star' : half ? 'star-half' : 'star-outline'}
              size={starSize}
              color={filled || half ? '#fbbf24' : 'rgba(255,255,255,0.2)'}
            />
          )
        })}
      </View>
      {count > 0 && (
        <Text
          style={[
            styles.displayText,
            size === 'small' && styles.displayTextSmall,
          ]}
        >
          {average.toFixed(1)} • {count} ratings
        </Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 8,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  ratingText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
  },
  displayContainer: {
    alignItems: 'center',
    gap: 4,
  },
  displayText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
  },
  displayTextSmall: {
    fontSize: 11,
  },
})
