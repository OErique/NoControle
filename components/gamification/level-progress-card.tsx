"use client"

import { motion } from "framer-motion"
import { AnimatedCard } from "@/components/ui/animated-card"
import { LevelBadge } from "./level-badge"
import { getLevelByPoints, getNextLevel, getLevelProgress, getPointsToNextLevel } from "@/lib/levels"

interface LevelProgressCardProps {
  totalPoints: number
  compact?: boolean
}

export function LevelProgressCard({ totalPoints, compact = false }: LevelProgressCardProps) {
  const currentLevel = getLevelByPoints(totalPoints)
  const nextLevel = getNextLevel(currentLevel)
  const progress = getLevelProgress(totalPoints, currentLevel)
  const pointsToNext = getPointsToNextLevel(totalPoints, currentLevel)

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <LevelBadge level={currentLevel.slug} size="sm" />
        <div className="flex-1">
          <div className="flex justify-between text-xs mb-1">
            <span className="font-medium">{currentLevel.name}</span>
            {nextLevel && <span className="text-muted-foreground">{pointsToNext} pts</span>}
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{
                background: `linear-gradient(90deg, ${currentLevel.gradient_from}, ${currentLevel.gradient_to})`,
              }}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <AnimatedCard>
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <LevelBadge level={currentLevel.slug} size="lg" animated />
            <div>
              <h3 className="text-lg font-bold">Nível {currentLevel.name}</h3>
              <p className="text-sm text-muted-foreground">{totalPoints.toLocaleString()} pontos acumulados</p>
            </div>
          </div>
          {nextLevel && (
            <div className="text-right">
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <span>Próximo:</span>
                <LevelBadge level={nextLevel.slug} size="sm" showLabel />
              </div>
            </div>
          )}
        </div>

        {nextLevel && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progresso para {nextLevel.name}</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <div className="h-3 rounded-full bg-muted overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{
                  background: `linear-gradient(90deg, ${currentLevel.gradient_from}, ${nextLevel.gradient_from})`,
                }}
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1.5, ease: "easeOut" }}
              />
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Faltam <span className="font-bold text-foreground">{pointsToNext.toLocaleString()}</span> pontos para o
              próximo nível
            </p>
          </div>
        )}

        {!nextLevel && (
          <div className="text-center py-2">
            <p className="text-sm text-muted-foreground">
              Você alcançou o nível máximo! Continue usando o app para manter seu status.
            </p>
          </div>
        )}
      </div>
    </AnimatedCard>
  )
}
