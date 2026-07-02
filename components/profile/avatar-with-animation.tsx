"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { User } from "lucide-react"

interface AvatarWithAnimationProps {
  avatarUrl: string | null
  name: string | null
  size?: "sm" | "md" | "lg"
  borderUrl?: string | null
  animationType?: string | null
  showAnimation?: boolean
}

function CoinAnimation() {
  const [coins, setCoins] = useState<{ id: number; x: number; delay: number }[]>([])

  useEffect(() => {
    // Generate initial coins
    const initialCoins = Array.from({ length: 6 }, (_, i) => ({
      id: i,
      x: Math.random() * 80 + 10, // 10-90% of width
      delay: i * 0.3,
    }))
    setCoins(initialCoins)
  }, [])

  return (
    <div className="absolute inset-0 overflow-hidden rounded-full pointer-events-none">
      {coins.map((coin) => (
        <motion.div
          key={coin.id}
          className="absolute w-3 h-3"
          style={{ left: `${coin.x}%` }}
          initial={{ y: -10, opacity: 0, rotate: 0 }}
          animate={{
            y: ["-10%", "110%"],
            opacity: [0, 1, 1, 0],
            rotate: [0, 360],
          }}
          transition={{
            duration: 2.5,
            delay: coin.delay,
            repeat: Number.POSITIVE_INFINITY,
            ease: "linear",
          }}
        >
          <svg viewBox="0 0 24 24" className="w-full h-full text-yellow-400 fill-current drop-shadow-lg">
            <circle cx="12" cy="12" r="10" fill="currentColor" />
            <text x="12" y="16" textAnchor="middle" fontSize="10" fill="#fff" fontWeight="bold">
              $
            </text>
          </svg>
        </motion.div>
      ))}
    </div>
  )
}

// Sparkle animation
function SparkleAnimation() {
  return (
    <div className="absolute inset-0 overflow-hidden rounded-full pointer-events-none">
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1.5 h-1.5 bg-yellow-300 rounded-full"
          style={{
            left: `${20 + Math.random() * 60}%`,
            top: `${20 + Math.random() * 60}%`,
          }}
          animate={{
            scale: [0, 1, 0],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 1.5,
            delay: i * 0.2,
            repeat: Number.POSITIVE_INFINITY,
          }}
        />
      ))}
    </div>
  )
}

// Glow animation
function GlowAnimation() {
  return (
    <motion.div
      className="absolute inset-0 rounded-full pointer-events-none"
      animate={{
        boxShadow: [
          "0 0 10px 2px rgba(251, 191, 36, 0.3)",
          "0 0 20px 4px rgba(251, 191, 36, 0.5)",
          "0 0 10px 2px rgba(251, 191, 36, 0.3)",
        ],
      }}
      transition={{
        duration: 2,
        repeat: Number.POSITIVE_INFINITY,
        ease: "easeInOut",
      }}
    />
  )
}

const sizeClasses = {
  sm: "h-12 w-12",
  md: "h-20 w-20 sm:h-24 sm:w-24",
  lg: "h-24 w-24 sm:h-28 sm:w-28",
}

const iconSizes = {
  sm: "h-5 w-5",
  md: "h-8 w-8",
  lg: "h-10 w-10 sm:h-12 sm:w-12",
}

export function AvatarWithAnimation({
  avatarUrl,
  name,
  size = "lg",
  borderUrl,
  animationType,
  showAnimation = true,
}: AvatarWithAnimationProps) {
  const renderAnimation = () => {
    if (!showAnimation || !animationType) return null

    switch (animationType) {
      case "coins":
        return <CoinAnimation />
      case "sparkles":
        return <SparkleAnimation />
      case "glow":
        return <GlowAnimation />
      default:
        return null
    }
  }

  return (
    <div className="relative">
      {/* Border wrapper */}
      <div
        className={`relative ${sizeClasses[size]} rounded-full p-1`}
        style={{
          background: borderUrl || "linear-gradient(135deg, #10b981, #059669)",
          backgroundSize: "200% 200%",
          animation: borderUrl ? "gradient-shift 3s ease infinite" : undefined,
        }}
      >
        {/* Avatar container */}
        <div className="h-full w-full rounded-full border-4 border-card bg-muted flex items-center justify-center overflow-hidden relative">
          {avatarUrl ? (
            <img src={avatarUrl || "/placeholder.svg"} alt={name || "Avatar"} className="h-full w-full object-cover" />
          ) : (
            <User className={`${iconSizes[size]} text-muted-foreground`} />
          )}

          {/* Animation overlay inside avatar */}
          {renderAnimation()}
        </div>
      </div>
    </div>
  )
}
