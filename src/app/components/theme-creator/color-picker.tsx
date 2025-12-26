import { useState, useEffect } from 'react'
import { Label } from '@/app/components/ui/label'
import { Input } from '@/app/components/ui/input'
import { Slider } from '@/app/components/ui/slider'
import { Popover, PopoverContent, PopoverTrigger } from '@/app/components/ui/popover'
import { hslToHex, hexToHsl } from '@/utils/theme-utils'
import { Button } from '@/app/components/ui/button'
import { Pipette } from 'lucide-react'

interface ColorPickerProps {
  label: string
  value: string // HSL format: "220 13% 16%"
  onChange: (value: string) => void
}

export function ColorPicker({ label, value, onChange }: ColorPickerProps) {
  const [hexValue, setHexValue] = useState(hslToHex(value))
  const [hslValues, setHslValues] = useState(() => {
    const parts = value.split(' ')
    return {
      h: parseInt(parts[0]) || 0,
      s: parseInt(parts[1]) || 0,
      l: parseInt(parts[2]) || 0,
    }
  })

  useEffect(() => {
    const parts = value.split(' ')
    const newHsl = {
      h: parseInt(parts[0]) || 0,
      s: parseInt(parts[1]) || 0,
      l: parseInt(parts[2]) || 0,
    }
    setHslValues(newHsl)
    setHexValue(hslToHex(value))
  }, [value])

  const handleHexChange = (hex: string) => {
    setHexValue(hex)
    const hsl = hexToHsl(hex)
    onChange(hsl)
  }

  const handleHslChange = (type: 'h' | 's' | 'l', newValue: number) => {
    const newHsl = { ...hslValues, [type]: newValue }
    setHslValues(newHsl)
    const hslString = `${newHsl.h} ${newHsl.s}% ${newHsl.l}%`
    onChange(hslString)
    setHexValue(hslToHex(hslString))
  }

  return (
    <div className="space-y-3">
      {label && <Label className="text-sm font-medium">{label}</Label>}
      
      <div className="flex gap-3 items-start">
        {/* Color Preview and Picker */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-20 h-20 p-1 rounded-lg border-2 hover:border-primary transition-colors"
              style={{ backgroundColor: hexValue }}
            >
              <div className="w-full h-full rounded-md" style={{ backgroundColor: hexValue }} />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64">
            <div className="space-y-4">
              <div>
                <Label className="text-xs text-muted-foreground mb-2 block">
                  Pick a Color
                </Label>
                <input
                  type="color"
                  value={hexValue}
                  onChange={(e) => handleHexChange(e.target.value)}
                  className="w-full h-32 rounded cursor-pointer border-0"
                  style={{ padding: 0 }}
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Hex Value</Label>
                <Input
                  type="text"
                  value={hexValue}
                  onChange={(e) => handleHexChange(e.target.value)}
                  className="mt-1 font-mono"
                />
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* HSL Sliders */}
        <div className="flex-1 space-y-3">
          {/* Hue */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <Label className="text-xs text-muted-foreground">Hue</Label>
              <span className="text-xs font-mono text-muted-foreground">{hslValues.h}°</span>
            </div>
            <Slider
              value={[hslValues.h]}
              onValueChange={([v]) => handleHslChange('h', v)}
              max={360}
              step={1}
              className="w-full"
            />
          </div>

          {/* Saturation */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <Label className="text-xs text-muted-foreground">Saturation</Label>
              <span className="text-xs font-mono text-muted-foreground">{hslValues.s}%</span>
            </div>
            <Slider
              value={[hslValues.s]}
              onValueChange={([v]) => handleHslChange('s', v)}
              max={100}
              step={1}
              className="w-full"
            />
          </div>

          {/* Lightness */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <Label className="text-xs text-muted-foreground">Lightness</Label>
              <span className="text-xs font-mono text-muted-foreground">{hslValues.l}%</span>
            </div>
            <Slider
              value={[hslValues.l]}
              onValueChange={([v]) => handleHslChange('l', v)}
              max={100}
              step={1}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* HSL String Display */}
      <div>
        <Label className="text-xs text-muted-foreground">HSL Value</Label>
        <Input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="mt-1 font-mono text-xs"
          placeholder="220 13% 16%"
        />
      </div>
    </div>
  )
}
