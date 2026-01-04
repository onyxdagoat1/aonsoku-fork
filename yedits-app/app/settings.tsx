import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import React from 'react'
import {
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { useAppStore, useTheme } from '@/store/app.store'

interface SettingsItemProps {
  icon: keyof typeof Ionicons.glyphMap
  label: string
  value?: string | boolean
  onPress?: () => void
  showSwitch?: boolean
  onSwitchChange?: (value: boolean) => void
}

function SettingsItem({
  icon,
  label,
  value,
  onPress,
  showSwitch,
  onSwitchChange,
}: SettingsItemProps) {
  return (
    <TouchableOpacity
      style={styles.settingsItem}
      onPress={onPress}
      disabled={showSwitch}
    >
      <View style={styles.settingsIcon}>
        <Ionicons name={icon} size={20} color="#6366f1" />
      </View>
      <View style={styles.settingsContent}>
        <Text style={styles.settingsLabel}>{label}</Text>
        {typeof value === 'string' && (
          <Text style={styles.settingsValue}>{value}</Text>
        )}
      </View>
      {showSwitch ? (
        <Switch
          value={typeof value === 'boolean' ? value : false}
          onValueChange={onSwitchChange}
          trackColor={{
            false: 'rgba(255,255,255,0.2)',
            true: 'rgba(99, 102, 241, 0.5)',
          }}
          thumbColor={value ? '#6366f1' : '#fff'}
        />
      ) : (
        <Ionicons
          name="chevron-forward"
          size={20}
          color="rgba(255,255,255,0.3)"
        />
      )}
    </TouchableOpacity>
  )
}

export default function SettingsScreen() {
  const router = useRouter()
  const theme = useTheme()
  const { setTheme } = useAppStore()

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back()
    } else {
      router.replace('/(tabs)')
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Settings</Text>
        </View>

        {/* Playback */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Playback</Text>

          <SettingsItem
            icon="volume-high"
            label="Audio Quality"
            value="High (320kbps)"
          />
          <SettingsItem icon="shuffle" label="Crossfade" value="5 seconds" />
          <SettingsItem icon="musical-note" label="Equalizer" />
          <SettingsItem
            icon="volume-mute"
            label="Normalize Volume"
            value={false}
            showSwitch
            onSwitchChange={() => {}}
          />
        </View>

        {/* Downloads */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Downloads</Text>

          <SettingsItem
            icon="cloud-download"
            label="Download Quality"
            value="Same as streaming"
          />
          <SettingsItem
            icon="wifi"
            label="Download on WiFi Only"
            value={true}
            showSwitch
            onSwitchChange={() => {}}
          />
          <SettingsItem icon="folder" label="Storage Used" value="0 MB" />
        </View>

        {/* Appearance */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appearance</Text>

          <SettingsItem
            icon="moon"
            label="Dark Mode"
            value={theme === 'dark'}
            showSwitch
            onSwitchChange={(value) => setTheme(value ? 'dark' : 'light')}
          />
          <SettingsItem
            icon="color-palette"
            label="Accent Color"
            value="Indigo"
          />
        </View>

        {/* Data */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data</Text>

          <SettingsItem icon="refresh" label="Clear Cache" />
          <SettingsItem icon="trash" label="Clear Downloads" />
          <SettingsItem icon="document" label="Export Playlists" />
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>

          <SettingsItem
            icon="information-circle"
            label="Version"
            value="1.0.0"
          />
          <SettingsItem icon="logo-github" label="Source Code" />
          <SettingsItem icon="document-text" label="Licenses" />
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  settingsIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  settingsContent: {
    flex: 1,
  },
  settingsLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  settingsValue: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 13,
    marginTop: 2,
  },
  bottomPadding: {
    height: 100,
  },
})
