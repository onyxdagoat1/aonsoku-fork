import { supabase } from '@/lib/supabase'
import { ContentType } from './highlightsService'

export interface Collection {
  id: string
  title: string
  description: string | null
  cover_image_url: string | null
  created_by: string | null
  is_public: boolean
  created_at: string
  updated_at: string
  item_count?: number
}

export interface CollectionItem {
  id: string
  collection_id: string
  content_id: string
  content_type: ContentType
  display_order: number
  created_at: string
}

export interface CreateCollectionData {
  title: string
  description?: string
  cover_image_url?: string
  is_public?: boolean
}

class CollectionService {
  /**
   * Get all collections (public)
   */
  async getCollections(limit = 20): Promise<Collection[]> {
    const { data, error } = await supabase
      .from('collections')
      .select('*, items:collection_items(count)')
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching collections:', error)
      return []
    }

    return (data || []).map((c) => ({
      ...c,
      item_count: c.items?.[0]?.count || 0,
    }))
  }

  /**
   * Get collections by a specific user (e.g. Yeditor)
   */
  async getCollectionsByUser(userId: string): Promise<Collection[]> {
    const { data, error } = await supabase
      .from('collections')
      .select('*, items:collection_items(count)')
      .eq('created_by', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching user collections:', error)
      return []
    }

    return (data || []).map((c) => ({
      ...c,
      item_count: c.items?.[0]?.count || 0,
    }))
  }

  /**
   * Get a single collection by ID
   */
  async getCollection(id: string): Promise<Collection | null> {
    const { data, error } = await supabase
      .from('collections')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching collection:', error)
      return null
    }

    return data
  }

  /**
   * Get full collection with items
   */
  async getCollectionWithItems(
    id: string,
  ): Promise<{ collection: Collection; items: CollectionItem[] } | null> {
    const collection = await this.getCollection(id)
    if (!collection) return null

    const { data: items, error } = await supabase
      .from('collection_items')
      .select('*')
      .eq('collection_id', id)
      .order('display_order', { ascending: true })

    if (error) {
      console.error('Error fetching collection items:', error)
      return { collection, items: [] }
    }

    return { collection, items: items || [] }
  }

  /**
   * Create a new collection
   */
  async createCollection(
    data: CreateCollectionData,
  ): Promise<Collection | null> {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return null

    const { data: collection, error } = await supabase
      .from('collections')
      .insert({
        ...data,
        created_by: user.id,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating collection:', error)
      return null
    }

    return collection
  }

  /**
   * Add item to collection
   */
  async addItem(
    collectionId: string,
    contentId: string,
    contentType: ContentType,
  ): Promise<boolean> {
    // Get current max order
    const { data: maxItem } = await supabase
      .from('collection_items')
      .select('display_order')
      .eq('collection_id', collectionId)
      .order('display_order', { ascending: false })
      .limit(1)
      .maybeSingle()

    const nextOrder = (maxItem?.display_order ?? -1) + 1

    const { error } = await supabase.from('collection_items').insert({
      collection_id: collectionId,
      content_id: contentId,
      content_type: contentType,
      display_order: nextOrder,
    })

    if (error) {
      console.error('Error adding item to collection:', error)
      return false
    }

    return true
  }

  /**
   * Remove item from collection
   */
  async removeItem(itemId: string): Promise<boolean> {
    const { error } = await supabase
      .from('collection_items')
      .delete()
      .eq('id', itemId)

    if (error) {
      console.error('Error removing item from collection:', error)
      return false
    }

    return true
  }

  /**
   * Update collection metadata
   */
  async updateCollection(
    id: string,
    updates: Partial<CreateCollectionData>,
  ): Promise<Collection | null> {
    const { data, error } = await supabase
      .from('collections')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating collection:', error)
      return null
    }

    return data
  }

  /**
   * Delete collection
   */
  async deleteCollection(id: string): Promise<boolean> {
    const { error } = await supabase.from('collections').delete().eq('id', id)

    if (error) {
      console.error('Error deleting collection:', error)
      return false
    }

    return true
  }
}

export const collectionService = new CollectionService()
