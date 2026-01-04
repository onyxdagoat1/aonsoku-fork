import { useRouter } from 'expo-router'
import React from 'react'
import { FullPlayer } from '@/components/player/FullPlayer'

export default function PlayerScreen() {
  const router = useRouter()

  return <FullPlayer onClose={() => router.back()} />
}
