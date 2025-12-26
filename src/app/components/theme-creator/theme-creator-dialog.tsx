import { useState } from 'react'
import { Palette, Sparkles, Eye, Save, Plus } from 'lucide-react'
import { Button } from '@/app/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/app/components/ui/dialog'
import { Input } from '@/app/components/ui/input'
import { Label } from '@/app/components/ui/label'
import { ScrollArea } from '@/app/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs'
import { useCustomTheme } from '@/store/custom-theme.store'
import { useTheme } from '@/store/theme.store'
import { CustomTheme, ThemeColors } from '@/types/customTheme'
import { ColorPicker } from './color-picker'
import { ThemePreview } from './theme-preview'
import { toast } from 'react-toastify'
import { hslToHex } from '@/utils/theme-utils'

const defaultColors: ThemeColors = {
  background: '224 71.4% 8.1%',
  backgroundForeground: '222 47% 11%',
  foreground: '210 20% 95%',
  card: '224 71.4% 8.1%',
  cardForeground: '210 20% 95%',
  popover: '224 71.4% 8.1%',
  popoverForeground: '210 20% 95%',
  primary: '160 84% 39%',
  primaryForeground: '210 20% 95%',
  secondary: '215 27.9% 19.9%',
  secondaryForeground: '210 20% 95%',
  muted: '215 27.9% 14.9%',
  mutedForeground: '217.9 10.6% 64.9%',
  accent: '215 27.9% 19.9%',
  accentForeground: '210 20% 95%',
  destructive: '0 62.8% 30.6%',
  destructiveForeground: '210 20% 95%',
  border: '215 27.9% 19.9%',
  input: '215 27.9% 19.9%',
  ring: '160 84% 39%',
}

// Color presets for quick start
const colorPresets = [
  {
    name: 'Ocean Blue',
    primary: '200 98% 39%',
    background: '220 13% 9%',
    accent: '210 40% 25%',
  },
  {
    name: 'Forest Green',
    primary: '142 71% 45%',
    background: '140 10% 10%',
    accent: '145 30% 20%',
  },
  {
    name: 'Sunset Orange',
    primary: '25 95% 53%',
    background: '20 14% 10%',
    accent: '30 40% 22%',
  },
  {
    name: 'Purple Haze',
    primary: '270 70% 50%',
    background: '265 15% 10%',
    accent: '270 35% 22%',
  },
  {
    name: 'Rose Pink',
    primary: '330 81% 60%',
    background: '325 12% 10%',
    accent: '330 35% 22%',
  },
  {
    name: 'Cyber Cyan',
    primary: '180 100% 50%',
    background: '200 15% 8%',
    accent: '185 40% 20%',
  },
]

const baseColors: Array<{ key: keyof ThemeColors; label: string; description: string }> = [
  { key: 'background', label: 'Background', description: 'Main background color' },
  { key: 'foreground', label: 'Text', description: 'Primary text color' },
  { key: 'primary', label: 'Primary', description: 'Main accent color' },
  { key: 'secondary', label: 'Secondary', description: 'Secondary color' },
]

const uiColors: Array<{ key: keyof ThemeColors; label: string; description: string }> = [
  { key: 'muted', label: 'Muted', description: 'Subtle backgrounds' },
  { key: 'accent', label: 'Accent', description: 'Highlighted items' },
  { key: 'border', label: 'Border', description: 'Component borders' },
  { key: 'input', label: 'Input', description: 'Input backgrounds' },
]

