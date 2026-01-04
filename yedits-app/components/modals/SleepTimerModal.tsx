import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  Modal,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useSleepTimer } from '@/hooks/useSleepTimer';

interface SleepTimerModalProps {
  visible: boolean;
  onClose: () => void;
}

export function SleepTimerModal({ visible, onClose }: SleepTimerModalProps) {
  const { isActive, remainingMinutes, presets, setTimer, extendTimer, clearTimer } = useSleepTimer();

  const handleSelect = (minutes: number) => {
    setTimer(minutes);
    onClose();
  };

  const handleExtend = (minutes: number) => {
    extendTimer(minutes);
    Haptics.selectionAsync();
  };

  const handleCancel = () => {
    clearTimer();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.backdrop} 
        activeOpacity={1} 
        onPress={onClose}
      />
      
      <View style={styles.modalContainer}>
        <BlurView intensity={100} tint="dark" style={styles.modal}>
          <Text style={styles.title}>
            {isActive ? 'Sleep Timer Active' : 'Sleep Timer'}
          </Text>
          
          {isActive ? (
            <View style={styles.activeTimer}>
              <View style={styles.timerDisplay}>
                <Ionicons name="moon" size={32} color="#6366f1" />
                <Text style={styles.timerText}>
                  {remainingMinutes} min remaining
                </Text>
              </View>
              
              <View style={styles.extendOptions}>
                <Text style={styles.extendLabel}>Extend by:</Text>
                <View style={styles.extendButtons}>
                  {[5, 15, 30].map((mins) => (
                    <TouchableOpacity
                      key={mins}
                      style={styles.extendButton}
                      onPress={() => handleExtend(mins)}
                    >
                      <Text style={styles.extendButtonText}>+{mins}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              
              <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                <Text style={styles.cancelText}>Cancel Timer</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.presetGrid}>
              {presets.map((minutes) => (
                <TouchableOpacity
                  key={minutes}
                  style={styles.presetButton}
                  onPress={() => handleSelect(minutes)}
                >
                  <Text style={styles.presetMinutes}>{minutes}</Text>
                  <Text style={styles.presetLabel}>min</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </BlurView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  modal: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 48,
  },
  title: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 24,
  },
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  presetButton: {
    width: 80,
    height: 80,
    borderRadius: 16,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  presetMinutes: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
  },
  presetLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
  },
  activeTimer: {
    alignItems: 'center',
    gap: 24,
  },
  timerDisplay: {
    alignItems: 'center',
    gap: 12,
  },
  timerText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
  extendOptions: {
    alignItems: 'center',
    gap: 12,
  },
  extendLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
  },
  extendButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  extendButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
  },
  extendButtonText: {
    color: '#6366f1',
    fontSize: 15,
    fontWeight: '600',
  },
  cancelButton: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderRadius: 24,
    marginTop: 8,
  },
  cancelText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '600',
  },
});
