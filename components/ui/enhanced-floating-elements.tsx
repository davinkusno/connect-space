"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

interface FloatingShape {
  id: string
  type: "circle" | "square" | "triangle" | "hexagon" | "blob"
  size: number
  x: number
  y: number
  color: string
  opacity: number
  duration: number
  delay: number
  direction: "up" | "down" | "left" | "right" | "diagonal"
}

export function EnhancedFloatingElements() {
  const [mounted, setMounted] = useState(false)
  const [shapes, setShapes] = useState<FloatingShape[]>([])
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    setMounted(true)
    generateShapes()

    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }

    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [])

  const generateShapes = () => {
    const newShapes: FloatingShape[] = []
    const shapeTypes: FloatingShape["type"][] = ["circle", "square", "triangle", "hexagon", "blob"]
    const colors = [
      "from-purple-400/20 to-purple-600/20",
      "from-blue-400/20 to-blue-600/20",
      "from-pink-400/20 to-pink-600/20",
      "from-green-400/20 to-green-600/20",
      "from-yellow-400/20 to-yellow-600/20",
      "from-indigo-400/20 to-indigo-600/20",
      "from-cyan-400/20 to-cyan-600/20",
      "from-orange-400/20 to-orange-600/20",
    ]
    const directions: FloatingShape["direction"][] = ["up", "down", "left", "right", "diagonal"]

    // Generate 20 shapes with random properties
    for (let i = 0; i < 20; i++) {
      newShapes.push({
        id: `shape-${i}`,
        type: shapeTypes[Math.floor(Math.random() * shapeTypes.length)],
        size: Math.random() * 120 + 40, // 40-160px
        x: Math.random() * 100, // 0-100%
        y: Math.random() * 100, // 0-100%
        color: colors[Math.floor(Math.random() * colors.length)],
        opacity: Math.random() * 0.4 + 0.1, // 0.1-0.5
        duration: Math.random() * 20 + 15, // 15-35s
        delay: Math.random() * 10, // 0-10s
        direction: directions[Math.floor(Math.random() * directions.length)],
      })
    }
    setShapes(newShapes)
  }

  const getShapeClasses = (shape: FloatingShape) => {
    const baseClasses = "absolute pointer-events-none transition-all duration-1000 ease-out"
    const sizeClasses = `w-${Math.floor(shape.size / 4)} h-${Math.floor(shape.size / 4)}`

    switch (shape.type) {
      case "circle":
        return `${baseClasses} rounded-full bg-gradient-to-br ${shape.color}`
      case "square":
        return `${baseClasses} rounded-lg bg-gradient-to-br ${shape.color} rotate-45`
      case "triangle":
        return `${baseClasses} bg-gradient-to-br ${shape.color}`
      case "hexagon":
        return `${baseClasses} bg-gradient-to-br ${shape.color}`
      case "blob":
        return `${baseClasses} rounded-full bg-gradient-to-br ${shape.color}`
      default:
        return `${baseClasses} rounded-full bg-gradient-to-br ${shape.color}`
    }
  }

  const getAnimationStyle = (shape: FloatingShape) => {
    const mouseInfluence = {
      x: (mousePosition.x / window.innerWidth - 0.5) * 20,
      y: (mousePosition.y / window.innerHeight - 0.5) * 20,
    }

    return {
      left: `${shape.x}%`,
      top: `${shape.y}%`,
      width: `${shape.size}px`,
      height: `${shape.size}px`,
      opacity: shape.opacity,
      transform: `translate(${mouseInfluence.x}px, ${mouseInfluence.y}px)`,
      animation: `
        float-${shape.direction} ${shape.duration}s ease-in-out infinite,
        pulse-glow ${shape.duration * 0.7}s ease-in-out infinite,
        rotate-slow ${shape.duration * 1.5}s linear infinite
      `,
      animationDelay: `${shape.delay}s`,
    }
  }

  const renderShape = (shape: FloatingShape) => {
    if (shape.type === "triangle") {
      return (
        <div key={shape.id} className="absolute pointer-events-none" style={getAnimationStyle(shape)}>
          <div
            className={`w-0 h-0 border-l-[${shape.size / 2}px] border-r-[${shape.size / 2}px] border-b-[${shape.size}px] border-l-transparent border-r-transparent`}
            style={{
              borderBottomColor: `rgba(147, 51, 234, ${shape.opacity})`,
              filter: "blur(1px)",
            }}
          />
        </div>
      )
    }

    if (shape.type === "hexagon") {
      return (
        <div key={shape.id} className="absolute pointer-events-none" style={getAnimationStyle(shape)}>
          <div
            className="relative"
            style={{
              width: `${shape.size}px`,
              height: `${shape.size * 0.866}px`,
            }}
          >
            <div
              className={`absolute inset-0 bg-gradient-to-br ${shape.color}`}
              style={{
                clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
                filter: "blur(1px)",
              }}
            />
          </div>
        </div>
      )
    }

    if (shape.type === "blob") {
      return (
        <div key={shape.id} className={cn(getShapeClasses(shape), "blob-morph")} style={getAnimationStyle(shape)} />
      )
    }

    return <div key={shape.id} className={getShapeClasses(shape)} style={getAnimationStyle(shape)} />
  }

  if (!mounted) return null

  return (
    <>
      {/* Dynamic CSS animations */}
      <style jsx>{`
        @keyframes float-up {
          0%, 100% { transform: translateY(0px) translateX(0px) rotate(0deg); }
          25% { transform: translateY(-30px) translateX(10px) rotate(90deg); }
          50% { transform: translateY(-60px) translateX(-5px) rotate(180deg); }
          75% { transform: translateY(-30px) translateX(-10px) rotate(270deg); }
        }
        
        @keyframes float-down {
          0%, 100% { transform: translateY(0px) translateX(0px) rotate(0deg); }
          25% { transform: translateY(30px) translateX(-10px) rotate(-90deg); }
          50% { transform: translateY(60px) translateX(5px) rotate(-180deg); }
          75% { transform: translateY(30px) translateX(10px) rotate(-270deg); }
        }
        
        @keyframes float-left {
          0%, 100% { transform: translateX(0px) translateY(0px) rotate(0deg); }
          25% { transform: translateX(-40px) translateY(15px) rotate(45deg); }
          50% { transform: translateX(-80px) translateY(-10px) rotate(90deg); }
          75% { transform: translateX(-40px) translateY(-20px) rotate(135deg); }
        }
        
        @keyframes float-right {
          0%, 100% { transform: translateX(0px) translateY(0px) rotate(0deg); }
          25% { transform: translateX(40px) translateY(-15px) rotate(-45deg); }
          50% { transform: translateX(80px) translateY(10px) rotate(-90deg); }
          75% { transform: translateX(40px) translateY(20px) rotate(-135deg); }
        }
        
        @keyframes float-diagonal {
          0%, 100% { transform: translate(0px, 0px) rotate(0deg) scale(1); }
          25% { transform: translate(25px, -25px) rotate(90deg) scale(1.1); }
          50% { transform: translate(-15px, -50px) rotate(180deg) scale(0.9); }
          75% { transform: translate(-30px, -25px) rotate(270deg) scale(1.05); }
        }
        
        @keyframes pulse-glow {
          0%, 100% { filter: blur(1px) brightness(1); }
          50% { filter: blur(2px) brightness(1.2); }
        }
        
        @keyframes rotate-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .blob-morph {
          border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%;
          animation: blob-morph 15s ease-in-out infinite;
        }
        
        @keyframes blob-morph {
          0% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; }
          25% { border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%; }
          50% { border-radius: 50% 60% 30% 60% / 60% 40% 60% 30%; }
          75% { border-radius: 60% 30% 60% 40% / 30% 70% 40% 60%; }
          100% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; }
        }
      `}</style>

      {/* Background container */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-purple-50 animate-gradient-shift" />

        {/* Floating shapes */}
        {shapes.map(renderShape)}

        {/* Interactive light rays */}
        <div className="absolute inset-0">
          <div
            className="absolute w-96 h-96 bg-gradient-radial from-purple-300/10 via-transparent to-transparent rounded-full blur-3xl transition-all duration-1000 ease-out"
            style={{
              left: `${mousePosition.x - 192}px`,
              top: `${mousePosition.y - 192}px`,
            }}
          />
          <div
            className="absolute w-64 h-64 bg-gradient-radial from-blue-300/10 via-transparent to-transparent rounded-full blur-2xl transition-all duration-1500 ease-out"
            style={{
              left: `${mousePosition.x - 128}px`,
              top: `${mousePosition.y - 128}px`,
            }}
          />
        </div>

        {/* Particle system */}
        <div className="absolute inset-0">
          {Array.from({ length: 50 }).map((_, i) => (
            <div
              key={`particle-${i}`}
              className="absolute w-1 h-1 bg-purple-400/30 rounded-full animate-twinkle"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${Math.random() * 3 + 2}s`,
              }}
            />
          ))}
        </div>

        {/* Mesh gradient overlay */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-purple-500/5 via-transparent to-blue-500/5 animate-pulse-slow" />
          <div
            className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent via-pink-500/5 to-transparent animate-pulse-slow"
            style={{ animationDelay: "2s" }}
          />
        </div>
      </div>
    </>
  )
}
