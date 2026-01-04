import { supabase } from '@/lib/supabase'

export type AITag = 'human' | 'ai'
export type EditType =
  | 'highlight'
  | 'unique'
  | 'vanilla'
  | 'overhaul'
  | 'renovation'
  | 'extension'
  | 'remix'

export interface ContentTag {
  content_id: string
  content_type: 'album' | 'song'
  ai_tag: AITag | null
  edit_type: EditType | null
}

export const tagService = {
  async getTag(
    contentId: string,
    contentType: 'album' | 'song',
  ): Promise<{ aiTag: AITag | null; editType: EditType | null }> {
    const { data, error } = await supabase
      .from('content_tags')
      .select('ai_tag, edit_type')
      .eq('content_id', contentId)
      .eq('content_type', contentType)
      .single()

    if (error) return { aiTag: null, editType: null }
    return {
      aiTag: data?.ai_tag || null,
      editType: data?.edit_type || null,
    }
  },

  async getTagsForContent(
    contentIds: string[],
    contentType: 'album' | 'song',
  ): Promise<
    Record<string, { aiTag: AITag | null; editType: EditType | null }>
  > {
    if (contentIds.length === 0) return {}

    const { data, error } = await supabase
      .from('content_tags')
      .select('content_id, ai_tag, edit_type')
      .in('content_id', contentIds)
      .eq('content_type', contentType)

    if (error || !data) return {}

    return data.reduce(
      (acc, curr) => {
        acc[curr.content_id] = {
          aiTag: curr.ai_tag || null,
          editType: curr.edit_type || null,
        }
        return acc
      },
      {} as Record<string, { aiTag: AITag | null; editType: EditType | null }>,
    )
  },

  async setTag(
    contentId: string,
    contentType: 'album' | 'song',
    aiTag?: AITag | null,
    editType?: EditType | null,
  ): Promise<void> {
    const updateData: Record<string, unknown> = {
      content_id: contentId,
      content_type: contentType,
      updated_at: new Date().toISOString(),
    }

    if (aiTag !== undefined) {
      updateData.ai_tag = aiTag
    }
    if (editType !== undefined) {
      updateData.edit_type = editType
    }

    const { error } = await supabase
      .from('content_tags')
      .upsert(updateData, { onConflict: 'content_id, content_type' })

    if (error) throw error
  },

  async setTagsBatch(
    items: Array<{
      contentId: string
      contentType: 'album' | 'song'
      aiTag?: AITag | null
      editType?: EditType | null
    }>,
  ): Promise<void> {
    const upsertData = items.map((item) => ({
      content_id: item.contentId,
      content_type: item.contentType,
      ai_tag: item.aiTag ?? null,
      edit_type: item.editType ?? null,
      updated_at: new Date().toISOString(),
    }))

    const { error } = await supabase
      .from('content_tags')
      .upsert(upsertData, { onConflict: 'content_id, content_type' })

    if (error) throw error
  },

  async getAllAlbumTags(): Promise<
    Record<string, { aiTag: AITag | null; editType: EditType | null }>
  > {
    const { data, error } = await supabase
      .from('content_tags')
      .select('content_id, ai_tag, edit_type')
      .eq('content_type', 'album')

    if (error || !data) return {}

    return data.reduce(
      (acc, curr) => {
        acc[curr.content_id] = {
          aiTag: curr.ai_tag || null,
          editType: curr.edit_type || null,
        }
        return acc
      },
      {} as Record<string, { aiTag: AITag | null; editType: EditType | null }>,
    )
  },
}
