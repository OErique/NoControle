"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import { Target, Trophy, Star, Clock, Play, CheckCircle, Flame, Award, X, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AnimatedCard } from "@/components/ui/animated-card"
import { Progress } from "@/components/ui/progress"
import { CelebrationModal } from "@/components/ui/celebration-modal"
import { toast } from "sonner"

interface Challenge {
  id: string
  user_challenge_id?: string
  challenge_id?: string
  name: string
  description: string
  challenge_type?: string
  target_value?: number
  target?: number
  progress?: number
  current_value?: number
  daysLeft?: number
  duration_days?: number
  reward_points: number
  icon: string
  start_date?: Date
  end_date?: Date
}

interface ChallengesModuleProps {
  data: {
    availableChallenges: Challenge[]
    activeChallenges: Challenge[]
    completedChallenges: Challenge[]
    userPoints: number
  }
  userId: string
}

const iconMap: Record<string, React.ReactNode> = {
  utensils: <Target className="h-5 w-5" />,
  "piggy-bank": <Trophy className="h-5 w-5" />,
  film: <Star className="h-5 w-5" />,
  "check-circle": <CheckCircle className="h-5 w-5" />,
  "calendar-check": <Flame className="h-5 w-5" />,
}

export function ChallengesModule({ data, userId }: ChallengesModuleProps) {
  const [activeChallenges, setActiveChallenges] = useState(data.activeChallenges)
  const [availableChallenges, setAvailableChallenges] = useState(data.availableChallenges)
  const [userPoints, setUserPoints] = useState(data.userPoints)
  const [showCelebration, setShowCelebration] = useState(false)
  const [celebrationData, setCelebrationData] = useState({ title: "", description: "", points: 0 })
  const [isLoading, setIsLoading] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const refreshProgress = useCallback(async () => {
    try {
      const res = await fetch("/api/challenges/progress")
      if (res.ok) {
        const data = await res.json()
        if (data.progress) {
          setActiveChallenges((prev) =>
            prev.map((challenge) => {
              const updated = data.progress.find(
                (p: any) => p.challengeId === challenge.challenge_id || p.challengeId === challenge.id,
              )
              if (updated) {
                return {
                  ...challenge,
                  current_value: updated.currentValue,
                  progress: updated.currentValue,
                  target: updated.targetValue,
                }
              }
              return challenge
            }),
          )
        }
      }
    } catch (error) {
      console.error("Error refreshing progress:", error)
    }
  }, [])

  useEffect(() => {
    refreshProgress()
    const interval = setInterval(refreshProgress, 30000)
    return () => clearInterval(interval)
  }, [refreshProgress])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await refreshProgress()
    setIsRefreshing(false)
    toast.success("Progresso atualizado!")
  }

  const startChallenge = async (challengeId: string) => {
    setIsLoading(challengeId)
    try {
      const res = await fetch("/api/challenges/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ challengeId }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || data.details || "Failed to start challenge")
      }

      const challenge = availableChallenges.find((c) => c.id === challengeId)
      if (challenge) {
        setAvailableChallenges((prev) => prev.filter((c) => c.id !== challengeId))
        setActiveChallenges((prev) => [
          ...prev,
          {
            ...challenge,
            ...data,
            user_challenge_id: data.id,
            progress: 0,
            current_value: 0,
            target: Number(challenge.target_value) || 100,
            daysLeft: challenge.duration_days || 30,
          },
        ])
      }

      toast.success("Desafio iniciado!", {
        description: `Você tem ${challenge?.duration_days || 30} dias para completar.`,
      })

      // Trigger progress calculation
      setTimeout(refreshProgress, 1000)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro desconhecido"
      toast.error("Erro ao iniciar desafio", {
        description: message,
      })
    } finally {
      setIsLoading(null)
    }
  }

  const cancelChallenge = async (userChallengeId: string) => {
    setIsLoading(userChallengeId)
    try {
      const res = await fetch("/api/challenges/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userChallengeId }),
      })

      if (res.ok) {
        const challenge = activeChallenges.find(
          (c) => c.user_challenge_id === userChallengeId || c.id === userChallengeId,
        )
        setActiveChallenges((prev) =>
          prev.filter((c) => c.user_challenge_id !== userChallengeId && c.id !== userChallengeId),
        )
        toast.success("Desafio cancelado", {
          description: "Você pode tentar novamente amanhã.",
        })
      } else {
        const data = await res.json()
        throw new Error(data.error)
      }
    } catch (error) {
      toast.error("Erro ao cancelar desafio")
    } finally {
      setIsLoading(null)
    }
  }

  const claimReward = async (challenge: Challenge) => {
    const userChallengeId = challenge.user_challenge_id || challenge.id
    setIsLoading(userChallengeId)
    try {
      const res = await fetch("/api/challenges/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userChallengeId }),
      })

      const data = await res.json()

      if (res.ok) {
        setActiveChallenges((prev) => prev.filter((c) => (c.user_challenge_id || c.id) !== userChallengeId))
        setUserPoints((prev) => prev + data.points)

        setCelebrationData({
          title: "Desafio Completado!",
          description: challenge.name,
          points: data.points,
        })
        setShowCelebration(true)
      } else {
        toast.error(data.error || "Erro ao resgatar recompensa")
      }
    } catch (error) {
      toast.error("Erro ao resgatar recompensa")
    } finally {
      setIsLoading(null)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">Desafios</h1>
          <p className="text-muted-foreground">Complete desafios e ganhe pontos para subir no ranking</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="bg-transparent"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
          <div className="flex items-center gap-2 rounded-full bg-yellow-500/20 px-4 py-2">
            <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
            <span className="font-bold text-yellow-500">{userPoints} pontos</span>
          </div>
        </div>
      </motion.div>

      {/* Active challenges */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Flame className="h-5 w-5 text-orange-500" />
          Desafios Ativos ({activeChallenges.length})
        </h2>

        {activeChallenges.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {activeChallenges.map((challenge, index) => {
              const currentValue = Number(challenge.current_value) || Number(challenge.progress) || 0
              const targetValue = Number(challenge.target) || Number(challenge.target_value) || 100
              const progressPercent = Math.min(100, (currentValue / targetValue) * 100)
              const isComplete = progressPercent >= 100

              return (
                <AnimatedCard key={challenge.user_challenge_id || challenge.id} delay={index * 0.1}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20 text-primary">
                      {iconMap[challenge.icon] || <Target className="h-5 w-5" />}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {challenge.daysLeft}d
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-danger"
                        onClick={() => cancelChallenge(challenge.user_challenge_id || challenge.id)}
                        disabled={isLoading === (challenge.user_challenge_id || challenge.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  <h3 className="font-semibold text-foreground mb-1">{challenge.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{challenge.description}</p>

                  <Progress value={progressPercent} className={`h-2 mb-2 ${isComplete ? "bg-success/20" : ""}`} />

                  <div className="flex items-center justify-between text-sm mb-3">
                    <span className="text-muted-foreground">
                      {currentValue.toLocaleString("pt-BR")} / {targetValue.toLocaleString("pt-BR")}
                    </span>
                    <span className={`font-medium ${isComplete ? "text-success" : "text-muted-foreground"}`}>
                      {Math.round(progressPercent)}%
                    </span>
                  </div>

                  {isComplete ? (
                    <Button
                      className="w-full gradient-primary"
                      onClick={() => claimReward(challenge)}
                      disabled={isLoading === (challenge.user_challenge_id || challenge.id)}
                    >
                      {isLoading === (challenge.user_challenge_id || challenge.id) ? (
                        "Resgatando..."
                      ) : (
                        <>
                          <Trophy className="h-4 w-4 mr-2" />
                          Resgatar +{challenge.reward_points} pts
                        </>
                      )}
                    </Button>
                  ) : (
                    <div className="flex items-center justify-center gap-1 text-yellow-500 font-medium text-sm">
                      <Trophy className="h-3 w-3" />+{challenge.reward_points} pts
                    </div>
                  )}
                </AnimatedCard>
              )
            })}
          </div>
        ) : (
          <AnimatedCard className="text-center py-8">
            <Target className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-muted-foreground">Nenhum desafio ativo</p>
            <p className="text-sm text-muted-foreground">Escolha um desafio abaixo para começar!</p>
          </AnimatedCard>
        )}
      </div>

      {/* Available challenges */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Award className="h-5 w-5 text-accent" />
          Desafios Disponíveis ({availableChallenges.length})
        </h2>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {availableChallenges.map((challenge, index) => (
            <AnimatedCard key={challenge.id} delay={index * 0.1} className="border-dashed">
              <div className="flex items-start justify-between mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  {iconMap[challenge.icon] || <Target className="h-5 w-5" />}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {challenge.duration_days}d
                </div>
              </div>

              <h3 className="font-semibold text-foreground mb-1">{challenge.name}</h3>
              <p className="text-sm text-muted-foreground mb-4">{challenge.description}</p>

              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1 text-yellow-500 font-medium text-sm">
                  <Trophy className="h-4 w-4" />+{challenge.reward_points} pts
                </span>
                <Button
                  size="sm"
                  onClick={() => startChallenge(challenge.id)}
                  disabled={isLoading === challenge.id}
                  className="gradient-primary text-primary-foreground"
                >
                  {isLoading === challenge.id ? (
                    "Iniciando..."
                  ) : (
                    <>
                      <Play className="h-3 w-3 mr-1" />
                      Aceitar
                    </>
                  )}
                </Button>
              </div>
            </AnimatedCard>
          ))}
        </div>
      </div>

      {/* Completed challenges */}
      {data.completedChallenges.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-success" />
            Completados ({data.completedChallenges.length})
          </h2>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {data.completedChallenges.map((challenge, index) => (
              <motion.div
                key={challenge.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center gap-3 rounded-lg border border-success/30 bg-success/10 p-3"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-success/20 text-success">
                  <CheckCircle className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-foreground truncate">{challenge.name}</p>
                  <p className="text-xs text-success">+{challenge.reward_points} pts</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Celebration modal */}
      <CelebrationModal
        isOpen={showCelebration}
        onClose={() => setShowCelebration(false)}
        type="challenge"
        title={celebrationData.title}
        description={celebrationData.description}
        points={celebrationData.points}
      />
    </div>
  )
}
