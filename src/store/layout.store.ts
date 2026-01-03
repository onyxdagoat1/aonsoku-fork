import { devtools, persist, subscribeWithSelector } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import { shallow } from 'zustand/shallow'
import { createWithEqualityFn } from 'zustand/traditional'

export type GridSize = 'small' | 'medium' | 'large'
export type ListDensity = 'compact' | 'comfortable' | 'spacious'
export type SidebarWidth = 'narrow' | 'normal' | 'wide'

interface ILayoutContext {
  gridSize: GridSize
  setGridSize: (size: GridSize) => void
  listDensity: ListDensity
  setListDensity: (density: ListDensity) => void
  sidebarCompact: boolean
  setSidebarCompact: (compact: boolean) => void
  actions: {
    resetToDefaults: () => void
  }
}

const defaultState = {
  gridSize: 'medium' as GridSize,
  listDensity: 'comfortable' as ListDensity,
  sidebarCompact: false,
}

export const useLayoutStore = createWithEqualityFn<ILayoutContext>()(
  subscribeWithSelector(
    persist(
      devtools(
        immer((set) => ({
          gridSize: defaultState.gridSize,
          setGridSize: (size) =>
            set((state) => {
              state.gridSize = size
            }),
          listDensity: defaultState.listDensity,
          setListDensity: (density) =>
            set((state) => {
              state.listDensity = density
            }),
          sidebarCompact: defaultState.sidebarCompact,
          setSidebarCompact: (compact) =>
            set((state) => {
              state.sidebarCompact = compact
            }),
          actions: {
            resetToDefaults: () => {
              set((state) => {
                state.gridSize = defaultState.gridSize
                state.listDensity = defaultState.listDensity
                state.sidebarCompact = defaultState.sidebarCompact
              })
            },
          },
        })),
        { name: 'layout_store' },
      ),
      { name: 'layout_store', version: 2 },
    ),
  ),
  shallow,
)

export const useLayoutActions = () => useLayoutStore((state) => state.actions)
