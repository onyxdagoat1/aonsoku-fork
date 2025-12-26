import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { youtubeOAuthService } from '@/service/youtube-oauth.service';
import { Loader2 } from 'lucide-react';

export function YouTubeOAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const errorParam = searchParams.get('error');

    if (errorParam) {
      setError('Authorization was denied');
      setTimeout(() => navigate('/youtube'), 3000);
      return;
    }

    if (!code || !state) {
      setError('Invalid callback parameters');
      setTimeout(() => navigate('/youtube'), 3000);
      return;
    }

    handleCallback(code, state);
  }, [searchParams, navigate]);

  const handleCallback = async (code: string, state: string) => {
    try {
      await youtubeOAuthService.handleCallback(code, state);
      navigate('/youtube', { replace: true });
    } catch (error) {
      console.error('OAuth callback error:', error);
      setError('Failed to complete authorization');
      setTimeout(() => navigate('/youtube'), 3000);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      {error ? (
        <div className="text-center space-y-4">
          <p className="text-red-600 text-lg">{error}</p>
          <p className="text-muted-foreground">Redirecting to YouTube page...</p>
        </div>
      ) : (
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin mx-auto" />
          <p className="text-lg">Completing authorization...</p>
          <p className="text-muted-foreground">Please wait while we connect your account</p>
        </div>
      )}
    </div>
  );
}
