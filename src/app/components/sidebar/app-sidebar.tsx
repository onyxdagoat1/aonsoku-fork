import CommandMenu from '@/app/components/command/command-menu'
import {
  MainSidebar,
  MainSidebarContent,
  MainSidebarHeader,
  MainSidebarRail,
} from '@/app/components/ui/main-sidebar'
import { appName } from '@/utils/appName'
import { MiniSidebarSearch } from './mini-search'
import { SidebarMiniSeparator } from './mini-separator'
import { MobileCloseButton } from './mobile-close-button'
import { NavLibrary } from './nav-library'
import { NavMain } from './nav-main'
import { NavPlaylists } from './nav-playlists'

export function AppSidebar({
  ...props
}: React.ComponentProps<typeof MainSidebar>) {
  return (
    <MainSidebar collapsible="icon" {...props}>
      <MobileCloseButton />
      <MainSidebarHeader>
        <div className="flex items-center gap-3 px-2 pb-2">
          <img
            src="/resources/icons/yedits-YE-logo-white1.webp"
            alt={appName}
            className="h-8 w-auto object-contain"
          />
        </div>
        <CommandMenu />
      </MainSidebarHeader>
      <MiniSidebarSearch />
      <NavMain />
      <SidebarMiniSeparator />
      <MainSidebarContent className="max-h-fit flex-none overflow-x-clip">
        <NavLibrary />
      </MainSidebarContent>
      <NavPlaylists />
      <MainSidebarRail />
    </MainSidebar>
  )
}
