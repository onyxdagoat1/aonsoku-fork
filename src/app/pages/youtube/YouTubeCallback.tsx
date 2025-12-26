import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { youtubeAuthService } from '@/service/youtubeAuth';
import { Card, CardContent } from '@/app/components/ui/card';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/app/components/ui/button';

export function YouTubeCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const errorParam = searchParams.get('error');

      if (errorParam) {
        setStatus('error');
        setError('Authorization was denied or cancelled');
        return;
      }

      if (!code) {
        setStatus('error');
        setError('No authorization code received');
        return;
      }

      try {
        const success = await youtubeAuthService.handleCallback(code);
        
        if (success) {
          setStatus('success');
          setTimeout(() => {
            navigate('/youtube');
          }, 2000);
        } else {
          setStatus('error');
          setError('Failed to complete authorization');
        }
      } catch (err: any) {
        setStatus('error');
        setError(err.message || 'An unexpected error occurred');
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          {status === 'loading' && (
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto"></div>
              <div>
                <h3 className="text-lg font-medium">Connecting YouTube Account</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Please wait while we complete the authorization...
                </p>
              </div>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center space-y-4">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
              <div>
                <h3 className="text-lg font-medium">Successfully Connected!</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Redirecting you back to YouTube...
                </p>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center space-y-4">
              <AlertCircle className="h-16 w-16 text-destructive mx-auto" />
              <div>
                <h3 className="text-lg font-medium">Connection Failed</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {error}
                </p>
              </div>
              <Button onClick={() => navigate('/youtube')} variant="outline">
                Return to YouTube
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}