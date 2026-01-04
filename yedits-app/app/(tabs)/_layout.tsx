import { Ionicons } from '@expo/vector-icons'
import { BlurView } from 'expo-blur'
import { Tabs, useRouter } from 'expo-router'
import React from 'react'
import { StyleSheet, View } from 'react-native'

import { MiniPlayer } from '@/components/player/MiniPlayer'

function TabBarIcon(props: {
  name: React.ComponentProps<typeof Ionicons>['name']
  color: string
  focused: boolean
}) {
  return <Ionicons size={24} style={{ marginBottom: -2 }} {...props} />
}

export default function TabLayout() {
  const router = useRouter()

  return (
    <View style={styles.container}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: '#6366f1',
          tabBarInactiveTintColor: 'rgba(255,255,255,0.4)',
          headerShown: false,
          tabBarStyle: {
            position: 'absolute',
            backgroundColor: 'rgba(10, 10, 15, 0.95)',
            borderTopColor: 'rgba(255,255,255,0.1)',
            borderTopWidth: 0.5,
            height: 80,
            paddingBottom: 24,
            paddingTop: 8,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '500',
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon
                name={focused ? 'home' : 'home-outline'}
                color={color}
                focused={focused}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="search"
          options={{
            title: 'Search/Browse',
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon
                name={focused ? 'search' : 'search-outline'}
                color={color}
                focused={focused}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="library"
          options={{
            title: 'Library',
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon
                name={focused ? 'library' : 'library-outline'}
                color={color}
                focused={focused}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon
                name={focused ? 'person' : 'person-outline'}
                color={color}
                focused={focused}
              />
            ),
          }}
        />
      </Tabs>

      {/* Mini Player floating above tabs */}
      <MiniPlayer onPress={() => router.push('/player')} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0f',
  },
})
