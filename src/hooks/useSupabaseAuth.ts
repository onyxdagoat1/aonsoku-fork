import { useEffect } from 'react'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { useAppStore } from '@/store/app.store'

/**
 * Hook to sync Navidrome authentication with Supabase profiles
 * Creates or updates a profile in Supabase whenever user logs in to Navidrome
 */
export function useSupabaseAuth() {
  const username = useAppStore((state) => state.auth.username)
  const isAuthenticated = useAppStore((state) => state.auth.authenticated)

  useEffect(() => {
    if (!isSupabaseConfigured || !isAuthenticated || !username) {
      return
    }

    const syncProfile = async () => {
      try {
        // Check if profile exists
        const { data: existingProfile, error: fetchError } = await supabase
          .from('profiles')
          .select('*')
          .eq('navidrome_username', username)
          .single()

        if (fetchError && fetchError.code !== 'PGRST116') {
          // PGRST116 = no rows returned, which is fine
          console.error('Error checking profile:', fetchError)
          return
        }

        if (existingProfile) {
          // Profile exists, update last_login
          const { error: updateError } = await supabase
            .from('profiles')
            .update({
              updated_at: new Date().toISOString(),
            })
            .eq('id', existingProfile.id)

          if (updateError) {
            console.error('Error updating profile:', updateError)
          } else {
            console.log('✅ Supabase profile synced for user:', username)
          }
        } else {
          // Create new profile
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({
              navidrome_username: username,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })

          if (insertError) {
            console.error('Error creating profile:', insertError)
          } else {
            console.log('✅ Supabase profile created for user:', username)
          }
        }
      } catch (error) {
        console.error('Error syncing Supabase profile:', error)
      }
    }

    syncProfile()
  }, [username, isAuthenticated])
}
