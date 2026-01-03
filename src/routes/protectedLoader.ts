import { redirect } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { ROUTES } from '@/routes/routesList'
import { useAppStore } from '@/store/app.store'

export async function protectedLoader() {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Always require Supabase auth to access the app.
  if (!session?.user) {
    return redirect(ROUTES.SERVER_CONFIG)
  }

  const { url, password, isServerConfigured, username } =
    useAppStore.getState().data
  const hasNoUrl = !url || url === ''
  const hasNoToken = !password || password === ''
  const hasNoUser = !username || username === ''

  // If the server is configured locally, we allow the user into the app.
  // We removed the pingView() check here to prevent the "redirect loop"
  // if the music server is slow or temporarily down.
  if (hasNoUrl || hasNoToken || hasNoUser || !isServerConfigured) {
    return redirect(ROUTES.SERVER_CONFIG)
  }

  return null
}

export async function podcastsLoader() {
  const { active } = useAppStore.getState().podcasts

  if (!active) {
    return redirect(ROUTES.LIBRARY.HOME)
  }

  return null
}
