import clsx from 'clsx'
import { Check, Minus, Pencil, Trash2, Download, Upload } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ContentItemTitle } from '@/app/components/settings/section'
import { ThemeCreatorDialog } from '@/app/components/theme-creator/theme-creator-dialog'
import { appThemes } from '@/app/observers/theme-observer'
import { useTheme } from '@/store/theme.store'
import { useCustomTheme } from '@/store/custom-theme.store'
import { Theme } from '@/types/themeContext'
import { CustomTheme } from '@/types/customTheme'
import { Button } from '@/app/components/ui/button'
import { toast } from 'react-toastify'
import { useState, useRef } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/app/components/ui/alert-dialog'
import { Plus } from 'lucide-react'

// Theme name mappings for better display names
const themeDisplayNames: Record<string, string> = {
  'black-and-white': 'Dark Mode',
  'night-owl-light': 'White Mode',
  'github-dark': 'GitHub Dark',
  'discord': 'Discord',
  'one-dark': 'One Dark',
  'marmalade-beaver': 'Dark Purple & Yellow',
  'bearded-solarized': 'Forest Blue',
  'shades-of-purple': 'Purple & Yellow',
  'catppuccin-mocha': 'Purple',
  'nuclear-dark': 'Cyberpunk',
  'achiever': 'White & Orange',
  'dracula': 'Amethyst',
  'tenacious-design': 'White & Pink',
}

