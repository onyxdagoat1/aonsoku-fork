import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

interface Particle {
  id: number
  x: number
  y: number
  size: number
  duration: number
  delay: number
}

export function AnimatedBackground() {
  const [particles, setParticles] = useState<Particle[]>([])

  useEffect(() => {
    // Generate random particles on mount
    const newParticles: Particle[] = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 1,
      duration: Math.random() * 20 + 15,
      delay: Math.random() * 5,
    }))
    setParticles(newParticles)
  }, [])

  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      {/* Base overlay */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-3xl z-10" />

      {/* Gradient mesh background */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-purple-500/10 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-500/5 via-transparent to-transparent" />
      </div>

      {/* Large moving blobs */}
      <motion.div
        animate={{
          x: [0, 150, -50, 0],
          y: [0, -100, 50, 0],
          scale: [1, 1.3, 0.9, 1],
          rotate: [0, 45, -20, 0],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute -top-32 -left-32 w-[600px] h-[600px] bg-primary/15 rounded-full blur-[120px] opacity-60"
      />

      <motion.div
        animate={{
          x: [0, -120, 80, 0],
          y: [0, 80, -60, 0],
          scale: [1, 1.4, 1.1, 1],
          rotate: [0, -30, 45, 0],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 2,
        }}
        className="absolute top-1/4 -right-32 w-[700px] h-[700px] bg-purple-500/10 rounded-full blur-[140px] opacity-50"
      />

      <motion.div
        animate={{
          x: [0, 80, -100, 0],
          y: [0, -50, 100, 0],
          scale: [1, 1.2, 0.8, 1],
        }}
        transition={{
          duration: 35,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 5,
        }}
        className="absolute -bottom-32 left-1/4 w-[800px] h-[800px] bg-blue-500/10 rounded-full blur-[160px] opacity-40"
      />

      {/* Medium accent blob */}
      <motion.div
        animate={{
          x: [0, -60, 40, 0],
          y: [0, 40, -30, 0],
          scale: [1, 1.5, 1.2, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 8,
        }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-[100px] opacity-30"
      />

      {/* Floating particles */}
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          initial={{
            x: `${particle.x}vw`,
            y: `${particle.y}vh`,
            opacity: 0,
          }}
          animate={{
            y: [`${particle.y}vh`, `${particle.y - 30}vh`, `${particle.y}vh`],
            x: [
              `${particle.x}vw`,
              `${particle.x + (Math.random() * 10 - 5)}vw`,
              `${particle.x}vw`,
            ],
            opacity: [0, 0.6, 0],
            scale: [0.5, 1, 0.5],
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            delay: particle.delay,
            ease: 'easeInOut',
          }}
          className="absolute rounded-full bg-white/30"
          style={{
            width: particle.size,
            height: particle.size,
          }}
        />
      ))}

      {/* Glowing orbs */}
      <motion.div
        animate={{
          opacity: [0.3, 0.6, 0.3],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute top-1/4 left-1/4 w-2 h-2 bg-primary rounded-full shadow-[0_0_20px_10px] shadow-primary/20"
      />

      <motion.div
        animate={{
          opacity: [0.2, 0.5, 0.2],
          scale: [1, 1.3, 1],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 1,
        }}
        className="absolute bottom-1/3 right-1/4 w-3 h-3 bg-purple-400 rounded-full shadow-[0_0_25px_12px] shadow-purple-400/20"
      />

      <motion.div
        animate={{
          opacity: [0.2, 0.4, 0.2],
          scale: [1, 1.4, 1],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 2,
        }}
        className="absolute top-2/3 left-2/3 w-2 h-2 bg-cyan-400 rounded-full shadow-[0_0_15px_8px] shadow-cyan-400/20"
      />

      {/* Subtle noise overlay */}
      <div
        className="absolute inset-0 opacity-[0.015] z-20"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  )
}
