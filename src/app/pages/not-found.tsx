import { ArrowLeft, Home } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/app/components/ui/button'
import { ROUTES } from '@/routes/routesList'
import { appName } from '@/utils/appName'

export default function NotFound() {
  const navigate = useNavigate()

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden bg-background">
      {/* Dynamic Background Elements */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/20 rounded-full blur-[100px] animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-[120px] animate-pulse delay-700" />

      <div className="relative z-10 flex flex-col items-center text-center p-8">
        {/* Logo or Brand Element */}
        <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <img
            src="/resources/icons/yedits-YE-logo-white1.webp"
            alt={appName}
            className="h-16 w-auto object-contain opacity-80"
          />
        </div>

        {/* 404 Text */}
        <h1 className="text-[12rem] font-black leading-none tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-foreground to-foreground/20 animate-in zoom-in-50 duration-500">
          404
        </h1>

        <div className="max-w-md space-y-4 animate-in fade-in slide-in-from-top-4 duration-700 fill-mode-both delay-300">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Lost in reality?
          </h2>
          <p className="text-lg text-muted-foreground">
            The page you're looking for doesn't exist or has been moved to
            another dimension.
          </p>
        </div>

        {/* Actions */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-8 duration-1000 fill-mode-both delay-500">
          <Button
            variant="outline"
            size="lg"
            className="rounded-full bg-background/50 backdrop-blur-md border-primary/20 hover:bg-primary/10 transition-all duration-300"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>

          <Link to={ROUTES.LIBRARY.HOME}>
            <Button
              size="lg"
              className="rounded-full shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all duration-300 transform hover:scale-105 active:scale-95"
            >
              <Home className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>

      {/* Subtle Footer Link */}
      <div className="absolute bottom-8 text-sm text-muted-foreground/50">
        &copy; {new Date().getFullYear()} {appName}. All rights reserved.
      </div>
    </div>
  )
}
