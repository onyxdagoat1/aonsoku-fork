import { useEffect, useRef, useState } from 'react'
import { Label } from '@/app/components/ui/label'

interface ColorWheelProps {
  hue: number
  saturation: number
  lightness: number
  onChange: (h: number, s: number, l: number) => void
  size?: number
}

export function ColorWheel({ hue, saturation, lightness, onChange, size = 200 }: ColorWheelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  // Draw the color wheel
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const centerX = size / 2
    const centerY = size / 2
    const radius = size / 2 - 10

    // Clear canvas
    ctx.clearRect(0, 0, size, size)

    // Draw color wheel
    for (let angle = 0; angle < 360; angle += 1) {
      const startAngle = (angle - 90) * Math.PI / 180
      const endAngle = (angle + 1 - 90) * Math.PI / 180

      ctx.beginPath()
      ctx.moveTo(centerX, centerY)
      ctx.arc(centerX, centerY, radius, startAngle, endAngle)
      ctx.closePath()

      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius)
      gradient.addColorStop(0, `hsl(${angle}, 0%, ${lightness}%)`)
      gradient.addColorStop(1, `hsl(${angle}, 100%, ${lightness}%)`)
      ctx.fillStyle = gradient
      ctx.fill()
    }

    // Draw center circle (saturation control)
    const innerRadius = radius * 0.3
    ctx.beginPath()
    ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2)
    ctx.fillStyle = `hsl(${hue}, ${saturation}%, ${lightness}%)`
    ctx.fill()
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'
    ctx.lineWidth = 2
    ctx.stroke()
  }, [size, hue, saturation, lightness])

  const handleColorSelect = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const centerX = size / 2
    const centerY = size / 2

    const dx = x - centerX
    const dy = y - centerY
    const distance = Math.sqrt(dx * dx + dy * dy)
    const radius = size / 2 - 10

    // Calculate angle (hue)
    let angle = Math.atan2(dy, dx) * 180 / Math.PI + 90
    if (angle < 0) angle += 360

    // Calculate saturation based on distance from center
    const newSaturation = Math.min(100, (distance / radius) * 100)

    onChange(Math.round(angle), Math.round(newSaturation), lightness)
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true)
    handleColorSelect(e)
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging) {
      handleColorSelect(e)
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // Calculate selector position
  const angle = (hue - 90) * Math.PI / 180
  const radius = (size / 2 - 10) * (saturation / 100)
  const selectorX = size / 2 + radius * Math.cos(angle)
  const selectorY = size / 2 + radius * Math.sin(angle)

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <canvas
          ref={canvasRef}
          width={size}
          height={size}
          className="cursor-crosshair rounded-full"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
        {/* Selector handle */}
        <div
          className="absolute w-4 h-4 border-2 border-white rounded-full shadow-lg pointer-events-none"
          style={{
            left: selectorX - 8,
            top: selectorY - 8,
            backgroundColor: `hsl(${hue}, ${saturation}%, ${lightness}%)`,
          }}
        />
      </div>
      <div className="text-xs text-muted-foreground text-center">
        Click and drag to select color
      </div>
    </div>
  )
}
