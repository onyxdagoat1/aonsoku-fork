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
import Slider from '@react-native-community/slider';

interface EqualizerModalProps {
  visible: boolean;
  onClose: () => void;
}

interface EQPreset {
  name: string;
  values: number[];
}

const EQ_PRESETS: EQPreset[] = [
  { name: 'Flat', values: [0, 0, 0, 0, 0, 0] },
  { name: 'Bass Boost', values: [6, 4, 2, 0, 0, 0] },
  { name: 'Treble Boost', values: [0, 0, 0, 2, 4, 6] },
  { name: 'Vocal', values: [-2, 0, 2, 4, 2, 0] },
  { name: 'Rock', values: [4, 2, -2, -2, 2, 4] },
  { name: 'Electronic', values: [4, 2, 0, -2, 2, 4] },
  { name: 'Hip-Hop', values: [6, 4, 1, 2, -1, 2] },
  { name: 'Classical', values: [0, 0, 0, 0, -2, -4] },
];

const BANDS = ['60Hz', '150Hz', '400Hz', '1kHz', '2.4kHz', '15kHz'];

export function EqualizerModal({ visible, onClose }: EqualizerModalProps) {
  const [selectedPreset, setSelectedPreset] = useState<string>('Flat');
  const [values, setValues] = useState<number[]>([0, 0, 0, 0, 0, 0]);
  const [isEnabled, setIsEnabled] = useState(false);

  const handlePresetSelect = (preset: EQPreset) => {
    Haptics.selectionAsync();
    setSelectedPreset(preset.name);
    setValues(preset.values);
  };

  const handleSliderChange = (index: number, value: number) => {
    const newValues = [...values];
    newValues[index] = value;
    setValues(newValues);
    setSelectedPreset('Custom');
  };

  const handleToggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsEnabled(!isEnabled);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <BlurView intensity={100} tint="dark" style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="chevron-down" size={28} color="#fff" />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>Equalizer</Text>
          
          <TouchableOpacity 
            style={[styles.toggleButton, isEnabled && styles.toggleButtonActive]}
            onPress={handleToggle}
          >
            <Text style={[styles.toggleText, isEnabled && styles.toggleTextActive]}>
              {isEnabled ? 'ON' : 'OFF'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Presets */}
        <View style={styles.presetsSection}>
          <Text style={styles.sectionLabel}>Presets</Text>
          <View style={styles.presetGrid}>
            {EQ_PRESETS.map((preset) => (
              <TouchableOpacity
                key={preset.name}
                style={[
                  styles.presetButton,
                  selectedPreset === preset.name && styles.presetButtonActive,
                ]}
                onPress={() => handlePresetSelect(preset)}
              >
                <Text style={[
                  styles.presetText,
                  selectedPreset === preset.name && styles.presetTextActive,
                ]}>
                  {preset.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Sliders */}
        <View style={styles.slidersSection}>
          <Text style={styles.sectionLabel}>Custom</Text>
          <View style={styles.sliders}>
            {BANDS.map((band, index) => (
              <View key={band} style={styles.sliderColumn}>
                <Text style={styles.sliderValue}>
                  {values[index] > 0 ? '+' : ''}{values[index]}dB
                </Text>
                <View style={styles.sliderWrapper}>
                  <Slider
                    style={styles.slider}
                    value={values[index]}
                    minimumValue={-12}
                    maximumValue={12}
                    step={1}
                    onValueChange={(value) => handleSliderChange(index, value)}
                    minimumTrackTintColor="#6366f1"
                    maximumTrackTintColor="rgba(255,255,255,0.2)"
                    thumbTintColor="#6366f1"
                    disabled={!isEnabled}
                  />
                </View>
                <Text style={styles.bandLabel}>{band}</Text>
              </View>
            ))}
          </View>
        </View>

        {!isEnabled && (
          <View style={styles.disabledOverlay}>
            <Text style={styles.disabledText}>Enable equalizer to adjust settings</Text>
          </View>
        )}
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(10, 10, 15, 0.95)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  toggleButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  toggleButtonActive: {
    backgroundColor: '#6366f1',
  },
  toggleText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    fontWeight: '600',
  },
  toggleTextActive: {
    color: '#fff',
  },
  presetsSection: {
    padding: 20,
  },
  sectionLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  presetButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  presetButtonActive: {
    backgroundColor: 'rgba(99, 102, 241, 0.25)',
    borderColor: '#6366f1',
    borderWidth: 1,
  },
  presetText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    fontWeight: '500',
  },
  presetTextActive: {
    color: '#6366f1',
  },
  slidersSection: {
    flex: 1,
    padding: 20,
  },
  sliders: {
    flexDirection: 'row',
    flex: 1,
    justifyContent: 'space-between',
  },
  sliderColumn: {
    alignItems: 'center',
    flex: 1,
  },
  sliderWrapper: {
    flex: 1,
    justifyContent: 'center',
    transform: [{ rotate: '-90deg' }],
    width: 200,
  },
  slider: {
    width: 180,
    height: 40,
  },
  sliderValue: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontWeight: '500',
  },
  bandLabel: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 11,
    marginTop: 4,
  },
  disabledOverlay: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  disabledText: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 14,
  },
});
