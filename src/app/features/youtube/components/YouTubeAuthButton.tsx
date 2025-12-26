import { Button } from '@/app/components/ui/button';
import { useYouTubeOAuthStore } from '@/store/useYouTubeOAuthStore';
import { youtubeOAuthService } from '@/service/youtube-oauth.service';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/app/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/app/components/ui/avatar';
import { LogOut, User } from 'lucide-react';

export function YouTubeAuthButton() {
  const { isAuthenticated, userInfo } = useYouTubeOAuthStore();

  const handleConnect = () => {
    youtubeOAuthService.initiateAuth();
  };

  const handleLogout = () => {
    youtubeOAuthService.logout();
  };

  if (!isAuthenticated || !userInfo) {
    return (
      <Button onClick={handleConnect} variant="outline" className="gap-2">
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"
          />
        </svg>
        Connect Google Account
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="gap-2 px-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={userInfo.picture} alt={userInfo.name} />
            <AvatarFallback>{userInfo.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <span className="hidden md:inline-block">{userInfo.name}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled>
          <User className="mr-2 h-4 w-4" />
          {userInfo.email}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="text-red-600">
          <LogOut className="mr-2 h-4 w-4" />
          Disconnect Google
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
