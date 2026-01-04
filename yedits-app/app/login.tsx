import { Ionicons } from '@expo/vector-icons'
import * as Crypto from 'expo-crypto'
import * as Haptics from 'expo-haptics'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import React, { useState } from 'react'
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { subsonic } from '@/service/subsonic'
import { useAppStore } from '@/store/app.store'
import { AuthType } from '@/types/serverConfig'

export default function LoginScreen() {
  const router = useRouter()
  const { setServerConfig, setConnecting } = useAppStore()

  const [serverUrl, setServerUrl] = useState(
    process.env.EXPO_PUBLIC_SERVER_URL || '',
  )
  const [username, setUsername] = useState(
    process.env.EXPO_PUBLIC_USERNAME || '',
  )
  const [password, setPassword] = useState(
    process.env.EXPO_PUBLIC_PASSWORD || '',
  )
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  React.useEffect(() => {
    if (
      process.env.EXPO_PUBLIC_SERVER_URL &&
      process.env.EXPO_PUBLIC_USERNAME &&
      process.env.EXPO_PUBLIC_PASSWORD
    ) {
      handleConnect()
    }
  }, [])

  const handleConnect = async () => {
    if (!serverUrl.trim() || !username.trim() || !password.trim()) {
      setError('Please fill in all fields')
      return
    }

    // Clean up URL
    let url = serverUrl.trim()
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url
    }
    if (url.endsWith('/')) {
      url = url.slice(0, -1)
    }

    setIsLoading(true)
    setError(null)
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)

    try {
      // Generate a simple salt and token using expo-crypto
      const salt = Math.random().toString(36).substring(2, 15)
      const hash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.MD5,
        password + salt,
      )
      const authToken = `${hash}:${salt}`

      await subsonic.configure(url, username.trim(), authToken, AuthType.TOKEN)

      // Test connection
      const canConnect = await subsonic.ping()

      if (canConnect) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
        await setServerConfig(url, username.trim(), authToken, AuthType.TOKEN)
        router.replace('/(tabs)')
      } else {
        throw new Error('Could not connect to server')
      }
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      setError(err.message || 'Failed to connect to server')
      await subsonic.clearConfig()
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <LinearGradient
      colors={['#1a1a24', '#0a0a0f', '#0a0a0f']}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <View style={styles.content}>
            {/* Logo / Header */}
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <Ionicons name="musical-notes" size={48} color="#6366f1" />
              </View>
              <Text style={styles.title}>yedits.net</Text>
              <Text style={styles.subtitle}>Connect to your music server</Text>
            </View>

            {/* Form */}
            <View style={styles.form}>
              {/* Server URL */}
              <View style={styles.inputContainer}>
                <Ionicons
                  name="server-outline"
                  size={20}
                  color="rgba(255,255,255,0.4)"
                />
                <TextInput
                  style={styles.input}
                  placeholder="Server URL (e.g., https://music.example.com)"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  value={serverUrl}
                  onChangeText={setServerUrl}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                />
              </View>

              {/* Username */}
              <View style={styles.inputContainer}>
                <Ionicons
                  name="person-outline"
                  size={20}
                  color="rgba(255,255,255,0.4)"
                />
                <TextInput
                  style={styles.input}
                  placeholder="Username"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              {/* Password */}
              <View style={styles.inputContainer}>
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color="rgba(255,255,255,0.4)"
                />
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color="rgba(255,255,255,0.4)"
                  />
                </TouchableOpacity>
              </View>

              {/* Error Message */}
              {error && (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={18} color="#ef4444" />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              {/* Connect Button */}
              <TouchableOpacity
                style={[
                  styles.connectButton,
                  isLoading && styles.connectButtonDisabled,
                ]}
                onPress={handleConnect}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text style={styles.connectButtonText}>Connect</Text>
                    <Ionicons name="arrow-forward" size={20} color="#fff" />
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                Compatible with Navidrome, Subsonic, and similar servers
              </Text>
            </View>
          </View>
        </KeyboardAvoidingView>
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
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 28,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    color: '#fff',
    fontSize: 36,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 16,
  },
  form: {
    gap: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 4,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
  },
  connectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366f1',
    borderRadius: 14,
    paddingVertical: 16,
    gap: 8,
    marginTop: 8,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  connectButtonDisabled: {
    backgroundColor: 'rgba(99, 102, 241, 0.5)',
  },
  connectButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  footer: {
    marginTop: 48,
    alignItems: 'center',
  },
  footerText: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 13,
    textAlign: 'center',
  },
})
