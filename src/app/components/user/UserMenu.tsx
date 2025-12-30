import { useAuth } from '@/contexts/AuthContext'
import { Link, useNavigate } from 'react-router-dom'
import { useState, useRef, useEffect } from 'react'
import { RiUser3Line, RiAdminLine, RiLogoutBoxLine, RiArrowDownSLine } from 'react-icons/ri'
import { motion, AnimatePresence } from 'framer-motion'

export function UserMenu() {
  const { user, profile, signOut, isConfigured } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Don't show anything if Supabase is not configured
  if (!isConfigured) {
    return null
  }

  // Show login button if not authenticated
  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Link to="/auth/login">
          <button className="px-3 py-1.5 text-sm rounded-lg border border-white/10 hover:bg-white/5 text-gray-300 hover:text-white transition-colors">
            Sign In
          </button>
        </Link>
        <Link to="/auth/register">
          <button className="px-3 py-1.5 text-sm rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors shadow-lg shadow-indigo-500/20">
            Sign Up
          </button>
        </Link>
      </div>
    )
  }

  // Show user info if authenticated
  const displayName = profile?.display_name || profile?.username || user.email?.split('@')[0] || 'User'
  const avatarUrl = profile?.avatar_url
  const initials = displayName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 pl-1 pr-3 py-1 border border-white/10 bg-white/5 hover:bg-white/10 rounded-full transition-all group"
        title={`Logged in as ${displayName}`}
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white overflow-hidden shadow-inner">
          {avatarUrl ? (
            <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
          ) : (
            initials
          )}
        </div>
        <span className="text-sm font-medium text-gray-200 group-hover:text-white transition-colors max-w-[100px] truncate hidden md:block">
            {displayName}
        </span>
        <RiArrowDownSLine className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-56 bg-[#121215] border border-white/10 rounded-xl shadow-2xl p-2 z-50 backdrop-blur-xl"
          >
            <div className="px-3 py-2 border-b border-white/5 mb-1">
              <p className="font-medium text-white truncate">{displayName}</p>
              {user.email && (
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              )}
            </div>

            <div className="space-y-1">
              <Link
                to="/profile"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              >
                <RiUser3Line className="text-indigo-400" />
                Profile
              </Link>
              
              {profile?.is_admin && (
                <Link
                  to="/admin"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                >
                  <RiAdminLine className="text-red-400" />
                  Admin Panel
                </Link>
              )}

              <button
                onClick={() => {
                    signOut();
                    setIsOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors text-left mt-2 border-t border-white/5"
              >
                <RiLogoutBoxLine />
                Sign Out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
