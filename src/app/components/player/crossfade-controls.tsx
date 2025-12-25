import { Shuffle } from 'lucide-react'
import { Button } from '@/app/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/app/components/ui/popover'
import { Slider } from '@/app/components/ui/slider'
import { Switch } from '@/app/components/ui/switch'
import { Label } from '@/app/components/ui/label'
import { cn } from '@/lib/utils'

interface CrossfadeControlsProps {
  enabled: boolean
  onToggleEnabled: () => void
  duration: number
  onDurationChange: (duration: number) => void
}

export function CrossfadeControls({
  enabled,
  onToggleEnabled,
  duration,
  onDurationChange,
}: CrossfadeControlsProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'h-8 w-8 rounded-full',
            enabled && 'text-primary bg-primary/10',
          )}
          title="Crossfade"
        >
          <Shuffle className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px]" align="start">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h4 className="font-semibold">Crossfade</h4>
            <div className="flex items-center gap-2">
              <Switch checked={enabled} onCheckedChange={onToggleEnabled} />
              <Label>Enable</Label>
            </div>
          </div>

          {/* Duration Slider */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>Duration</Label>
              <span className="text-sm font-medium">{duration.toFixed(1)}s</span>
            </div>
            <Slider
              value={[duration]}
              onValueChange={([value]) => onDurationChange(value)}
              min={0.5}
              max={10}
              step={0.5}
              disabled={!enabled}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0.5s</span>
              <span>5s</span>
              <span>10s</span>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="space-y-2">
            <Label>Quick Durations</Label>
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 5].map((preset) => (
                <Button
                  key={preset}
                  variant={duration === preset ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onDurationChange(preset)}
                  disabled={!enabled}
                  className="text-xs"
                >
                  {preset}s
                </Button>
              ))}
            </div>
          </div>

          {/* Info */}
          <div className="text-xs text-muted-foreground">
            {enabled
              ? 'Songs will fade in/out when changing tracks'
              : 'Enable crossfade for smooth transitions between tracks'}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
