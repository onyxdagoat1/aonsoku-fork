import { GridSize, ListDensity, SidebarWidth } from '@/store/layout.store'
import {
  GRID_SIZE_CLASSES,
  LIST_DENSITY_CLASSES,
  SIDEBAR_WIDTH_CLASSES,
} from '@/types/layoutContext'
import { cn } from '@/lib/utils'

/**
 * Get Tailwind classes for grid size
 */
export function getGridClasses(size: GridSize, additionalClasses?: string): string {
  return cn(GRID_SIZE_CLASSES[size], additionalClasses)
}

/**
 * Get Tailwind classes for list density
 */
export function getListClasses(
  density: ListDensity,
  type: 'row' | 'text' = 'row',
  additionalClasses?: string,
): string {
  return cn(LIST_DENSITY_CLASSES[density][type], additionalClasses)
}

/**
 * Get Tailwind classes for sidebar width
 */
export function getSidebarClasses(
  width: SidebarWidth,
  additionalClasses?: string,
): string {
  return cn(SIDEBAR_WIDTH_CLASSES[width], additionalClasses)
}

/**
 * Hook-friendly helper to get all layout classes
 */
export function useLayoutClasses() {
  return {
    getGridClasses,
    getListClasses,
    getSidebarClasses,
  }
}
