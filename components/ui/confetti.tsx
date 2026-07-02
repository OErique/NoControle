"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

interface ConfettiPiece {
  id: number
  x: number
  color: string
  delay: number
  rotation: number
  scale: number
}

interface ConfettiProps {
  isActive: boolean
  onComplete?: () => void
}

const COLORS = [
  "oklch(0.8 0.18 142)", // green
  "oklch(0.7 0.15 210)", // blue
  "oklch(0.85 0.2 85)", // yellow
  "oklch(0.75 0.18 320)", // pink
  "oklch(0.8 0.15 180)", // cyan
]

export function Confetti({ isActive, onComplete }: ConfettiProps) {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([])

  useEffect(() => {
    if (isActive) {
      const newPieces: ConfettiPiece[] = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        delay: Math.random() * 0.5,
        rotation: Math.random() * 360,
        scale: 0.5 + Math.random() * 0.5,
      }))
      setPieces(newPieces)

      const timer = setTimeout(() => {
        setPieces([])
        onComplete?.()
      }, 3000)

      return () => clearTimeout(timer)
    }
  }, [isActive, onComplete])

  return (
    <AnimatePresence>
      {pieces.length > 0 && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          {pieces.map((piece) => (
            <motion.div
              key={piece.id}
              initial={{
                x: `${piece.x}vw`,
                y: -20,
                rotate: 0,
                scale: piece.scale,
              }}
              animate={{
                y: "110vh",
                rotate: piece.rotation + 720,
              }}
              exit={{ opacity: 0 }}
              transition={{
                duration: 2.5 + Math.random(),
                delay: piece.delay,
                ease: "easeIn",
              }}
              className="absolute"
              style={{
                width: 10,
                height: 10,
                backgroundColor: piece.color,
                borderRadius: Math.random() > 0.5 ? "50%" : "2px",
              }}
            />
          ))}
        </div>
      )}
    </AnimatePresence>
  )
}
