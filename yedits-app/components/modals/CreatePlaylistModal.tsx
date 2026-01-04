import { Ionicons } from '@expo/vector-icons'
import { BlurView } from 'expo-blur'
import * as Haptics from 'expo-haptics'
import React, { useState } from 'react'
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'

import { useCreatePlaylist } from '@/hooks/useQueries'

interface CreatePlaylistModalProps {
  visible: boolean
  onClose: () => void
  songIds?: string[]
}

export function CreatePlaylistModal({
  visible,
  onClose,
  songIds,
}: CreatePlaylistModalProps) {
  const [name, setName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createPlaylistMutation = useCreatePlaylist()

  const handleCreate = async () => {
    if (!name.trim()) {
      setError('Please enter a playlist name')
      return
    }

    setIsLoading(true)
    setError(null)
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)

    try {
      await createPlaylistMutation.mutateAsync({
        name: name.trim(),
        songIds,
      })
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      setName('')
      onClose()
    } catch (e: any) {
      setError(e.message || 'Failed to create playlist')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setName('')
    setError(null)
    onClose()
  }

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={handleClose}
        />

        <View style={styles.modalContainer}>
          <BlurView intensity={100} tint="dark" style={styles.modal}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>New Playlist</Text>
              <TouchableOpacity
                onPress={handleClose}
                style={styles.closeButton}
              >
                <Ionicons
                  name="close"
                  size={24}
                  color="rgba(255,255,255,0.6)"
                />
              </TouchableOpacity>
            </View>

            {/* Input */}
            <View style={styles.inputContainer}>
              <Ionicons name="musical-notes" size={24} color="#6366f1" />
              <TextInput
                style={styles.input}
                placeholder="Playlist name"
                placeholderTextColor="rgba(255,255,255,0.3)"
                value={name}
                onChangeText={setName}
                autoFocus
                autoCapitalize="words"
              />
            </View>

            {/* Error */}
            {error && <Text style={styles.errorText}>{error}</Text>}

            {/* Song count */}
            {songIds && songIds.length > 0 && (
              <Text style={styles.songCount}>
                Adding {songIds.length} song{songIds.length !== 1 ? 's' : ''}
              </Text>
            )}

            {/* Actions */}
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleClose}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.createButton,
                  isLoading && styles.createButtonDisabled,
                ]}
                onPress={handleCreate}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.createButtonText}>Create</Text>
                )}
              </TouchableOpacity>
            </View>
          </BlurView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalContainer: {
    width: '85%',
    maxWidth: 400,
  },
  modal: {
    borderRadius: 20,
    overflow: 'hidden',
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
  },
  closeButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    marginBottom: 16,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 17,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    marginBottom: 12,
  },
  songCount: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    marginBottom: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  createButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#6366f1',
    alignItems: 'center',
  },
  createButtonDisabled: {
    backgroundColor: 'rgba(99, 102, 241, 0.5)',
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
})
