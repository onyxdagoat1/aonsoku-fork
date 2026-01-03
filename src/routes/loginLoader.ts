import { redirect } from 'react-router-dom'
import { ROUTES } from '@/routes/routesList'
import { supabase } from '@/lib/supabase'

export async function loginLoader() {
  // Check Supabase auth first; if logged in, redirect to home
  const { data: { session } } = await supabase.auth.getSession()
  if (session?.user) {
    return redirect(ROUTES.LIBRARY.HOME)
  }

  // Do NOT block on Navidrome connectivity here.
  // The auth page should render even if Navidrome is down.
  return null
}
