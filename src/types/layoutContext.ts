export type GridSize = 'small' | 'medium' | 'large'
export type ListDensity = 'compact' | 'comfortable' | 'spacious'
export type SidebarWidth = 'narrow' | 'normal' | 'wide'

export const GRID_SIZE_CLASSES: Record<GridSize, string> = {
  small: 'grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3',
  medium: 'grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4',
  large: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6',
}

export const LIST_DENSITY_CLASSES: Record<ListDensity, { row: string; text: string }> = {
  compact: {
    row: 'h-10 text-sm',
    text: 'text-xs',
  },
  comfortable: {
    row: 'h-14 text-base',
    text: 'text-sm',
  },
  spacious: {
    row: 'h-16 text-lg',
    text: 'text-base',
  },
}

export const SIDEBAR_WIDTH_CLASSES: Record<SidebarWidth, string> = {
  narrow: 'w-48',
  normal: 'w-64',
  wide: 'w-80',
}
