import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

// Types
export interface Comment {
  id: string;
  user_id: string;
  song_id?: string;
  album_id?: string;
  artist_id?: string;
  content: string;
  created_at: string;
  user?: {
    username: string;
    avatar_url?: string;
  };
}

export interface Rating {
  id: string;
  user_id: string;
  song_id?: string;
  album_id?: string;
  rating: number; // 1-5
  created_at: string;
}

export interface SocialProfile {
  id: string;
  username: string;
  display_name?: string;
  avatar_url?: string;
  bio?: string;
  created_at: string;
}

// Query keys
export const socialKeys = {
  comments: {
    bySong: (songId: string) => ['comments', 'song', songId] as const,
    byAlbum: (albumId: string) => ['comments', 'album', albumId] as const,
    byArtist: (artistId: string) => ['comments', 'artist', artistId] as const,
  },
  ratings: {
    bySong: (songId: string) => ['ratings', 'song', songId] as const,
    byAlbum: (albumId: string) => ['ratings', 'album', albumId] as const,
    myRating: (type: string, id: string) => ['ratings', 'my', type, id] as const,
  },
  profile: {
    current: () => ['profile', 'current'] as const,
    byId: (id: string) => ['profile', id] as const,
  },
  listening: {
    recent: () => ['listening', 'recent'] as const,
    friends: () => ['listening', 'friends'] as const,
  },
};

// =========== COMMENTS ===========

export function useSongComments(songId: string) {
  return useQuery({
    queryKey: socialKeys.comments.bySong(songId),
    queryFn: async () => {
      if (!supabase) return [];
      
      const { data, error } = await supabase
        .from('comments')
        .select(`
          id, content, created_at, user_id,
          profiles:user_id (username, avatar_url)
        `)
        .eq('song_id', songId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Comment[];
    },
    enabled: isSupabaseConfigured() && !!songId,
  });
}

export function useAlbumComments(albumId: string) {
  return useQuery({
    queryKey: socialKeys.comments.byAlbum(albumId),
    queryFn: async () => {
      if (!supabase) return [];
      
      const { data, error } = await supabase
        .from('comments')
        .select(`
          id, content, created_at, user_id,
          profiles:user_id (username, avatar_url)
        `)
        .eq('album_id', albumId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Comment[];
    },
    enabled: isSupabaseConfigured() && !!albumId,
  });
}

export function useAddComment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      content, 
      songId, 
      albumId, 
      artistId 
    }: { 
      content: string; 
      songId?: string; 
      albumId?: string; 
      artistId?: string;
    }) => {
      if (!supabase) throw new Error('Supabase not configured');
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('comments')
        .insert({
          user_id: user.id,
          content,
          song_id: songId,
          album_id: albumId,
          artist_id: artistId,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, { songId, albumId, artistId }) => {
      if (songId) queryClient.invalidateQueries({ queryKey: socialKeys.comments.bySong(songId) });
      if (albumId) queryClient.invalidateQueries({ queryKey: socialKeys.comments.byAlbum(albumId) });
      if (artistId) queryClient.invalidateQueries({ queryKey: socialKeys.comments.byArtist(artistId) });
    },
  });
}

export function useDeleteComment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (commentId: string) => {
      if (!supabase) throw new Error('Supabase not configured');
      
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      // Invalidate all comment queries
      queryClient.invalidateQueries({ queryKey: ['comments'] });
    },
  });
}

// =========== RATINGS ===========

export function useSongRatings(songId: string) {
  return useQuery({
    queryKey: socialKeys.ratings.bySong(songId),
    queryFn: async () => {
      if (!supabase) return { average: 0, count: 0 };
      
      const { data, error } = await supabase
        .from('ratings')
        .select('rating')
        .eq('song_id', songId);
      
      if (error) throw error;
      
      if (!data || data.length === 0) {
        return { average: 0, count: 0 };
      }
      
      const sum = data.reduce((acc, r) => acc + r.rating, 0);
      return { 
        average: sum / data.length, 
        count: data.length 
      };
    },
    enabled: isSupabaseConfigured() && !!songId,
  });
}

export function useMyRating(type: 'song' | 'album', id: string) {
  return useQuery({
    queryKey: socialKeys.ratings.myRating(type, id),
    queryFn: async () => {
      if (!supabase) return null;
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      const column = type === 'song' ? 'song_id' : 'album_id';
      
      const { data, error } = await supabase
        .from('ratings')
        .select('id, rating')
        .eq('user_id', user.id)
        .eq(column, id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: isSupabaseConfigured() && !!id,
  });
}

export function useRateSong() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ songId, rating }: { songId: string; rating: number }) => {
      if (!supabase) throw new Error('Supabase not configured');
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      
      // Upsert rating
      const { data, error } = await supabase
        .from('ratings')
        .upsert({
          user_id: user.id,
          song_id: songId,
          rating,
        }, { onConflict: 'user_id,song_id' })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, { songId }) => {
      queryClient.invalidateQueries({ queryKey: socialKeys.ratings.bySong(songId) });
      queryClient.invalidateQueries({ queryKey: socialKeys.ratings.myRating('song', songId) });
    },
  });
}

// =========== PROFILE ===========

export function useCurrentProfile() {
  return useQuery({
    queryKey: socialKeys.profile.current(),
    queryFn: async () => {
      if (!supabase) return null;
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      return data as SocialProfile;
    },
    enabled: isSupabaseConfigured(),
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (updates: Partial<SocialProfile>) => {
      if (!supabase) throw new Error('Supabase not configured');
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: socialKeys.profile.current() });
    },
  });
}

// =========== LISTENING ACTIVITY ===========

export function useRecentListening() {
  return useQuery({
    queryKey: socialKeys.listening.recent(),
    queryFn: async () => {
      if (!supabase) return [];
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('listening_history')
        .select('*')
        .eq('user_id', user.id)
        .order('played_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data;
    },
    enabled: isSupabaseConfigured(),
  });
}

export function useLogListening() {
  return useMutation({
    mutationFn: async ({ songId, duration }: { songId: string; duration: number }) => {
      if (!supabase) return;
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { error } = await supabase
        .from('listening_history')
        .insert({
          user_id: user.id,
          song_id: songId,
          duration_played: duration,
          played_at: new Date().toISOString(),
        });
      
      if (error) console.error('Failed to log listening:', error);
    },
  });
}
