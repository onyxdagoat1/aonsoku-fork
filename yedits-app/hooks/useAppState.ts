import { useEffect, useRef, useState } from 'react'
import { AppState, AppStateStatus } from 'react-native'

export function useAppState(): AppStateStatus {
  const appState = useRef(AppState.currentState)
  const [currentState, setCurrentState] = useState(appState.current)

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      appState.current = nextState
      setCurrentState(nextState)
    })

    return () => subscription.remove()
  }, [])

  return currentState
}

export function useOnAppForeground(callback: () => void) {
  const appState = useRef(AppState.currentState)

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextState === 'active'
      ) {
        callback()
      }
      appState.current = nextState
    })

    return () => subscription.remove()
  }, [callback])
}

export function useOnAppBackground(callback: () => void) {
  const appState = useRef(AppState.currentState)

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (
        appState.current === 'active' &&
        nextState.match(/inactive|background/)
      ) {
        callback()
      }
      appState.current = nextState
    })

    return () => subscription.remove()
  }, [callback])
}
