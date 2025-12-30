import { Loader2 } from 'lucide-react'
import { Suspense, useEffect } from 'react'
import { isDesktop } from 'react-device-detect'
import { RouterProvider } from 'react-router-dom'
import { Linux } from '@/app/components/controls/linux'
import { SettingsDialog } from '@/app/components/settings/dialog'
import { Toaster } from '@/app/components/ui/toaster'
import { LangObserver } from '@/app/observers/lang-observer'
import { MediaSessionObserver } from '@/app/observers/media-session-observer'
import { ThemeObserver } from '@/app/observers/theme-observer'
import { ToastContainer } from '@/app/observers/toast-container'
import { UpdateObserver } from '@/app/observers/update-observer'
import { Mobile } from '@/app/pages/mobile'
import { router } from '@/routes/router'
import { isDesktop as isElectron, isLinux } from '@/utils/desktop'
import { SafeErrorBoundary } from './app/components/error/SafeErrorBoundary'

function App() {
  useEffect(() => {
    // Handle Google OAuth callback for hash router
    // When Google redirects to http://localhost:3000?code=..., we need to move that to /#/youtube/callback?code=...
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    const state = params.get('state')

    if (code && (!window.location.hash || window.location.hash === '#/')) {
      // Clear the search params from the main URL to avoid loop/ugliness and move to hash
      const newUrl = `${window.location.pathname}#/youtube/callback?code=${code}&state=${state || ''}`
      window.location.href = newUrl
    }
  }, [])

  if (!isDesktop && window.innerHeight > window.innerWidth) return <Mobile /> // Support tablets but not phones

  return (
    <>
      {isElectron() && <UpdateObserver />}
      <MediaSessionObserver />
      <LangObserver />
      <ThemeObserver />
      <SettingsDialog />
      <SafeErrorBoundary>
        <Suspense
          fallback={
            <div className="flex h-screen w-screen items-center justify-center bg-background">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          }
        >
          <RouterProvider router={router} />
        </Suspense>
      </SafeErrorBoundary>
      <ToastContainer />
      <Toaster />
      {isLinux && <Linux />}
    </>
  )
}

export default App
