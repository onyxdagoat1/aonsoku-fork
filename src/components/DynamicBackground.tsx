import { useDynamicBackground } from '@/hooks/useDynamicBackground'
import { useBackgroundSettings } from '@/store/layout.store'

export function DynamicBackground() {
  const { colors, blurAmount, enabled } = useDynamicBackground()
  const { animationSpeed } = useBackgroundSettings()

  if (!enabled) return null

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Primary gradient blob */}
      <div
        className="absolute top-0 left-0 w-full h-full transition-all duration-1000 ease-in-out"
        style={{
          background: `radial-gradient(circle at 20% 30%, ${colors.primary} 0%, transparent 50%)`,
          filter: `blur(${blurAmount}px)`,
          transitionDuration: `${1000 * animationSpeed}ms`,
        }}
      />
      
      {/* Secondary gradient blob */}
      <div
        className="absolute top-0 right-0 w-full h-full transition-all duration-1000 ease-in-out"
        style={{
          background: `radial-gradient(circle at 80% 20%, ${colors.secondary} 0%, transparent 50%)`,
          filter: `blur(${blurAmount}px)`,
          transitionDuration: `${1000 * animationSpeed}ms`,
          transitionDelay: '200ms',
        }}
      />
      
      {/* Accent gradient blob */}
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-full transition-all duration-1000 ease-in-out"
        style={{
          background: `radial-gradient(circle at 50% 80%, ${colors.accent} 0%, transparent 50%)`,
          filter: `blur(${blurAmount}px)`,
          transitionDuration: `${1000 * animationSpeed}ms`,
          transitionDelay: '400ms',
        }}
      />
      
      {/* Overlay to prevent washout */}
      <div className="absolute inset-0 bg-background/60" />
    </div>
  )
}
