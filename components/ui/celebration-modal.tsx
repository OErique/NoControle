"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Trophy, Star, Crown, Target, Flame, Award } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Confetti } from "./confetti"

interface CelebrationModalProps {
  isOpen: boolean
  onClose: () => void
  type: "debt_paid" | "goal_achieved" | "streak" | "achievement" | "challenge"
  title: string
  description: string
  points?: number
}

const icons = {
  debt_paid: Trophy,
  goal_achieved: Target,
  streak: Flame,
  achievement: Award,
  challenge: Crown,
}

const colors = {
  debt_paid: "from-yellow-500/20 to-orange-500/20",
  goal_achieved: "from-green-500/20 to-emerald-500/20",
  streak: "from-orange-500/20 to-red-500/20",
  achievement: "from-purple-500/20 to-pink-500/20",
  challenge: "from-blue-500/20 to-cyan-500/20",
}

export function CelebrationModal({ isOpen, onClose, type, title, description, points }: CelebrationModalProps) {
  const Icon = icons[type]

  return (
    <>
      <Confetti isActive={isOpen} />
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
            onClick={onClose}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 15 }}
              className={`relative mx-4 w-full max-w-sm rounded-2xl border border-border bg-gradient-to-br ${colors[type]} p-8 text-center shadow-2xl`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Stars decoration */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                className="absolute -top-4 -right-4"
              >
                <Star className="h-8 w-8 text-yellow-500 fill-yellow-500" />
              </motion.div>
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 15, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                className="absolute -bottom-2 -left-2"
              >
                <Star className="h-6 w-6 text-yellow-500/70 fill-yellow-500/70" />
              </motion.div>

              {/* Icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", damping: 10 }}
                className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/20"
              >
                <Icon className="h-10 w-10 text-primary" />
              </motion.div>

              {/* Content */}
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mb-2 text-2xl font-bold text-foreground"
              >
                {title}
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mb-6 text-muted-foreground"
              >
                {description}
              </motion.p>

              {/* Points */}
              {points && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 }}
                  className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/20 px-4 py-2"
                >
                  <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                  <span className="font-bold text-primary">+{points} pontos</span>
                </motion.div>
              )}

              {/* Button */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
                <Button onClick={onClose} className="w-full gradient-primary text-primary-foreground">
                  Continuar
                </Button>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
