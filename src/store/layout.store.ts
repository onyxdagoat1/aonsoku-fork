import { devtools, persist, subscribeWithSelector } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import { createWithEqualityFn } from 'zustand/traditional'
import { shallow } from 'zustand/shallow'

export type GridSize = 'small' | 'medium' | 'large'
export type ListDensity = 'compact' | 'comfortable' | 'spacious'
export type SidebarWidth = 'narrow' | 'normal' | 'wide'

interface ILayoutContext {
  grid: {
    size: GridSize
    setSize: (size: GridSize) => void
  }
  list: {
    density: ListDensity
    setDensity: (density: ListDensity) => void
  }
  sidebar: {
    width: SidebarWidth
    setWidth: (width: SidebarWidth) => void
    isCollapsed: boolean
    setIsCollapsed: (collapsed: boolean) => void
  }
  backgrounds: {
    enabled: boolean
    setEnabled: (enabled: boolean) => void
    intensity: number
    setIntensity: (intensity: number) => void
    animationSpeed: number
    setAnimationSpeed: (speed: number) => void
    blurAmount: number
    setBlurAmount: (blur: number) => void
  }
  actions: {
    resetToDefaults: () => void
  }
}

const defaultState = {
  grid: {
    size: 'medium' as GridSize,
  },
  list: {
    density: 'comfortable' as ListDensity,
  },
  sidebar: {
    width: 'normal' as SidebarWidth,
    isCollapsed: false,
  },
  backgrounds: {
    enabled: true,
    intensity: 0.5,
    animationSpeed: 1,
    blurAmount: 60,
  },
}

export const useLayoutStore = createWithEqualityFn<ILayoutContext>()(
  subscribeWithSelector(
    persist(
      devtools(
        immer((set) => ({
          grid: {
            size: defaultState.grid.size,
            setSize: (size) => {
              set((state) => {
                state.grid.size = size
              })
            },
          },
          list: {
            density: defaultState.list.density,
            setDensity: (density) => {
              set((state) => {
                state.list.density = density
              })
            },
          },
          sidebar: {
            width: defaultState.sidebar.width,
            setWidth: (width) => {
              set((state) => {
                state.sidebar.width = width
              })
            },
            isCollapsed: defaultState.sidebar.isCollapsed,
            setIsCollapsed: (collapsed) => {
              set((state) => {
                state.sidebar.isCollapsed = collapsed
              })
            },
          },
          backgrounds: {
            enabled: defaultState.backgrounds.enabled,
            setEnabled: (enabled) => {
              set((state) => {
                state.backgrounds.enabled = enabled
              })
            },
            intensity: defaultState.backgrounds.intensity,
            setIntensity: (intensity) => {
              set((state) => {
                state.backgrounds.intensity = intensity
              })
            },
            animationSpeed: defaultState.backgrounds.animationSpeed,
            setAnimationSpeed: (speed) => {
              set((state) => {
                state.backgrounds.animationSpeed = speed
              })
            },
            blurAmount: defaultState.backgrounds.blurAmount,
            setBlurAmount: (blur) => {
              set((state) => {
                state.backgrounds.blurAmount = blur
              })
            },
          },
          actions: {
            resetToDefaults: () => {
              set((state) => {
                state.grid.size = defaultState.grid.size
                state.list.density = defaultState.list.density
                state.sidebar.width = defaultState.sidebar.width
                state.sidebar.isCollapsed = defaultState.sidebar.isCollapsed
                state.backgrounds.enabled = defaultState.backgrounds.enabled
                state.backgrounds.intensity = defaultState.backgrounds.intensity
                state.backgrounds.animationSpeed = defaultState.backgrounds.animationSpeed
                state.backgrounds.blurAmount = defaultState.backgrounds.blurAmount
              })
            },
          },
        })),
        {
          name: 'layout_store',
        },
      ),
      {
        name: 'layout_store',
        version: 1,
      },
    ),
  ),
  shallow,
)

export const useGridSize = () => useLayoutStore((state) => state.grid)
export const useListDensity = () => useLayoutStore((state) => state.list)
export const useSidebarLayout = () => useLayoutStore((state) => state.sidebar)
export const useBackgroundSettings = () => useLayoutStore((state) => state.backgrounds)
export const useLayoutActions = () => useLayoutStore((state) => state.actions)