export function ThemeCreatorDialog() {
  const [open, setOpen] = useState(false)
  const [themeName, setThemeName] = useState('')
  const [colors, setColors] = useState<ThemeColors>(defaultColors)
  const [step, setStep] = useState<'preset' | 'customize'>('preset')

  const { addCustomTheme } = useCustomTheme()
  const { setTheme } = useTheme()

  const handleColorChange = (key: keyof ThemeColors, value: string) => {
    setColors((prev) => ({ ...prev, [key]: value }))
  }

  const applyPreset = (preset: typeof colorPresets[0]) => {
    setColors((prev) => ({
      ...prev,
      primary: preset.primary,
      background: preset.background,
      accent: preset.accent,
      card: preset.background,
      popover: preset.background,
      secondary: preset.accent,
      muted: preset.accent,
      border: preset.accent,
      input: preset.accent,
      ring: preset.primary,
    }))
    setThemeName(preset.name)
    setStep('customize')
  }

  const handleSave = () => {
    if (!themeName.trim()) {
      toast.error('Please enter a theme name')
      return
    }

    const theme: CustomTheme = {
      id: `custom-${Date.now()}`,
      name: themeName,
      colors,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }

    addCustomTheme(theme)
    
    // Apply the theme immediately
    const root = document.documentElement
    Object.entries(theme.colors).forEach(([key, value]) => {
      const cssVar = key.replace(/([A-Z])/g, '-$1').toLowerCase()
      root.style.setProperty(`--${cssVar}`, value)
    })
    
    toast.success(`Theme "${themeName}" created and applied!`)
    resetForm()
    setOpen(false)
  }

  const resetForm = () => {
    setThemeName('')
    setColors(defaultColors)
    setStep('preset')
  }

  const startFromScratch = () => {
    setColors(defaultColors)
    setStep('customize')
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen)
        if (!isOpen) resetForm()
      }}
    >
      <DialogTrigger asChild>
        <Button variant="default" className="gap-2">
          <Plus className="h-4 w-4" />
          Create Theme
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl max-h-[90vh] p-0">
        <div className="flex flex-col h-full">
          <DialogHeader className="px-6 pt-6 pb-4">
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <Sparkles className="h-6 w-6 text-primary" />
              Create Your Perfect Theme
            </DialogTitle>
            <DialogDescription>
              Start with a preset or customize every detail
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-hidden">
            {step === 'preset' ? (
              <div className="px-6 pb-6">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-4">Choose a Starting Point</h3>
                  <div className="grid grid-cols-3 gap-4">
                    {colorPresets.map((preset) => (
                      <button
                        key={preset.name}
                        onClick={() => applyPreset(preset)}
                        className="group relative p-4 rounded-lg border-2 border-border hover:border-primary transition-all overflow-hidden"
                      >
                        <div className="flex gap-2 mb-3">
                          <div
                            className="w-12 h-12 rounded-md"
                            style={{ backgroundColor: hslToHex(preset.primary) }}
                          />
                          <div className="flex flex-col gap-1">
                            <div
                              className="w-12 h-5 rounded-sm"
                              style={{ backgroundColor: hslToHex(preset.background) }}
                            />
                            <div
                              className="w-12 h-5 rounded-sm"
                              style={{ backgroundColor: hslToHex(preset.accent) }}
                            />
                          </div>
                        </div>
                        <p className="font-medium text-left">{preset.name}</p>
                        <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ))}
                  </div>
                </div>
                <div className="pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={startFromScratch}
                    className="w-full"
                  >
                    <Palette className="h-4 w-4 mr-2" />
                    Start from Scratch
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex gap-6 px-6 pb-6 h-full">
                {/* Color Controls */}
                <div className="flex-1">
                  <div className="mb-4">
                    <Label htmlFor="theme-name" className="text-base font-semibold">
                      Theme Name
                    </Label>
                    <Input
                      id="theme-name"
                      value={themeName}
                      onChange={(e) => setThemeName(e.target.value)}
                      placeholder="My Awesome Theme"
                      className="mt-2"
                    />
                  </div>

                  <Tabs defaultValue="base" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="base">Base Colors</TabsTrigger>
                      <TabsTrigger value="ui">UI Elements</TabsTrigger>
                    </TabsList>
                    <TabsContent value="base" className="mt-4">
                      <ScrollArea className="h-[400px] pr-4">
                        <div className="space-y-6">
                          {baseColors.map(({ key, label, description }) => (
                            <div key={key} className="space-y-2">
                              <div>
                                <Label className="font-semibold">{label}</Label>
                                <p className="text-xs text-muted-foreground">{description}</p>
                              </div>
                              <ColorPicker
                                label=""
                                value={colors[key]}
                                onChange={(value) => handleColorChange(key, value)}
                              />
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </TabsContent>
                    <TabsContent value="ui" className="mt-4">
                      <ScrollArea className="h-[400px] pr-4">
                        <div className="space-y-6">
                          {uiColors.map(({ key, label, description }) => (
                            <div key={key} className="space-y-2">
                              <div>
                                <Label className="font-semibold">{label}</Label>
                                <p className="text-xs text-muted-foreground">{description}</p>
                              </div>
                              <ColorPicker
                                label=""
                                value={colors[key]}
                                onChange={(value) => handleColorChange(key, value)}
                              />
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </TabsContent>
                  </Tabs>
                </div>

                {/* Live Preview */}
                <div className="w-96">
                  <div className="sticky top-0">
                    <div className="flex items-center gap-2 mb-3">
                      <Eye className="h-4 w-4 text-muted-foreground" />
                      <Label className="text-sm font-semibold">Live Preview</Label>
                    </div>
                    <ThemePreview colors={colors} themeName={themeName || 'Preview'} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center px-6 py-4 border-t bg-muted/30">
            {step === 'customize' && (
              <Button
                variant="ghost"
                onClick={() => setStep('preset')}
              >
                ← Back to Presets
              </Button>
            )}
            {step === 'preset' && <div />}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  resetForm()
                  setOpen(false)
                }}
              >
                Cancel
              </Button>
              {step === 'customize' && (
                <Button onClick={handleSave} className="gap-2">
                  <Save className="h-4 w-4" />
                  Save & Apply Theme
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
