import { Heart, Music, Play, Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'
import { LoginForm } from '@/app/components/login/form'

export default function Login() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-gradient-to-br from-purple-900 via-blue-900 to-black">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Gradient Orbs */}
        <div
          className="absolute w-96 h-96 bg-purple-500/30 rounded-full blur-3xl animate-pulse"
          style={{
            top: '10%',
            left: '20%',
            animationDuration: '4s',
          }}
        />
        <div
          className="absolute w-96 h-96 bg-blue-500/30 rounded-full blur-3xl animate-pulse"
          style={{
            bottom: '10%',
            right: '20%',
            animationDuration: '6s',
            animationDelay: '1s',
          }}
        />
        <div
          className="absolute w-64 h-64 bg-pink-500/20 rounded-full blur-3xl animate-pulse"
          style={{
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            animationDuration: '5s',
            animationDelay: '2s',
          }}
        />

        {/* Floating Icons */}
        <div className="absolute inset-0 pointer-events-none">
          <Music
            className="absolute w-8 h-8 text-purple-400/20 animate-float"
            style={{ top: '15%', left: '15%', animationDelay: '0s' }}
          />
          <Play
            className="absolute w-10 h-10 text-blue-400/20 animate-float"
            style={{ top: '25%', right: '25%', animationDelay: '1s' }}
          />
          <Heart
            className="absolute w-6 h-6 text-pink-400/20 animate-float"
            style={{ bottom: '30%', left: '30%', animationDelay: '2s' }}
          />
          <Sparkles
            className="absolute w-7 h-7 text-purple-400/20 animate-float"
            style={{ bottom: '20%', right: '20%', animationDelay: '1.5s' }}
          />
          <Music
            className="absolute w-9 h-9 text-blue-400/20 animate-float"
            style={{ top: '60%', right: '15%', animationDelay: '0.5s' }}
          />
          <Heart
            className="absolute w-8 h-8 text-pink-400/20 animate-float"
            style={{ top: '40%', left: '10%', animationDelay: '2.5s' }}
          />
        </div>

        {/* Mesh Gradient Overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_rgba(0,0,0,0.4)_100%)]" />

        {/* Mouse Follow Glow */}
        <div
          className="absolute w-96 h-96 bg-purple-500/10 rounded-full blur-3xl transition-all duration-300 pointer-events-none"
          style={{
            left: mousePosition.x - 192,
            top: mousePosition.y - 192,
          }}
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full px-4">
        {/* Logo and Title */}
        <div className="mb-12 text-center animate-in fade-in slide-in-from-top-8 duration-1000">
          <div className="flex justify-center mb-6">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full blur-xl opacity-50 group-hover:opacity-75 transition-opacity" />
              <img
                src="/yedits-logo.webp"
                alt="Yedits Logo"
                className="relative w-32 h-32 object-contain drop-shadow-2xl"
              />
            </div>
          </div>
          <h1 className="text-6xl font-black mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 drop-shadow-lg">
            Yedits.net
          </h1>
          <p className="text-xl text-purple-200/80 font-light flex items-center justify-center gap-2">
            <Sparkles className="w-5 h-5" />
            Your Ultimate Music Streaming Experience
            <Sparkles className="w-5 h-5" />
          </p>
        </div>

        {/* Login Form Container */}
        <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
          <div className="relative">
            {/* Glassmorphic Container */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl rounded-3xl border border-white/20 shadow-2xl" />
            <div className="relative p-8">
              <LoginForm />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center animate-in fade-in duration-1000 delay-500">
          <p className="text-sm text-purple-300/60 mb-2">
            Powered by{' '}
            <span className="font-semibold text-purple-300">Chuds</span>
          </p>
          <p className="text-xs text-purple-400/40">
            Connect your Navidrome server to start streaming
          </p>
        </div>
      </div>

      {/* Animated Grid Background */}
      <div className="absolute inset-0 pointer-events-none opacity-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(rgba(168, 85, 247, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(168, 85, 247, 0.1) 1px, transparent 1px)',
            backgroundSize: '50px 50px',
          }}
        />
      </div>
    </div>
  )
}
