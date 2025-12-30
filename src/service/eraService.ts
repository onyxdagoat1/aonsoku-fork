import { supabase } from '@/lib/supabase'

export const eraService = {
  async getEra(
    contentId: string,
    contentType: 'album' | 'song',
  ): Promise<string | null> {
    const { data, error } = await supabase
      .from('content_eras')
      .select('era_id')
      .eq('content_id', contentId)
      .eq('content_type', contentType)
      .single()

    if (error) return null
    return data?.era_id || null
  },

  async getErasForContent(
    contentIds: string[],
    contentType: 'album' | 'song',
  ): Promise<Record<string, string>> {
    const { data, error } = await supabase
      .from('content_eras')
      .select('content_id, era_id')
      .in('content_id', contentIds)
      .eq('content_type', contentType)

    if (error || !data) return {}

    return data.reduce(
      (acc, curr) => {
        acc[curr.content_id] = curr.era_id
        return acc
      },
      {} as Record<string, string>,
    )
  },

  async setEra(
    contentId: string,
    contentType: 'album' | 'song',
    eraId: string,
  ) {
    const { error } = await supabase.from('content_eras').upsert(
      {
        content_id: contentId,
        content_type: contentType,
        era_id: eraId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'content_id, content_type' },
    )

    if (error) throw error
  },
  async getAllAlbumEras(): Promise<Record<string, string>> {
    const { data, error } = await supabase
      .from('content_eras')
      .select('content_id, era_id')
      .eq('content_type', 'album')

    if (error || !data) return {}

    return data.reduce(
      (acc, curr) => {
        acc[curr.content_id] = curr.era_id
        return acc
      },
      {} as Record<string, string>,
    )
  },
}
