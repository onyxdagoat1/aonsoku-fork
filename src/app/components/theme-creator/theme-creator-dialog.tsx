import { useState, useEffect } from 'react'
import { Palette, Sparkles, Eye, Save } from 'lucide-react'
import { Button } from '@/app/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
    name: 'Blue',
    primary: '200 98% 39%',
    background: '220 13% 9%',
    backgroundForeground: '215 25% 15%',
    accent: '210 40% 25%',
  },
  {
    name: 'Green',
    primary: '142 71% 45%',
    background: '140 10% 10%',
    backgroundForeground: '145 20% 16%',
    accent: '145 30% 20%',
  },
  {
    name: 'Orange',
    primary: '25 95% 53%',
    background: '20 14% 10%',
    backgroundForeground: '25 25% 16%',
    accent: '30 40% 22%',
  },
  {
    name: 'Purple',
    primary: '270 70% 50%',
    background: '265 15% 10%',
    backgroundForeground: '270 25% 16%',
    accent: '270 35% 22%',
  },
  {
    name: 'Pink',
    primary: '330 81% 60%',
    background: '325 12% 10%',
    backgroundForeground: '330 22% 16%',
    accent: '330 35% 22%',
  },
  {
    name: 'Cyan',
    primary: '180 100% 50%',
    background: '200 15% 8%',
    backgroundForeground: '185 25% 14%',
    accent: '185 40% 20%',
  },
]

// Function to extract colors from a built-in theme by applying it temporarily
const getThemeColors = (themeName: string): Partial<ThemeColors> => {
  const temp = document.createElement('div')
  temp.className = themeName
  temp.style.display = 'none'
  document.body.appendChild(temp)
  
  const computedStyle = getComputedStyle(temp)
  const extractColor = (varName: string) => {
    const value = computedStyle.getPropertyValue(`--${varName}`).trim()
    return value || undefined
  }
  
  const colors: Partial<ThemeColors> = {
    background: extractColor('background'),
    backgroundForeground: extractColor('background-foreground'),
    foreground: extractColor('foreground'),
    primary: extractColor('primary'),
    secondary: extractColor('secondary'),
    muted: extractColor('muted'),
    accent: extractColor('accent'),
    border: extractColor('border'),
    input: extractColor('input'),
  }
  
  document.body.removeChild(temp)
  return colors
}

