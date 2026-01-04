import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStarMutation, useStarredSongs } from '@/hooks/useQueries';
import * as Haptics from 'expo-haptics';

interface FavoriteButtonProps {
  songId?: string;
  albumId?: string;
  artistId?: string;
  isStarred?: boolean;
  size?: 'small' | 'medium' | 'large';
  onToggle?: (isStarred: boolean) => void;
}

export function FavoriteButton({ 
  songId, 
  albumId, 
  artistId, 
  isStarred: initialStarred = false,
  size = 'medium',
  onToggle 
}: FavoriteButtonProps) {
  const starMutation = useStarMutation();
  const [isStarred, setIsStarred] = React.useState(initialStarred);
  
  const iconSize = size === 'small' ? 18 : size === 'medium' ? 24 : 32;

  const handlePress = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    const id = songId || albumId || artistId;
    if (!id) return;

    // Optimistic update
    setIsStarred(!isStarred);
    onToggle?.(!isStarred);

    try {
      await starMutation.mutateAsync({ id, isStarred });
    } catch (error) {
      // Revert on error
      setIsStarred(isStarred);
      onToggle?.(isStarred);
      console.error('Failed to star:', error);
    }
  };

  return (
    <TouchableOpacity 
      style={styles.button}
      onPress={handlePress}
      disabled={starMutation.isPending}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Ionicons 
        name={isStarred ? 'heart' : 'heart-outline'} 
        size={iconSize} 
        color={isStarred ? '#f472b6' : 'rgba(255,255,255,0.6)'} 
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: 4,
  },
});
