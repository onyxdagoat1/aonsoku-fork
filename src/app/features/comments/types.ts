export interface Comment {
  id: number
  entity_type: 'artist' | 'album' | 'compilation' | 'single'
  entity_id: string
  user_id: string
  user_name: string
  content: string
  likes: number
  user_has_liked: boolean
  created_at: string
  updated_at: string
}

export interface CreateCommentDto {
  entity_type: 'artist' | 'album' | 'compilation' | 'single'
  entity_id: string
  user_id: string
  user_name: string
  content: string
}
