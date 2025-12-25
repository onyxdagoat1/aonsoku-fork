import { Gauge } from 'lucide-react'
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
import { SPEED_PRESETS } from '@/hooks/use-playback-speed'

interface SpeedControlsProps {
  speed: number
  onSpeedChange: (speed: number) => void
  preservePitch: boolean
  onTogglePreservePitch: () => void
  onReset: () => void
}

export function SpeedControls({
  speed,
  onSpeedChange,
  preservePitch,
  onTogglePreservePitch,
  onReset,
}: SpeedControlsProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'h-8 w-8 rounded-full',
            speed !== 1 && 'text-primary bg-primary/10',
          )}
          title="Playback Speed"
        >
          <Gauge className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px]" align="start">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h4 className="font-semibold">Playback Speed</h4>
            <div className="text-lg font-bold">{speed.toFixed(2)}x</div>
          </div>

          {/* Slider */}
          <div className="space-y-2">
            <Slider
              value={[speed]}
              onValueChange={([value]) => onSpeedChange(value)}
              min={0.25}
              max={2}
              step={0.05}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0.25x</span>
              <span>1.0x</span>
              <span>2.0x</span>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="space-y-2">
            <Label>Quick Presets</Label>
            <div className="grid grid-cols-4 gap-2">
              {SPEED_PRESETS.map((preset) => (
                <Button
                  key={preset.value}
                  variant={speed === preset.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onSpeedChange(preset.value)}
                  className="text-xs"
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Preserve Pitch */}
          <div className="flex items-center justify-between pt-2 border-t">
            <Label htmlFor="preserve-pitch">Preserve Pitch</Label>
            <Switch
              id="preserve-pitch"
              checked={preservePitch}
              onCheckedChange={onTogglePreservePitch}
            />
          </div>

          {/* Reset Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={onReset}
            className="w-full"
            disabled={speed === 1}
          >
            Reset to Normal
          </Button>

          {/* Info */}
          <div className="text-xs text-muted-foreground">
            {preservePitch
              ? 'Audio pitch is preserved at different speeds'
              : 'Audio pitch will change with speed'}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
