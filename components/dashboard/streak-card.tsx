"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Flame, Calendar, Trophy, Check, Loader2 } from "lucide-react"
import { AnimatedCard } from "@/components/ui/animated-card"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

interface StreakCardProps {
  currentStreak: number
  longestStreak: number
  lastActivityDate?: string
  onStreakUpdate?: (newStreak: number) => void
}

export function StreakCard({ currentStreak, longestStreak, lastActivityDate, onStreakUpdate }: StreakCardProps) {
  const [isRegistering, setIsRegistering] = useState(false)
  const [streak, setStreak] = useState(currentStreak)
  const [registeredToday, setRegisteredToday] = useState(false)

  const getTodayDate = () => {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, "0")
    const day = String(now.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
  }

  const today = getTodayDate()

  useEffect(() => {
    const isActiveToday = lastActivityDate === today
    setRegisteredToday(isActiveToday)
  }, [lastActivityDate, today])

  const getStreakColor = () => {
    if (streak === 0) return "text-muted-foreground"
    if (streak < 3) return "text-orange-400"
    if (streak < 7) return "text-orange-500"
    if (streak < 14) return "text-orange-600"
    if (streak < 30) return "text-red-500"
    return "text-red-600"
  }

  const getStreakBgColor = () => {
    if (streak === 0) return "bg-muted"
    if (streak < 3) return "bg-orange-400/20"
    if (streak < 7) return "bg-orange-500/20"
    if (streak < 14) return "bg-orange-600/20"
    if (streak < 30) return "bg-red-500/20"
    return "bg-red-600/20"
  }

  const handleRegisterDay = async () => {
    if (registeredToday || isRegistering) {
      toast.info("Você já registrou o dia de hoje!")
      return
    }

    setIsRegistering(true)
    try {
      const res = await fetch("/api/streak/register", { method: "POST" })
      const data = await res.json()

      if (res.ok) {
        setStreak(data.currentStreak)
        setRegisteredToday(true) // Mark as registered
        onStreakUpdate?.(data.currentStreak)
        toast.success("Dia registrado!", {
          description: `Sequência: ${data.currentStreak} dias consecutivos! +${data.pointsAwarded} pontos`,
        })
      } else if (data.error === "Já registrado hoje") {
        setRegisteredToday(true)
        toast.info("Você já registrou o dia de hoje!")
      } else {
        throw new Error(data.error || "Erro ao registrar")
      }
    } catch (error) {
      toast.error("Erro ao registrar o dia")
    } finally {
      setIsRegistering(false)
    }
  }

  return (
    <AnimatedCard delay={0.25} className="relative overflow-hidden">
      <div className={`absolute -right-4 -top-4 h-24 w-24 rounded-full ${getStreakBgColor()} opacity-40 blur-2xl`} />

      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <motion.div
              animate={
                registeredToday || streak > 0
                  ? {
                      scale: [1, 1.1, 1],
                    }
                  : {}
              }
              transition={{
                duration: 1.5,
                repeat: registeredToday || streak > 0 ? Number.POSITIVE_INFINITY : 0,
                repeatDelay: 0.5,
              }}
              className={`flex h-12 w-12 items-center justify-center rounded-xl ${getStreakBgColor()}`}
            >
              <motion.div
                animate={
                  streak > 0 || registeredToday
                    ? {
                        y: [0, -3, 0],
                        rotate: [-3, 3, -3],
                      }
                    : {}
                }
                transition={{
                  duration: 0.6,
                  repeat: streak > 0 || registeredToday ? Number.POSITIVE_INFINITY : 0,
                  repeatDelay: 0.2,
                }}
              >
                <Flame
                  className={`h-7 w-7 ${getStreakColor()} transition-all duration-300`}
                  fill={streak > 0 || registeredToday ? "currentColor" : "none"}
                  strokeWidth={streak > 0 || registeredToday ? 1.5 : 2}
                />
              </motion.div>
            </motion.div>
            <div>
              <p className="text-sm text-muted-foreground">Sequência de Registro</p>
              <p className={`text-xl font-bold ${getStreakColor()}`}>
                {streak} {streak === 1 ? "dia" : "dias"}
              </p>
            </div>
          </div>

          {!registeredToday ? (
            <Button
              size="sm"
              onClick={handleRegisterDay}
              disabled={isRegistering}
              className="gradient-primary text-primary-foreground"
            >
              {isRegistering ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Check className="h-4 w-4 mr-1" />
                  Registrar
                </>
              )}
            </Button>
          ) : (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex items-center gap-1 rounded-full bg-green-500/20 px-3 py-1.5"
            >
              <Check className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium text-green-500">Feito!</span>
            </motion.div>
          )}
        </div>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Trophy className="h-4 w-4 text-yellow-500" />
            <span>Recorde: {longestStreak} dias</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{registeredToday ? "Registrado hoje" : "Não perca a sequência!"}</span>
          </div>
        </div>

        <div className="mt-4 flex gap-1.5 justify-center">
          {Array.from({ length: 7 }).map((_, i) => {
            const isActive = i < Math.min(streak, 7)
            const intensity = isActive ? Math.min(0.5 + i * 0.1, 1) : 0.3
            return (
              <motion.div
                key={i}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: i * 0.05 }}
                className="flex flex-col items-center"
              >
                <motion.div
                  animate={isActive ? { y: [0, -2, 0], scale: [1, 1.1, 1] } : {}}
                  transition={{
                    duration: 0.5,
                    repeat: isActive ? Number.POSITIVE_INFINITY : 0,
                    repeatDelay: 0.3 + i * 0.1,
                  }}
                >
                  <Flame
                    className={`h-5 w-5 transition-all duration-300 ${
                      isActive
                        ? streak >= 14
                          ? "text-red-500"
                          : streak >= 7
                            ? "text-orange-500"
                            : "text-orange-400"
                        : "text-muted-foreground/30"
                    }`}
                    fill={isActive ? "currentColor" : "none"}
                    style={{ opacity: intensity }}
                  />
                </motion.div>
              </motion.div>
            )
          })}
        </div>
        <p className="mt-1 text-xs text-muted-foreground text-center">Últimos 7 dias</p>
      </div>
    </AnimatedCard>
  )
}
