import { LinearGradient } from 'expo-linear-gradient'
import React from 'react'
import { Dimensions, Image, StyleSheet, Text, View } from 'react-native'

interface EmptyStateProps {
  icon?: string
  title: string
  subtitle?: string
  action?: React.ReactNode
}

export function EmptyState({ icon, title, subtitle, action }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      {icon && <Text style={styles.icon}>{icon}</Text>}
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      {action && <View style={styles.actionContainer}>{action}</View>}
    </View>
  )
}

interface ErrorStateProps {
  message?: string
  onRetry?: () => void
}

export function ErrorState({
  message = 'Something went wrong',
  onRetry,
}: ErrorStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.errorIcon}>⚠️</Text>
      <Text style={styles.title}>{message}</Text>
      {onRetry && (
        <Text style={styles.retryText} onPress={onRetry}>
          Tap to retry
        </Text>
      )}
    </View>
  )
}

interface OfflineStateProps {
  message?: string
}

export function OfflineState({
  message = "You're offline",
}: OfflineStateProps) {
  return (
    <View style={styles.offlineContainer}>
      <Text style={styles.offlineIcon}>📶</Text>
      <Text style={styles.offlineText}>{message}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 12,
  },
  icon: {
    fontSize: 48,
    marginBottom: 8,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  actionContainer: {
    marginTop: 16,
  },
  retryText: {
    color: '#6366f1',
    fontSize: 15,
    fontWeight: '500',
    marginTop: 8,
  },
  offlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
  },
  offlineIcon: {
    fontSize: 16,
  },
  offlineText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '500',
  },
})