export function ThemeSettingsPicker() {
  const { t } = useTranslation()
  const { theme: currentTheme, setTheme } = useTheme()
  const { customThemes, deleteCustomTheme, activeCustomTheme, setActiveCustomTheme, exportTheme, importTheme } = useCustomTheme()
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [editingTheme, setEditingTheme] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Clear custom theme CSS variables
  const clearCustomThemeVars = () => {
    const root = document.documentElement
    const customThemeKeys = [
      'background', 'background-foreground', 'foreground', 'card', 'card-foreground',
      'popover', 'popover-foreground', 'primary', 'primary-foreground',
      'secondary', 'secondary-foreground', 'muted', 'muted-foreground',
      'accent', 'accent-foreground', 'destructive', 'destructive-foreground',
      'border', 'input', 'ring'
    ]
    customThemeKeys.forEach(key => {
      root.style.removeProperty(`--${key}`)
    })
  }

  const applyCustomTheme = (theme: CustomTheme) => {
    const root = document.documentElement
    Object.entries(theme.colors).forEach(([key, value]) => {
      const cssVar = key.replace(/([A-Z])/g, '-$1').toLowerCase()
      root.style.setProperty(`--${cssVar}`, value)
    })
    setActiveCustomTheme(theme.id)
    toast.success(`Applied theme: ${theme.name}`)
  }

  const handleBuiltInThemeClick = (theme: Theme) => {
    clearCustomThemeVars()
    setTheme(theme)
    setActiveCustomTheme(null)
  }

  const handleDeleteTheme = (id: string) => {
    deleteCustomTheme(id)
    if (activeCustomTheme === id) {
      clearCustomThemeVars()
      setActiveCustomTheme(null)
    }
    setDeleteConfirm(null)
    toast.success('Theme deleted')
  }

  const handleExport = (id: string) => {
    const json = exportTheme(id)
    if (!json) {
      toast.error('Failed to export theme')
      return
    }
    
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `theme-${id}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('Theme exported!')
  }

  const handleImport = () => {
    fileInputRef.current?.click()
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      const theme = importTheme(text)
      if (theme) {
        toast.success(`Imported theme: ${theme.name}`)
      } else {
        toast.error('Failed to import theme')
      }
    } catch (error) {
      toast.error('Invalid theme file')
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleEditClick = (themeId: string) => {
    setEditingTheme(themeId)
    setDialogOpen(true)
  }

  const handleCreateClick = () => {
    setEditingTheme(null)
    setDialogOpen(true)
  }

  const handleDialogClose = () => {
    setDialogOpen(false)
    setEditingTheme(null)
  }

  return (
    <div className="h-full space-y-6">
      <div className="flex items-center justify-between">
        <ContentItemTitle>{t('theme.label')}</ContentItemTitle>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleImport} size="sm" className="gap-2">
            <Upload className="h-4 w-4" />
            Import
          </Button>
          <Button variant="default" onClick={handleCreateClick} size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Create Theme
          </Button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Built-in Themes */}
      <div>
        <h3 className="text-sm font-semibold mb-4">Built-in Themes</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {appThemes.map((theme) => {
            const isActive = theme === currentTheme && !activeCustomTheme

            return (
              <div 
                key={theme} 
                onClick={() => handleBuiltInThemeClick(theme)}
                className="cursor-pointer"
              >
                <ThemePlaceholder theme={theme} />
                <ThemeTitle theme={theme} isActive={isActive} displayName={themeDisplayNames[theme]} />
              </div>
            )
          })}
        </div>
      </div>

      {/* Custom Themes */}
      {customThemes.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-4">Your Custom Themes</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {customThemes.map((theme) => {
              const isActive = activeCustomTheme === theme.id

              return (
                <div key={theme.id} className="group relative">
                  <div onClick={() => applyCustomTheme(theme)} className="cursor-pointer">
                    <CustomThemePlaceholder theme={theme} />
                    <CustomThemeTitle theme={theme} isActive={isActive} />
                  </div>
                  
                  {/* Action Buttons - Show on hover */}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-7 w-7 p-0 bg-background/90 backdrop-blur-sm hover:bg-background"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleEditClick(theme.id)
                      }}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-7 w-7 p-0 bg-background/90 backdrop-blur-sm hover:bg-background"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleExport(theme.id)
                      }}
                    >
                      <Download className="h-3 w-3" />
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-7 w-7 p-0 bg-background/90 backdrop-blur-sm hover:bg-background"
                      onClick={(e) => {
                        e.stopPropagation()
                        setDeleteConfirm(theme.id)
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Theme Creator Dialog */}
      <ThemeCreatorDialog 
        editThemeId={editingTheme}
        onEditComplete={handleDialogClose}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Theme</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this theme? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirm && handleDeleteTheme(deleteConfirm)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export function ThemePlaceholder({ theme }: { theme: Theme }) {
  return (
    <div className={theme}>
      <div className="bg-background aspect-square border-2 border-border rounded-lg overflow-hidden flex hover:border-primary transition-all hover:shadow-lg">
        <div className="w-1/3 h-full bg-background border-r border-border flex flex-col p-1.5 gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="w-full h-1/5 bg-accent rounded-sm" />
          ))}
        </div>
        <div className="w-full h-full bg-background-foreground flex flex-col gap-1 p-1.5">
          <div className="w-full h-1/4 bg-accent rounded-sm" />
          <div className="w-full h-1/4 bg-primary rounded-sm" />
          <div className="w-full h-1/4 bg-muted rounded-sm" />
          <div className="w-full h-1/4 bg-secondary rounded-sm" />
        </div>
      </div>
    </div>
  )
}

function CustomThemePlaceholder({ theme }: { theme: CustomTheme }) {
  const { colors } = theme
  
  return (
    <div>
      <div 
        className="aspect-square border-2 border-border rounded-lg overflow-hidden flex hover:border-primary transition-all hover:shadow-lg"
        style={{ backgroundColor: `hsl(${colors.background})` }}
      >
        <div 
          className="w-1/3 h-full border-r flex flex-col p-1.5 gap-1"
          style={{ 
            backgroundColor: `hsl(${colors.background})`,
            borderColor: `hsl(${colors.border})`
          }}
        >
          {Array.from({ length: 5 }).map((_, i) => (
            <div 
              key={i} 
              className="w-full h-1/5 rounded-sm" 
              style={{ backgroundColor: `hsl(${colors.accent})` }}
            />
          ))}
        </div>
        <div 
          className="w-full h-full flex flex-col gap-1 p-1.5"
          style={{ backgroundColor: `hsl(${colors.backgroundForeground})` }}
        >
          <div 
            className="w-full h-1/4 rounded-sm" 
            style={{ backgroundColor: `hsl(${colors.accent})` }}
          />
          <div 
            className="w-full h-1/4 rounded-sm" 
            style={{ backgroundColor: `hsl(${colors.primary})` }}
          />
          <div 
            className="w-full h-1/4 rounded-sm" 
            style={{ backgroundColor: `hsl(${colors.muted})` }}
          />
          <div 
            className="w-full h-1/4 rounded-sm" 
            style={{ backgroundColor: `hsl(${colors.secondary})` }}
          />
        </div>
      </div>
    </div>
  )
}

type ThemeTitleProps = {
  isActive: boolean
  theme: Theme
  displayName?: string
}

export function ThemeTitle({ isActive, theme, displayName }: ThemeTitleProps) {
  const { t } = useTranslation()
  const name = displayName || t(`theme.${theme}`)

  return (
    <span
      className={clsx(
        'mt-2 flex items-center gap-1.5',
        !isActive && 'text-muted-foreground/70',
      )}
    >
      <Check
        size={14}
        strokeWidth={2.5}
        className={clsx(!isActive && 'hidden', 'text-primary')}
        aria-hidden="true"
      />
      <Minus
        size={14}
        strokeWidth={2.5}
        className={clsx(isActive && 'hidden')}
        aria-hidden="true"
      />
      <span className="text-xs font-medium truncate">{name}</span>
    </span>
  )
}

function CustomThemeTitle({ isActive, theme }: { isActive: boolean; theme: CustomTheme }) {
  return (
    <span
      className={clsx(
        'mt-2 flex items-center gap-1.5',
        !isActive && 'text-muted-foreground/70',
      )}
    >
      <Check
        size={14}
        strokeWidth={2.5}
        className={clsx(!isActive && 'hidden', 'text-primary')}
        aria-hidden="true"
      />
      <Minus
        size={14}
        strokeWidth={2.5}
        className={clsx(isActive && 'hidden')}
        aria-hidden="true"
      />
      <span className="text-xs font-medium truncate">{theme.name}</span>
    </span>
  )
}
