import React from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  SafeAreaView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useAppStore, useIsServerConfigured } from '@/store/app.store';

interface SettingsItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  onPress?: () => void;
  isDestructive?: boolean;
}

function SettingsItem({ icon, label, value, onPress, isDestructive }: SettingsItemProps) {
  return (
    <TouchableOpacity style={styles.settingsItem} onPress={onPress}>
      <View style={[styles.settingsIcon, isDestructive && styles.destructiveIcon]}>
        <Ionicons 
          name={icon} 
          size={20} 
          color={isDestructive ? '#ef4444' : '#6366f1'} 
        />
      </View>
      <View style={styles.settingsContent}>
        <Text style={[styles.settingsLabel, isDestructive && styles.destructiveLabel]}>
          {label}
        </Text>
        {value && <Text style={styles.settingsValue}>{value}</Text>}
      </View>
      <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.3)" />
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const isConfigured = useIsServerConfigured();
  const { data, clearConfig, theme, setTheme } = useAppStore();
  
  const handleLogout = () => {
    clearConfig();
    router.replace('/login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>
        
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={40} color="#6366f1" />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.username}>
              {data.username || 'Not logged in'}
            </Text>
            <Text style={styles.serverUrl}>
              {data.url || 'No server connected'}
            </Text>
          </View>
          <TouchableOpacity style={styles.editButton}>
            <Ionicons name="pencil" size={18} color="#6366f1" />
          </TouchableOpacity>
        </View>
        
        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>--</Text>
            <Text style={styles.statLabel}>Plays</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>--</Text>
            <Text style={styles.statLabel}>Favorites</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>--</Text>
            <Text style={styles.statLabel}>Playlists</Text>
          </View>
        </View>
        
        {/* Settings Sections */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Playback</Text>
          <SettingsItem 
            icon="color-palette" 
            label="Theme" 
            value={theme === 'dark' ? 'Dark' : theme === 'light' ? 'Light' : 'System'}
          />
          <SettingsItem icon="musical-notes" label="Audio Quality" value="High" />
          <SettingsItem icon="cloud-download" label="Downloads" />
          <SettingsItem icon="refresh" label="Crossfade" value="Off" />
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Social</Text>
          <SettingsItem icon="person-circle" label="Edit Profile" />
          <SettingsItem icon="people" label="Followers" />
          <SettingsItem icon="notifications" label="Notifications" />
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <SettingsItem icon="information-circle" label="About yedits" />
          <SettingsItem icon="document-text" label="Terms of Service" />
          <SettingsItem icon="shield-checkmark" label="Privacy Policy" />
        </View>
        
        <View style={styles.section}>
          <SettingsItem 
            icon="log-out" 
            label="Log Out" 
            onPress={handleLogout}
            isDestructive
          />
        </View>
        
        {/* App Version */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>yedits.net App</Text>
          <Text style={styles.versionNumber}>Version 1.0.0</Text>
        </View>
        
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
  content: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '700',
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    padding: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    marginBottom: 24,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  username: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  serverUrl: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    padding: 20,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    marginBottom: 32,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginVertical: 4,
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
  destructiveIcon: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  settingsContent: {
    flex: 1,
  },
  settingsLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  destructiveLabel: {
    color: '#ef4444',
  },
  settingsValue: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 13,
    marginTop: 2,
  },
  versionContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  versionText: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 13,
    marginBottom: 4,
  },
  versionNumber: {
    color: 'rgba(255,255,255,0.2)',
    fontSize: 12,
  },
  bottomPadding: {
    height: 180,
  },
});
