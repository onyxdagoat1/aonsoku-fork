import { SettingsOptions } from '@/app/components/settings/options'
import { useAppSettings } from '@/store/app.store'
import { Accounts } from './accounts'
import { Appearance } from './appearance'
import { Desktop } from './desktop'

const pages: Record<SettingsOptions, JSX.Element> = {
  appearance: <Appearance />,
  accounts: <Accounts />,
  desktop: <Desktop />,
}

export function Pages() {
  const { currentPage } = useAppSettings()

  return pages[currentPage]
}
