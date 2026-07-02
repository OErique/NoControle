"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Sparkles, Gift, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { LevelBadge } from "./level-badge"
import { Confetti } from "@/components/ui/confetti"
import type { UserLevel } from "@/lib/levels"

interface LevelUpModalProps {
  isOpen: boolean
  onClose: () => void
  newLevel: UserLevel
  totalPoints: number
}

export function LevelUpModal({ isOpen, onClose, newLevel, totalPoints }: LevelUpModalProps) {
  const [showConfetti, setShowConfetti] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setShowConfetti(true)
    }
  }, [isOpen])

  return (
    <>
      <Confetti isActive={showConfetti} onComplete={() => setShowConfetti(false)} />
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
            onClick={onClose}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Glow effect */}
              <div
                className="absolute inset-0 rounded-2xl opacity-20 blur-xl"
                style={{
                  background: `linear-gradient(135deg, ${newLevel.gradient_from}, ${newLevel.gradient_to})`,
                }}
              />

              <div className="relative text-center space-y-6">
                {/* Badge animation */}
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.2, type: "spring", damping: 15 }}
                  className="flex justify-center"
                >
                  <LevelBadge level={newLevel.slug} size="lg" animated />
                </motion.div>

                {/* Title */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-2">
                    <Sparkles className="h-4 w-4" />
                    <span>Parabéns!</span>
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <h2 className="text-2xl font-bold">Você subiu para</h2>
                  <p
                    className="text-3xl font-bold bg-gradient-to-r bg-clip-text text-transparent"
                    style={{
                      backgroundImage: `linear-gradient(135deg, ${newLevel.gradient_from}, ${newLevel.gradient_to})`,
                    }}
                  >
                    Nível {newLevel.name}
                  </p>
                </motion.div>

                {/* Points */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="text-muted-foreground"
                >
                  <span className="text-2xl font-bold text-foreground">{totalPoints.toLocaleString()}</span> pontos
                </motion.div>

                {/* Benefits */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="space-y-2"
                >
                  <div className="flex items-center justify-center gap-2 text-sm font-medium">
                    <Gift className="h-4 w-4 text-primary" />
                    <span>Novos benefícios desbloqueados:</span>
                  </div>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    {newLevel.benefits.map((benefit, i) => (
                      <motion.li
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.7 + i * 0.1 }}
                        className="flex items-center justify-center gap-2"
                      >
                        <ArrowRight className="h-3 w-3 text-primary" />
                        {benefit}
                      </motion.li>
                    ))}
                  </ul>
                </motion.div>

                {/* Button */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}>
                  <Button onClick={onClose} className="w-full">
                    Continuar
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
