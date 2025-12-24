import { Moon, Sun } from 'lucide-react'
import { Button } from '@/app/components/ui/button'
import { useTheme } from '@/store/theme.store'
import { Theme } from '@/types/themeContext'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  const isDarkMode = theme !== Theme.Black

  const toggleTheme = () => {
    if (isDarkMode) {
      setTheme(Theme.Black)
    } else {
      setTheme(Theme.NoctisLilac)
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="h-8 w-8"
      aria-label="Toggle theme"
    >
      {isDarkMode ? (
        <Moon className="h-4 w-4" />
      ) : (
        <Sun className="h-4 w-4" />
      )}
    </Button>
  )
}
