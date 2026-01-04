import { Ionicons } from '@expo/vector-icons'
import Constants from 'expo-constants'
import { useRouter } from 'expo-router'
import React from 'react'
import {
  Linking,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'

const LIBRARIES = [
  { name: 'React Native', license: 'MIT', url: 'https://reactnative.dev' },
  { name: 'Expo', license: 'MIT', url: 'https://expo.dev' },
  { name: 'Zustand', license: 'MIT', url: 'https://zustand-demo.pmnd.rs' },
  { name: 'TanStack Query', license: 'MIT', url: 'https://tanstack.com/query' },
  { name: 'Supabase', license: 'Apache 2.0', url: 'https://supabase.com' },
  {
    name: 'expo-av',
    license: 'MIT',
    url: 'https://docs.expo.dev/versions/latest/sdk/av/',
  },
  { name: 'NativeWind', license: 'MIT', url: 'https://www.nativewind.dev' },
  { name: 'date-fns', license: 'MIT', url: 'https://date-fns.org' },
]

export default function AboutScreen() {
  const router = useRouter()
  const version = Constants.expoConfig?.version || '1.0.0'

  const handleOpenUrl = (url: string) => {
    Linking.openURL(url)
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>About</Text>
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <View style={styles.appIcon}>
            <Text style={styles.appIconText}>🎵</Text>
          </View>
          <Text style={styles.appName}>yedits.net</Text>
          <Text style={styles.appVersion}>Version {version}</Text>
          <Text style={styles.appDescription}>
            Your personal music streaming app
          </Text>
        </View>

        {/* Links */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Links</Text>

          <TouchableOpacity
            style={styles.linkItem}
            onPress={() => handleOpenUrl('https://yedits.net')}
          >
            <Ionicons name="globe-outline" size={22} color="#6366f1" />
            <Text style={styles.linkText}>Website</Text>
            <Ionicons
              name="open-outline"
              size={18}
              color="rgba(255,255,255,0.3)"
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkItem}
            onPress={() => handleOpenUrl('https://github.com/yedits')}
          >
            <Ionicons name="logo-github" size={22} color="#6366f1" />
            <Text style={styles.linkText}>Source Code</Text>
            <Ionicons
              name="open-outline"
              size={18}
              color="rgba(255,255,255,0.3)"
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkItem}
            onPress={() => handleOpenUrl('mailto:support@yedits.net')}
          >
            <Ionicons name="mail-outline" size={22} color="#6366f1" />
            <Text style={styles.linkText}>Contact Us</Text>
            <Ionicons
              name="open-outline"
              size={18}
              color="rgba(255,255,255,0.3)"
            />
          </TouchableOpacity>
        </View>

        {/* Open Source */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Open Source Libraries</Text>

          {LIBRARIES.map((lib) => (
            <TouchableOpacity
              key={lib.name}
              style={styles.libraryItem}
              onPress={() => handleOpenUrl(lib.url)}
            >
              <View style={styles.libraryInfo}>
                <Text style={styles.libraryName}>{lib.name}</Text>
                <Text style={styles.libraryLicense}>{lib.license}</Text>
              </View>
              <Ionicons
                name="open-outline"
                size={16}
                color="rgba(255,255,255,0.3)"
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* Legal */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Legal</Text>

          <TouchableOpacity style={styles.linkItem}>
            <Ionicons name="document-text-outline" size={22} color="#6366f1" />
            <Text style={styles.linkText}>Terms of Service</Text>
            <Ionicons
              name="chevron-forward"
              size={18}
              color="rgba(255,255,255,0.3)"
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.linkItem}>
            <Ionicons
              name="shield-checkmark-outline"
              size={22}
              color="#6366f1"
            />
            <Text style={styles.linkText}>Privacy Policy</Text>
            <Ionicons
              name="chevron-forward"
              size={18}
              color="rgba(255,255,255,0.3)"
            />
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Made with 💜 for music lovers</Text>
          <Text style={styles.copyright}>© 2024 yedits.net</Text>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  )
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
  appInfo: {
    alignItems: 'center',
    paddingVertical: 32,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  appIcon: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  appIconText: {
    fontSize: 40,
  },
  appName: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  appVersion: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    marginBottom: 8,
  },
  appDescription: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 15,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  sectionTitle: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 14,
  },
  linkText: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
  },
  libraryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  libraryInfo: {
    flex: 1,
  },
  libraryName: {
    color: '#fff',
    fontSize: 15,
  },
  libraryLicense: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    marginTop: 2,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  footerText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 14,
    marginBottom: 8,
  },
  copyright: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 12,
  },
  bottomPadding: {
    height: 100,
  },
})
