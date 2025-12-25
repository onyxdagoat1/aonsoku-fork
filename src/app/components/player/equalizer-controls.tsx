import { Sliders } from 'lucide-react'
import { Button } from '@/app/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/app/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select'
import { Slider } from '@/app/components/ui/slider'
import { Switch } from '@/app/components/ui/switch'
import { Label } from '@/app/components/ui/label'
import { cn } from '@/lib/utils'
import { EQUALIZER_PRESETS, EQ_FREQUENCIES } from '@/hooks/use-audio-equalizer'

interface EqualizerControlsProps {
  enabled: boolean
  onToggleEnabled: () => void
  gains: number[]
  onGainChange: (index: number, gain: number) => void
  activePreset: string
  onPresetChange: (preset: string) => void
  onReset: () => void
}

export function EqualizerControls({
  enabled,
  onToggleEnabled,
  gains,
  onGainChange,
  activePreset,
  onPresetChange,
  onReset,
}: EqualizerControlsProps) {
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
          title="Equalizer"
        >
          <Sliders className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px]" align="start">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h4 className="font-semibold">Equalizer</h4>
            <div className="flex items-center gap-2">
              <Switch checked={enabled} onCheckedChange={onToggleEnabled} />
              <Label>Enable</Label>
            </div>
          </div>

          {/* Preset Selection */}
          <div className="space-y-2">
            <Label>Preset</Label>
            <div className="flex gap-2">
              <Select value={activePreset} onValueChange={onPresetChange}>
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EQUALIZER_PRESETS.map((preset) => (
                    <SelectItem key={preset.name} value={preset.name}>
                      {preset.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={onReset}
                disabled={!enabled}
              >
                Reset
              </Button>
            </div>
          </div>

          {/* EQ Bands */}
          <div className="space-y-3">
            <Label>Bands</Label>
            <div className="grid grid-cols-5 gap-3">
              {gains.map((gain, index) => (
                <div key={index} className="flex flex-col items-center gap-2">
                  <div className="text-xs font-medium text-muted-foreground">
                    {EQ_FREQUENCIES[index] >= 1000
                      ? `${EQ_FREQUENCIES[index] / 1000}k`
                      : EQ_FREQUENCIES[index]}
                  </div>
                  <Slider
                    value={[gain]}
                    onValueChange={([value]) => onGainChange(index, value)}
                    min={-12}
                    max={12}
                    step={0.5}
                    orientation="vertical"
                    className="h-24"
                    disabled={!enabled}
                  />
                  <div className="text-xs font-mono w-12 text-center">
                    {gain > 0 ? '+' : ''}
                    {gain.toFixed(1)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Info */}
          <div className="text-xs text-muted-foreground">
            Adjust frequency bands from -12dB to +12dB
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