const baseColors: Array<{ key: keyof ThemeColors; label: string; description: string }> = [
  { key: 'background', label: 'Background', description: 'Main app background' },
  { key: 'backgroundForeground', label: 'Content Background', description: 'Content area (blue background)' },
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

interface ThemeCreatorDialogProps {
  editThemeId?: string | null
  onEditComplete?: () => void
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function ThemeCreatorDialog({ editThemeId, onEditComplete, open, onOpenChange }: ThemeCreatorDialogProps) {
  const [themeName, setThemeName] = useState('')
  const [colors, setColors] = useState<ThemeColors>(defaultColors)
  const [step, setStep] = useState<'preset' | 'customize'>('preset')
  const [isEditing, setIsEditing] = useState(false)

  const { addCustomTheme, updateCustomTheme, getCustomTheme } = useCustomTheme()
  const { setTheme } = useTheme()

  const isOpen = open || false
  const setIsOpen = onOpenChange || (() => {})

  // Load theme for editing
  useEffect(() => {
    if (editThemeId && isOpen) {
      const theme = getCustomTheme(editThemeId)
      if (theme) {
        setThemeName(theme.name)
        setColors(theme.colors)
        setStep('customize')
        setIsEditing(true)
      }
    } else if (!isOpen) {
      resetForm()
    }
  }, [editThemeId, isOpen, getCustomTheme])

  const handleColorChange = (key: keyof ThemeColors, value: string) => {
    setColors((prev) => ({ ...prev, [key]: value }))
  }

  const applyPreset = (preset: typeof colorPresets[0]) => {
    setColors((prev) => ({
      ...prev,
      primary: preset.primary,
      background: preset.background,
      backgroundForeground: preset.backgroundForeground,
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

  const applyBuiltInTheme = (themeName: string, displayName: string) => {
    const themeColors = getThemeColors(themeName)
    setColors((prev) => ({
      ...prev,
      ...themeColors,
    }))
    setThemeName(displayName)
    setStep('customize')
  }

  const handleSave = () => {
    if (!themeName.trim()) {
      toast.error('Please enter a theme name')
      return
    }

    const theme: CustomTheme = {
      id: isEditing && editThemeId ? editThemeId : `custom-${Date.now()}`,
      name: themeName,
      colors,
      createdAt: isEditing ? getCustomTheme(editThemeId!)?.createdAt || Date.now() : Date.now(),
      updatedAt: Date.now(),
    }

    if (isEditing && editThemeId) {
      updateCustomTheme(editThemeId, theme)
      toast.success(`Theme "${themeName}" updated!`)
    } else {
      addCustomTheme(theme)
      toast.success(`Theme "${themeName}" created!`)
    }
    
    // Apply the theme immediately
    const root = document.documentElement
    Object.entries(theme.colors).forEach(([key, value]) => {
      const cssVar = key.replace(/([A-Z])/g, '-$1').toLowerCase()
      root.style.setProperty(`--${cssVar}`, value)
    })
    
    resetForm()
    setIsOpen(false)
    onEditComplete?.()
  }

  const resetForm = () => {
    setThemeName('')
    setColors(defaultColors)
    setStep('preset')
    setIsEditing(false)
  }

  const startFromScratch = () => {
    setColors(defaultColors)
    setStep('customize')
  }

  // Built-in themes to show as starting points
  const builtInThemes = [
    { id: 'github-dark', name: 'GitHub Dark' },
    { id: 'discord', name: 'Discord' },
    { id: 'one-dark', name: 'One Dark' },
    { id: 'night-owl-light', name: 'White Mode' },
    { id: 'noctis-lilac', name: 'Lilac' },
    { id: 'dracula', name: 'Amethyst' },
    { id: 'shades-of-purple', name: 'Purple & Yellow' },
    { id: 'catppuccin-mocha', name: 'Purple' },
    { id: 'nuclear-dark', name: 'Cyberpunk' },
    { id: 'marmalade-beaver', name: 'Dark Purple & Yellow' },
    { id: 'bearded-solarized', name: 'Forest Blue' },
    { id: 'achiever', name: 'White & Orange' },
    { id: 'tinacious-design', name: 'White & Pink' },
  ]

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-[95vw] lg:max-w-5xl h-[85vh] p-0 flex flex-col">
        <DialogHeader className="px-4 lg:px-6 pt-4 lg:pt-6 pb-3 lg:pb-4 flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-xl lg:text-2xl">
            <Sparkles className="h-5 w-5 lg:h-6 lg:w-6 text-primary" />
            {isEditing ? 'Edit Your Theme' : 'Create Your Perfect Theme'}
          </DialogTitle>
          <DialogDescription className="text-sm">
            {isEditing ? 'Update your theme colors' : 'Start with a preset or customize every detail'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-4 lg:px-6 min-h-0">
          {step === 'preset' && !isEditing ? (
            <div className="pb-6 space-y-6">
              {/* Color Presets */}
              <div>
                <h3 className="text-base lg:text-lg font-semibold mb-3 lg:mb-4">Color Presets</h3>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
                  {colorPresets.map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => applyPreset(preset)}
                      className="group relative p-3 lg:p-4 rounded-lg border-2 border-border hover:border-primary transition-all overflow-hidden"
                    >
                      <div className="flex gap-2 mb-2 lg:mb-3">
                        <div
                          className="w-10 h-10 lg:w-12 lg:h-12 rounded-md"
                          style={{ backgroundColor: hslToHex(preset.primary) }}
                        />
                        <div className="flex flex-col gap-1">
                          <div
                            className="w-10 h-4 lg:w-12 lg:h-5 rounded-sm"
                            style={{ backgroundColor: hslToHex(preset.background) }}
                          />
                          <div
                            className="w-10 h-4 lg:w-12 lg:h-5 rounded-sm"
                            style={{ backgroundColor: hslToHex(preset.backgroundForeground) }}
                          />
                        </div>
                      </div>
                      <p className="font-medium text-left text-sm lg:text-base">{preset.name}</p>
                      <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Built-in Themes */}
              <div>
                <h3 className="text-base lg:text-lg font-semibold mb-3 lg:mb-4">Built-in Themes</h3>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
                  {builtInThemes.map((theme) => (
                    <button
                      key={theme.id}
                      onClick={() => applyBuiltInTheme(theme.id, theme.name)}
                      className={`${theme.id} group relative p-3 lg:p-4 rounded-lg border-2 border-border hover:border-primary transition-all overflow-hidden`}
                    >
                      <div className="flex gap-2 mb-2 lg:mb-3">
                        <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-md bg-primary" />
                        <div className="flex flex-col gap-1">
                          <div className="w-10 h-4 lg:w-12 lg:h-5 rounded-sm bg-background" />
                          <div className="w-10 h-4 lg:w-12 lg:h-5 rounded-sm bg-background-foreground" />
                        </div>
                      </div>
                      <p className="font-medium text-left text-sm lg:text-base">{theme.name}</p>
                      <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Start from Scratch */}
              <div className="pt-3 lg:pt-4 border-t pb-4">
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
            <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 pb-6">
              {/* Color Controls */}
              <div className="flex-1 min-w-0">
                <div className="mb-4">
                  <Label htmlFor="theme-name" className="text-sm lg:text-base font-semibold">
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
                    <div className="space-y-6">
                      {baseColors.map(({ key, label, description }) => (
                        <div key={key} className="space-y-2">
                          <div>
                            <Label className="font-semibold text-sm">{label}</Label>
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
                  </TabsContent>
                  <TabsContent value="ui" className="mt-4">
                    <div className="space-y-6">
                      {uiColors.map(({ key, label, description }) => (
                        <div key={key} className="space-y-2">
                          <div>
                            <Label className="font-semibold text-sm">{label}</Label>
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
                  </TabsContent>
                </Tabs>
              </div>

              {/* Live Preview */}
              <div className="w-full lg:w-96 flex-shrink-0">
                <div className="lg:sticky lg:top-0">
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
        <div className="flex flex-col sm:flex-row justify-between items-center gap-2 px-4 lg:px-6 py-3 lg:py-4 border-t bg-muted/30 flex-shrink-0">
          <div className="w-full sm:w-auto">
            {step === 'customize' && !isEditing && (
              <Button
                variant="ghost"
                onClick={() => setStep('preset')}
                className="w-full sm:w-auto"
              >
                ← Back to Presets
              </Button>
            )}
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={() => {
                resetForm()
                setIsOpen(false)
              }}
              className="flex-1 sm:flex-none"
            >
              Cancel
            </Button>
            {step === 'customize' && (
              <Button onClick={handleSave} className="gap-2 flex-1 sm:flex-none">
                <Save className="h-4 w-4" />
                {isEditing ? 'Update' : 'Save & Apply'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
