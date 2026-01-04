import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import React, { useRef, useState } from 'react'
import {
  Animated,
  Dimensions,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

const SLIDES = [
  {
    id: '1',
    icon: '🎵',
    title: 'Stream Your Music',
    description:
      'Connect to your Navidrome or Subsonic server and stream your entire library.',
    color: '#6366f1',
  },
  {
    id: '2',
    icon: '📱',
    title: 'Listen Anywhere',
    description:
      'Download tracks for offline listening. Take your music wherever you go.',
    color: '#8b5cf6',
  },
  {
    id: '3',
    icon: '🎧',
    title: 'Premium Experience',
    description: 'High-quality audio, lyrics, equalizer, and social features.',
    color: '#a855f7',
  },
]

export default function OnboardingScreen() {
  const router = useRouter()
  const [currentIndex, setCurrentIndex] = useState(0)
  const flatListRef = useRef<FlatList>(null)
  const scrollX = useRef(new Animated.Value(0)).current

  const handleNext = () => {
    Haptics.selectionAsync()
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 })
    } else {
      handleGetStarted()
    }
  }

  const handleGetStarted = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    router.replace('/login')
  }

  const handleSkip = () => {
    Haptics.selectionAsync()
    router.replace('/login')
  }

  const renderSlide = ({
    item,
    index,
  }: {
    item: (typeof SLIDES)[0]
    index: number
  }) => {
    const inputRange = [
      (index - 1) * SCREEN_WIDTH,
      index * SCREEN_WIDTH,
      (index + 1) * SCREEN_WIDTH,
    ]

    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [0.8, 1, 0.8],
      extrapolate: 'clamp',
    })

    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0.5, 1, 0.5],
      extrapolate: 'clamp',
    })

    return (
      <View style={styles.slide}>
        <Animated.View
          style={[styles.iconContainer, { transform: [{ scale }], opacity }]}
        >
          <LinearGradient
            colors={[item.color, `${item.color}50`]}
            style={styles.iconBg}
          >
            <Text style={styles.icon}>{item.icon}</Text>
          </LinearGradient>
        </Animated.View>

        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.description}>{item.description}</Text>
      </View>
    )
  }

  return (
    <LinearGradient
      colors={['#0a0a0f', '#16161f', '#0a0a0f']}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        {/* Skip Button */}
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>

        {/* Slides */}
        <FlatList
          ref={flatListRef}
          data={SLIDES}
          renderItem={renderSlide}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: false },
          )}
          onMomentumScrollEnd={(e) => {
            const index = Math.round(
              e.nativeEvent.contentOffset.x / SCREEN_WIDTH,
            )
            setCurrentIndex(index)
          }}
          scrollEventThrottle={16}
        />

        {/* Dots */}
        <View style={styles.dotsContainer}>
          {SLIDES.map((_, index) => {
            const inputRange = [
              (index - 1) * SCREEN_WIDTH,
              index * SCREEN_WIDTH,
              (index + 1) * SCREEN_WIDTH,
            ]

            const dotWidth = scrollX.interpolate({
              inputRange,
              outputRange: [8, 24, 8],
              extrapolate: 'clamp',
            })

            const opacity = scrollX.interpolate({
              inputRange,
              outputRange: [0.3, 1, 0.3],
              extrapolate: 'clamp',
            })

            return (
              <Animated.View
                key={index}
                style={[styles.dot, { width: dotWidth, opacity }]}
              />
            )
          })}
        </View>

        {/* Button */}
        <TouchableOpacity style={styles.button} onPress={handleNext}>
          <Text style={styles.buttonText}>
            {currentIndex === SLIDES.length - 1 ? 'Get Started' : 'Next'}
          </Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>
      </SafeAreaView>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  skipButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 10,
    padding: 8,
  },
  skipText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 16,
    fontWeight: '500',
  },
  slide: {
    width: SCREEN_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingTop: 100,
  },
  iconContainer: {
    marginBottom: 48,
  },
  iconBg: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 60,
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#6366f1',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366f1',
    marginHorizontal: 40,
    marginBottom: 40,
    paddingVertical: 16,
    borderRadius: 28,
    gap: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
})
