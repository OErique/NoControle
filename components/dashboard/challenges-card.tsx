"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Target, ChevronRight, Clock, Trophy, Plus } from "lucide-react"
import { AnimatedCard } from "@/components/ui/animated-card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import Link from "next/link"

interface Challenge {
  id: string
  name: string
  description: string
  progress: number
  target: number
  daysLeft: number
  reward: number
  icon: string
}

interface ChallengesCardProps {
  activeChallenges: Challenge[]
  availableChallenges: number
}

export function ChallengesCard({ activeChallenges, availableChallenges }: ChallengesCardProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  return (
    <AnimatedCard delay={0.3}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/20">
            <Target className="h-5 w-5 text-accent" />
          </div>
          <div>
            <p className="font-semibold text-foreground">Desafios do Mês</p>
            <p className="text-sm text-muted-foreground">
              {activeChallenges.length} ativo{activeChallenges.length !== 1 && "s"}
            </p>
          </div>
        </div>
        <Link href="/challenges">
          <Button variant="ghost" size="sm">
            Ver todos
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </Link>
      </div>

      {activeChallenges.length > 0 ? (
        <div className="space-y-3">
          {activeChallenges.slice(0, 3).map((challenge) => {
            const progressPercent = Math.min(100, (challenge.progress / challenge.target) * 100)
            const isExpanded = expandedId === challenge.id

            return (
              <motion.div
                key={challenge.id}
                className="rounded-lg border border-border bg-card/50 p-3 cursor-pointer hover:bg-card/80 transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : challenge.id)}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm text-foreground">{challenge.name}</span>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {challenge.daysLeft}d
                  </div>
                </div>
                <Progress value={progressPercent} className="h-2 mb-2" />
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{Math.round(progressPercent)}% completo</span>
                  <span className="flex items-center gap-1 text-yellow-500">
                    <Trophy className="h-3 w-3" />+{challenge.reward} pts
                  </span>
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.p
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="text-xs text-muted-foreground mt-2 pt-2 border-t border-border"
                    >
                      {challenge.description}
                    </motion.p>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-6">
          <Target className="h-10 w-10 text-muted-foreground/50 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground mb-3">Nenhum desafio ativo</p>
          <Link href="/challenges">
            <Button size="sm" variant="outline">
              <Plus className="mr-1 h-4 w-4" />
              Iniciar um desafio
            </Button>
          </Link>
        </div>
      )}

      {availableChallenges > 0 && activeChallenges.length > 0 && (
        <p className="mt-3 text-xs text-center text-muted-foreground">
          +{availableChallenges} desafio{availableChallenges !== 1 && "s"} disponíve
          {availableChallenges !== 1 ? "is" : "l"}
        </p>
      )}
    </AnimatedCard>
  )
}
