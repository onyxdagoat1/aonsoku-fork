import { Label } from '@/lib/components/ui/label'
import { Switch } from '@/lib/components/ui/switch'
import { Slider } from '@/lib/components/ui/slider'
import { useBackgroundSettings } from '@/store/layout.store'
import { Palette, Gauge, Sparkles } from 'lucide-react'

export function BackgroundSettingsPanel() {
  const {
    enabled,
    setEnabled,
    intensity,
    setIntensity,
    animationSpeed,
    setAnimationSpeed,
    blurAmount,
    setBlurAmount,
  } = useBackgroundSettings()

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Dynamic Backgrounds</h3>

      {/* Enable/Disable */}
      <div className="flex items-center justify-between space-x-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-muted-foreground" />
          <Label htmlFor="bg-enabled" className="text-sm font-medium">
            Enable Music-Reactive Backgrounds
          </Label>
        </div>
        <Switch id="bg-enabled" checked={enabled} onCheckedChange={setEnabled} />
      </div>

      {enabled && (
        <>
          {/* Intensity */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Palette className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="bg-intensity" className="text-sm font-medium">
                  Color Intensity
                </Label>
              </div>
              <span className="text-sm text-muted-foreground">
                {Math.round(intensity * 100)}%
              </span>
            </div>
            <Slider
              id="bg-intensity"
              min={0.1}
              max={1}
              step={0.05}
              value={[intensity]}
              onValueChange={([value]) => setIntensity(value)}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Controls how vibrant the background colors appear
            </p>
          </div>

          {/* Animation Speed */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Gauge className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="bg-speed" className="text-sm font-medium">
                  Animation Speed
                </Label>
              </div>
              <span className="text-sm text-muted-foreground">
                {animationSpeed}x
              </span>
            </div>
            <Slider
              id="bg-speed"
              min={0.5}
              max={3}
              step={0.1}
              value={[animationSpeed]}
              onValueChange={([value]) => setAnimationSpeed(value)}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              How quickly colors transition when songs change
            </p>
          </div>

          {/* Blur Amount */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="bg-blur" className="text-sm font-medium">
                Blur Amount
              </Label>
              <span className="text-sm text-muted-foreground">
                {blurAmount}px
              </span>
            </div>
            <Slider
              id="bg-blur"
              min={20}
              max={120}
              step={5}
              value={[blurAmount]}
              onValueChange={([value]) => setBlurAmount(value)}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Higher values create softer, more diffused backgrounds
            </p>
          </div>
        </>
      )}

      <div className="rounded-lg border border-border bg-muted/50 p-4">
        <p className="text-sm text-muted-foreground">
          <strong>Note:</strong> Dynamic backgrounds extract colors from album artwork
          and create animated gradients that change with each song. This feature uses
          client-side processing and won't impact server performance.
        </p>
      </div>
    </div>
  )
}
