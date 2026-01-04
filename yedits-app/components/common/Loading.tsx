import React from 'react'
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large'
  color?: string
  text?: string
}

export function LoadingSpinner({
  size = 'medium',
  color = '#6366f1',
  text,
}: LoadingSpinnerProps) {
  const spinValue = React.useRef(new Animated.Value(0)).current

  React.useEffect(() => {
    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start()
  }, [])

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  })

  const spinnerSize = size === 'small' ? 20 : size === 'medium' ? 32 : 48
  const borderWidth = size === 'small' ? 2 : size === 'medium' ? 3 : 4

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.spinner,
          {
            width: spinnerSize,
            height: spinnerSize,
            borderWidth,
            borderColor: `${color}20`,
            borderTopColor: color,
            transform: [{ rotate: spin }],
          },
        ]}
      />
      {text && <Text style={[styles.text, { color }]}>{text}</Text>}
    </View>
  )
}

interface SkeletonProps {
  width?: number | string
  height?: number
  borderRadius?: number
  style?: object
}

export function Skeleton({
  width = '100%',
  height = 16,
  borderRadius = 8,
  style,
}: SkeletonProps) {
  const opacity = React.useRef(new Animated.Value(0.3)).current

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    ).start()
  }, [])

  return (
    <Animated.View
      style={[styles.skeleton, { width, height, borderRadius, opacity }, style]}
    />
  )
}

export function SongRowSkeleton() {
  return (
    <View style={styles.songRowSkeleton}>
      <Skeleton width={48} height={48} borderRadius={8} />
      <View style={styles.songRowContent}>
        <Skeleton width="60%" height={16} />
        <Skeleton width="40%" height={14} style={{ marginTop: 6 }} />
      </View>
    </View>
  )
}

export function AlbumCardSkeleton() {
  return (
    <View style={styles.albumCardSkeleton}>
      <Skeleton width={140} height={140} borderRadius={12} />
      <Skeleton width="80%" height={14} style={{ marginTop: 8 }} />
      <Skeleton width="50%" height={12} style={{ marginTop: 4 }} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  spinner: {
    borderRadius: 100,
  },
  text: {
    fontSize: 14,
    fontWeight: '500',
  },
  skeleton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  songRowSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  songRowContent: {
    flex: 1,
  },
  albumCardSkeleton: {
    width: 140,
  },
})
