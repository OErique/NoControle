"use client"

import { motion } from "framer-motion"
import { TrendingUp, TrendingDown, Info, Lock } from "lucide-react"
import { AnimatedCard } from "@/components/ui/animated-card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { getScoreInfo } from "@/lib/gamification"

interface FinancialScoreCardProps {
  score: number
  previousScore?: number
  isLocked?: boolean
  planSlug?: string
}

export function FinancialScoreCard({ score, previousScore, isLocked, planSlug }: FinancialScoreCardProps) {
  const scoreInfo = getScoreInfo(score)
  const scoreDiff = previousScore ? score - previousScore : 0

  // Calculate the stroke dashoffset for the circular progress
  const radius = 70
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (score / 100) * circumference

  const getScoreColor = () => {
    if (score >= 80) return "oklch(0.75 0.18 142)"
    if (score >= 60) return "oklch(0.7 0.15 160)"
    if (score >= 40) return "oklch(0.8 0.18 85)"
    return "oklch(0.65 0.2 25)"
  }

  if (isLocked) {
    return (
      <AnimatedCard delay={0.2} className="relative overflow-hidden">
        <div className="absolute inset-0 backdrop-blur-sm bg-background/50 z-10 flex flex-col items-center justify-center p-6">
          <Lock className="h-8 w-8 text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground text-center mb-4">
            Desbloqueie seu Score Financeiro no plano Completo
          </p>
          <Link href="/upgrade">
            <Button size="sm" className="gradient-primary text-primary-foreground">
              Ver planos
            </Button>
          </Link>
        </div>
        <div className="flex items-center justify-between opacity-30">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Score Financeiro</p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold">??</span>
              <span className="text-muted-foreground">/100</span>
            </div>
          </div>
          <div className="relative h-36 w-36">
            <svg className="h-full w-full -rotate-90" viewBox="0 0 160 160">
              <circle
                cx="80"
                cy="80"
                r={radius}
                fill="none"
                stroke="currentColor"
                strokeWidth="12"
                className="text-muted"
              />
            </svg>
          </div>
        </div>
      </AnimatedCard>
    )
  }

  return (
    <AnimatedCard delay={0.2} className="relative overflow-hidden">
      {/* Background gradient based on score */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          background: `radial-gradient(circle at 80% 20%, ${getScoreColor()}, transparent 50%)`,
        }}
      />

      <div className="relative flex items-center justify-between">
        {/* Left side - Score info */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-sm text-muted-foreground">Score Financeiro</p>
            <button className="text-muted-foreground hover:text-foreground transition-colors">
              <Info className="h-4 w-4" />
            </button>
          </div>

          <div className="flex items-baseline gap-2 mb-2">
            <motion.span
              key={score}
              initial={{ scale: 1.2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-4xl font-bold"
              style={{ color: getScoreColor() }}
            >
              {score}
            </motion.span>
            <span className="text-muted-foreground">/100</span>
          </div>

          <div className="flex items-center gap-2 mb-3">
            <span
              className="rounded-full px-2 py-0.5 text-xs font-medium"
              style={{
                backgroundColor: `color-mix(in oklch, ${getScoreColor()} 20%, transparent)`,
                color: getScoreColor(),
              }}
            >
              {scoreInfo.label}
            </span>
            {scoreDiff !== 0 && (
              <span className={`flex items-center gap-0.5 text-xs ${scoreDiff > 0 ? "text-success" : "text-danger"}`}>
                {scoreDiff > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {scoreDiff > 0 ? "+" : ""}
                {scoreDiff} pts
              </span>
            )}
          </div>

          <p className="text-sm text-muted-foreground">{scoreInfo.message}</p>
        </div>

        {/* Right side - Circular progress */}
        <div className="relative h-36 w-36 shrink-0">
          <svg className="h-full w-full -rotate-90" viewBox="0 0 160 160">
            {/* Background circle */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth="12"
              className="text-muted"
            />
            {/* Progress circle */}
            <motion.circle
              cx="80"
              cy="80"
              r={radius}
              fill="none"
              stroke={getScoreColor()}
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </svg>
          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: "spring" }}
              className="text-3xl font-bold"
              style={{ color: getScoreColor() }}
            >
              {score}
            </motion.span>
          </div>
        </div>
      </div>
    </AnimatedCard>
  )
}
