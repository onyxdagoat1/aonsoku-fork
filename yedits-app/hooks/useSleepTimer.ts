import { useEffect, useRef, useState, useCallback } from 'react';
import { usePlayerStore } from '@/store/player.store';
import * as Haptics from 'expo-haptics';

export interface SleepTimerState {
  isActive: boolean;
  remainingMinutes: number;
  endTime: Date | null;
}

const TIMER_PRESETS = [15, 30, 45, 60, 90, 120]; // minutes

export function useSleepTimer() {
  const [state, setState] = useState<SleepTimerState>({
    isActive: false,
    remainingMinutes: 0,
    endTime: null,
  });
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const { pause } = usePlayerStore();

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setState({
      isActive: false,
      remainingMinutes: 0,
      endTime: null,
    });
  }, []);

  const setTimer = useCallback((minutes: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Clear any existing timer
    clearTimer();

    if (minutes <= 0) return;

    const endTime = new Date(Date.now() + minutes * 60 * 1000);
    
    setState({
      isActive: true,
      remainingMinutes: minutes,
      endTime,
    });

    // Update every minute
    timerRef.current = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, Math.ceil((endTime.getTime() - now) / 60000));
      
      if (remaining <= 0) {
        // Timer expired - pause playback
        pause();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        clearTimer();
      } else {
        setState((prev) => ({
          ...prev,
          remainingMinutes: remaining,
        }));
      }
    }, 60000);
  }, [pause, clearTimer]);

  const extendTimer = useCallback((additionalMinutes: number) => {
    if (!state.isActive || !state.endTime) return;
    
    const newEndTime = new Date(state.endTime.getTime() + additionalMinutes * 60 * 1000);
    const remaining = Math.ceil((newEndTime.getTime() - Date.now()) / 60000);
    
    setState((prev) => ({
      ...prev,
      remainingMinutes: remaining,
      endTime: newEndTime,
    }));
  }, [state]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  return {
    ...state,
    presets: TIMER_PRESETS,
    setTimer,
    extendTimer,
    clearTimer,
  };
}
