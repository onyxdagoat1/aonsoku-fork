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
import { EQUALIZER_PRESETS, EQ_FREQUENCIES } from '@/app/hooks/use-audio-equalizer'

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
      <PopoverContent className="w-[520px] p-0" align="start" side="top">
        <div className="space-y-0">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-background to-muted/20">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10 ring-1 ring-primary/20">
                <Sliders className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold text-sm">Audio Equalizer</h4>
                <p className="text-xs text-muted-foreground">10-band frequency control</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch 
                checked={enabled} 
                onCheckedChange={onToggleEnabled}
                id="eq-enable"
              />
              <Label htmlFor="eq-enable" className="text-sm font-medium cursor-pointer">
                {enabled ? 'On' : 'Off'}
              </Label>
            </div>
          </div>

          {/* Preset Section */}
          <div className="px-4 py-3 bg-muted/30 border-b">
            <div className="flex items-center gap-2">
              <Label className="text-xs font-medium text-muted-foreground min-w-[50px]">Preset</Label>
              <Select value={activePreset} onValueChange={onPresetChange} disabled={!enabled}>
                <SelectTrigger className="h-8 text-xs flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EQUALIZER_PRESETS.map((preset) => (
                    <SelectItem key={preset.name} value={preset.name} className="text-xs">
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
                className="h-8 text-xs px-3"
              >
                Reset
              </Button>
            </div>
          </div>

          {/* EQ Sliders */}
          <div className="px-6 py-8">
            <div className="flex items-end gap-4 justify-between">
              {gains.map((gain, index) => (
                <div key={index} className="flex flex-col items-center gap-3 flex-1 group">
                  {/* Gain value indicator (top) */}
                  <div className={cn(
                    "text-[10px] font-mono font-semibold min-w-[36px] px-1.5 py-0.5 rounded-md text-center transition-colors",
                    enabled && gain !== 0 
                      ? "bg-primary/10 text-primary ring-1 ring-primary/20" 
                      : "bg-muted/50 text-muted-foreground"
                  )}>
                    {gain > 0 ? '+' : ''}{gain.toFixed(1)}
                  </div>
                  
                  {/* Slider */}
                  <div className="relative h-36 flex items-center">
                    {/* Zero line indicator */}
                    <div className="absolute left-1/2 -translate-x-1/2 w-8 h-[1px] bg-border" style={{ top: '50%' }} />
                    <Slider
                      value={[gain]}
                      onValueChange={([value]) => onGainChange(index, value)}
                      min={-12}
                      max={12}
                      step={0.5}
                      orientation="vertical"
                      className="h-full"
                      disabled={!enabled}
                    />
                  </div>
                  
                  {/* Frequency label (bottom) */}
                  <div className="text-[10px] font-semibold text-muted-foreground text-center min-w-[36px]">
                    {EQ_FREQUENCIES[index] >= 1000
                      ? `${(EQ_FREQUENCIES[index] / 1000).toFixed(EQ_FREQUENCIES[index] === 1000 ? 0 : 1)}k`
                      : EQ_FREQUENCIES[index]}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer with scale indicators */}
          <div className="px-6 py-3 border-t bg-muted/20">
            <div className="flex items-center justify-between text-[10px]">
              <div className="flex items-center gap-4 text-muted-foreground">
                <span className="font-medium">+12dB</span>
                <span className="font-medium">0dB</span>
                <span className="font-medium">-12dB</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={cn(
                  "w-1.5 h-1.5 rounded-full transition-colors",
                  enabled ? "bg-primary" : "bg-muted-foreground"
                )}></div>
                <span className="text-muted-foreground font-medium">
                  {enabled ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
