import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Star, ThumbsUp, ThumbsDown } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent } from '@/app/components/ui/card';
import { toast } from 'react-toastify';

interface RatingWidgetProps {
  contentType: 'track' | 'album';
  contentId: string;
  showAggregate?: boolean;
}

export function RatingWidget({ contentType, contentId, showAggregate = true }: RatingWidgetProps) {
  const { user, profile } = useAuth();
  const [starRating, setStarRating] = useState<number | null>(null);
  const [thumbsUp, setThumbsUp] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [aggregate, setAggregate] = useState({
    avgStars: 0,
    totalStars: 0,
    thumbsUpCount: 0,
    thumbsDownCount: 0,
  });

  useEffect(() => {
    if (user && profile) {
      loadUserRating();
    }
    if (showAggregate) {
      loadAggregate();
    }
  }, [user, profile, contentType, contentId]);

  const loadUserRating = async () => {
    if (!user || !profile) return;

    try {
      // Get star rating
      const { data: starData } = await supabase
        .from('ratings')
        .select('star_rating')
        .eq('user_id', profile.id)
        .eq('content_type', contentType)
        .eq('content_id', contentId)
        .eq('rating_type', 'star')
        .single();

      if (starData) {
        setStarRating(starData.star_rating);
      }

      // Get thumbs rating
      const { data: thumbsData } = await supabase
        .from('ratings')
        .select('thumbs_up')
        .eq('user_id', profile.id)
        .eq('content_type', contentType)
        .eq('content_id', contentId)
        .eq('rating_type', 'thumbs')
        .single();

      if (thumbsData) {
        setThumbsUp(thumbsData.thumbs_up);
      }
    } catch (error) {
      // No rating found, that's okay
    }
  };

  const loadAggregate = async () => {
    try {
      // Get star ratings aggregate
      const { data: starRatings } = await supabase
        .from('ratings')
        .select('star_rating')
        .eq('content_type', contentType)
        .eq('content_id', contentId)
        .eq('rating_type', 'star');

      if (starRatings && starRatings.length > 0) {
        const total = starRatings.reduce((sum, r) => sum + (r.star_rating || 0), 0);
        setAggregate(prev => ({
          ...prev,
          avgStars: total / starRatings.length,
          totalStars: starRatings.length,
        }));
      }

      // Get thumbs ratings
      const { data: thumbsRatings } = await supabase
        .from('ratings')
        .select('thumbs_up')
        .eq('content_type', contentType)
        .eq('content_id', contentId)
        .eq('rating_type', 'thumbs');

      if (thumbsRatings) {
        const upCount = thumbsRatings.filter(r => r.thumbs_up).length;
        const downCount = thumbsRatings.filter(r => !r.thumbs_up).length;
        setAggregate(prev => ({
          ...prev,
          thumbsUpCount: upCount,
          thumbsDownCount: downCount,
        }));
      }
    } catch (error) {
      console.error('Error loading aggregate ratings:', error);
    }
  };

  const handleStarRating = async (rating: number) => {
    if (!user || !profile) {
      toast.info('Please log in to rate');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('ratings')
        .upsert({
          user_id: profile.id,
          content_type: contentType,
          content_id: contentId,
          rating_type: 'star',
          star_rating: rating,
        }, {
          onConflict: 'user_id,content_type,content_id,rating_type',
        });

      if (error) throw error;

      setStarRating(rating);
      toast.success('Rating saved!');
      loadAggregate();
    } catch (error: any) {
      console.error('Error saving rating:', error);
      toast.error('Failed to save rating');
    } finally {
      setLoading(false);
    }
  };

  const handleThumbs = async (up: boolean) => {
    if (!user || !profile) {
      toast.info('Please log in to rate');
      return;
    }

    setLoading(true);
    try {
      const newValue = thumbsUp === up ? null : up; // Toggle if same, otherwise set

      if (newValue === null) {
        // Remove rating
        const { error } = await supabase
          .from('ratings')
          .delete()
          .eq('user_id', profile.id)
          .eq('content_type', contentType)
          .eq('content_id', contentId)
          .eq('rating_type', 'thumbs');

        if (error) throw error;
        setThumbsUp(null);
      } else {
        // Set rating
        const { error } = await supabase
          .from('ratings')
          .upsert({
            user_id: profile.id,
            content_type: contentType,
            content_id: contentId,
            rating_type: 'thumbs',
            thumbs_up: newValue,
          }, {
            onConflict: 'user_id,content_type,content_id,rating_type',
          });

        if (error) throw error;
        setThumbsUp(newValue);
      }

      toast.success('Rating saved!');
      loadAggregate();
    } catch (error: any) {
      console.error('Error saving rating:', error);
      toast.error('Failed to save rating');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium mb-2">Star Rating</h4>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => handleStarRating(star)}
                  disabled={loading || !user}
                  className={`transition-colors ${
                    starRating && star <= starRating
                      ? 'text-yellow-500'
                      : 'text-muted-foreground hover:text-yellow-400'
                  }`}
                >
                  <Star className="w-5 h-5 fill-current" />
                </button>
              ))}
              {showAggregate && aggregate.totalStars > 0 && (
                <span className="ml-2 text-sm text-muted-foreground">
                  ({aggregate.avgStars.toFixed(1)} / {aggregate.totalStars} ratings)
                </span>
              )}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-2">Thumbs Rating</h4>
            <div className="flex items-center gap-2">
              <Button
                variant={thumbsUp === true ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleThumbs(true)}
                disabled={loading || !user}
              >
                <ThumbsUp className="w-4 h-4 mr-1" />
                {showAggregate && aggregate.thumbsUpCount > 0 && aggregate.thumbsUpCount}
              </Button>
              <Button
                variant={thumbsUp === false ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleThumbs(false)}
                disabled={loading || !user}
              >
                <ThumbsDown className="w-4 h-4 mr-1" />
                {showAggregate && aggregate.thumbsDownCount > 0 && aggregate.thumbsDownCount}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

