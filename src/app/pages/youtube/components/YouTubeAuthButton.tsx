import { useState } from 'react';
import { useYouTubeAuthStore } from '@/store/youtubeAuth.store';
import { youtubeAuthService } from '@/service/youtubeAuth';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/app/components/ui/avatar';
import { LogIn, LogOut, Youtube } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/app/components/ui/alert-dialog';

export function YouTubeAuthButton() {
  const { isAuthenticated, userInfo } = useYouTubeAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  const handleConnect = () => {
    setIsLoading(true);
    youtubeAuthService.initiateOAuth();
  };

  const handleDisconnect = () => {
    youtubeAuthService.signOut();
  };

  if (isAuthenticated && userInfo) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Youtube className="w-5 h-5 text-red-600" />
            YouTube Account Connected
          </CardTitle>
          <CardDescription>
            You can now interact with YouTube content
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={userInfo.picture} alt={userInfo.name} />
              <AvatarFallback>{userInfo.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{userInfo.name}</p>
              <p className="text-sm text-muted-foreground">{userInfo.email}</p>
            </div>
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="w-full" size="sm">
                <LogOut className="w-4 h-4 mr-2" />
                Disconnect YouTube Account
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Disconnect YouTube Account?</AlertDialogTitle>
                <AlertDialogDescription>
                  You will lose access to authenticated features like liking videos, commenting, and managing playlists.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDisconnect}>
                  Disconnect
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Youtube className="w-5 h-5 text-red-600" />
          Connect YouTube Account
        </CardTitle>
        <CardDescription>
          Sign in with Google to enable interactive features
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground space-y-2">
            <p className="font-medium">With a connected account, you can:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Import your YouTube playlists</li>
              <li>Like and dislike videos</li>
              <li>Comment on videos</li>
              <li>Add videos to your playlists</li>
              <li>Subscribe to channels</li>
            </ul>
          </div>

          <Button 
            onClick={handleConnect} 
            disabled={isLoading}
            className="w-full"
          >
            <LogIn className="w-4 h-4 mr-2" />
            {isLoading ? 'Connecting...' : 'Connect with Google'}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            We only request the permissions needed for YouTube features.
            Your credentials are never stored on our servers.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}