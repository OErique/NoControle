"use client"

import type React from "react"

import { useEffect, useRef, useState, type ReactNode } from "react"

interface ScrollRevealProps {
  children: ReactNode
  className?: string
  delay?: number
  direction?: "up" | "down" | "left" | "right" | "scale"
  duration?: number
  once?: boolean
}

export function ScrollReveal({
  children,
  className = "",
  delay = 0,
  direction = "up",
  duration = 600,
  once = true,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          if (once) observer.disconnect()
        } else if (!once) {
          setIsVisible(false)
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" },
    )

    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [once])

  const getTransform = () => {
    if (isVisible) return "translate3d(0, 0, 0) scale(1)"
    switch (direction) {
      case "up":
        return "translate3d(0, 60px, 0)"
      case "down":
        return "translate3d(0, -60px, 0)"
      case "left":
        return "translate3d(60px, 0, 0)"
      case "right":
        return "translate3d(-60px, 0, 0)"
      case "scale":
        return "translate3d(0, 30px, 0) scale(0.95)"
      default:
        return "translate3d(0, 60px, 0)"
    }
  }

  return (
    <div
      ref={ref}
      className={className}
      style={{
        transform: getTransform(),
        opacity: isVisible ? 1 : 0,
        transition: `transform ${duration}ms cubic-bezier(0.25, 0.46, 0.45, 0.94) ${delay}ms, opacity ${duration}ms ease ${delay}ms`,
        willChange: "transform, opacity",
      }}
    >
      {children}
    </div>
  )
}

interface ParallaxProps {
  children: ReactNode
  className?: string
  speed?: number
}

export function Parallax({ children, className = "", speed = 0.5 }: ParallaxProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [offset, setOffset] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      if (ref.current) {
        const rect = ref.current.getBoundingClientRect()
        const scrolled = window.scrollY
        const rate = scrolled * speed * 0.1
        setOffset(rate)
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [speed])

  return (
    <div
      ref={ref}
      className={className}
      style={{
        transform: `translateY(${offset}px)`,
        willChange: "transform",
      }}
    >
      {children}
    </div>
  )
}

interface HeroMockupProps {
  className?: string
}

export function HeroMockup({ className = "" }: HeroMockupProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [scrollProgress, setScrollProgress] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY
      const maxScroll = window.innerHeight * 0.8
      const progress = Math.min(scrollY / maxScroll, 1)
      setScrollProgress(progress)
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Animação: começa menor e mais distante, conforme scroll aumenta o zoom e se aproxima
  const scale = 0.85 + scrollProgress * 0.15
  const translateY = 30 - scrollProgress * 30
  const rotateX = 15 - scrollProgress * 15
  const opacity = 0.7 + scrollProgress * 0.3

  return (
    <div
      ref={ref}
      className={`relative ${className}`}
      style={{
        perspective: "1500px",
        perspectiveOrigin: "center center",
      }}
    >
      <div
        className="relative mx-auto w-full max-w-5xl"
        style={{
          transform: `translateY(${translateY}px) scale(${scale}) rotateX(${rotateX}deg)`,
          opacity,
          transition: "transform 0.1s ease-out, opacity 0.1s ease-out",
          transformStyle: "preserve-3d",
        }}
      >
        {/* Glow effect behind */}
        <div
          className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-primary/30 via-accent/20 to-primary/30 blur-2xl"
          style={{ opacity: 0.5 + scrollProgress * 0.5 }}
        />

        {/* Main mockup container */}
        <div className="relative rounded-2xl border border-border/50 bg-card/90 backdrop-blur-xl shadow-2xl overflow-hidden">
          {/* Browser bar */}
          <div className="flex items-center gap-2 border-b border-border/50 bg-muted/50 px-4 py-3">
            <div className="flex gap-1.5">
              <div className="h-3 w-3 rounded-full bg-red-500/80" />
              <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
              <div className="h-3 w-3 rounded-full bg-green-500/80" />
            </div>
            <div className="flex-1 mx-4">
              <div className="mx-auto max-w-md rounded-lg bg-background/50 px-4 py-1.5 text-xs text-muted-foreground text-center">
                app.nocontrole.com.br/dashboard
              </div>
            </div>
          </div>

          {/* Dashboard content */}
          <div className="p-6 bg-background/95">
            {/* Top stats */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              {[
                { label: "Saldo", value: "R$ 12.450", color: "text-primary", bg: "bg-primary/10" },
                { label: "Receitas", value: "R$ 8.200", color: "text-green-500", bg: "bg-green-500/10" },
                { label: "Despesas", value: "R$ 3.150", color: "text-red-500", bg: "bg-red-500/10" },
                { label: "Economia", value: "38%", color: "text-accent", bg: "bg-accent/10" },
              ].map((stat, i) => (
                <div key={i} className={`rounded-xl ${stat.bg} p-4`}>
                  <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
                  <p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p>
                </div>
              ))}
            </div>

            {/* Chart area */}
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2 rounded-xl border border-border/50 bg-card p-4">
                <p className="text-sm font-medium mb-4">Evolução Mensal</p>
                <div className="flex items-end gap-2 h-32">
                  {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
                    <div key={i} className="flex-1 flex flex-col gap-1">
                      <div
                        className="w-full rounded-t bg-gradient-to-t from-primary to-primary/50 transition-all duration-500"
                        style={{ height: `${h}%`, transitionDelay: `${i * 50}ms` }}
                      />
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-xl border border-border/50 bg-card p-4">
                <p className="text-sm font-medium mb-4">Por Categoria</p>
                <div className="space-y-3">
                  {[
                    { label: "Moradia", pct: 35, color: "bg-primary" },
                    { label: "Alimentação", pct: 25, color: "bg-accent" },
                    { label: "Transporte", pct: 20, color: "bg-orange-500" },
                    { label: "Lazer", pct: 15, color: "bg-purple-500" },
                  ].map((cat, i) => (
                    <div key={i}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">{cat.label}</span>
                        <span>{cat.pct}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full ${cat.color} rounded-full transition-all duration-700`}
                          style={{ width: `${cat.pct}%`, transitionDelay: `${i * 100}ms` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

interface GlowCardProps {
  children: ReactNode
  className?: string
  glowColor?: string
}

export function GlowCard({ children, className = "", glowColor = "primary" }: GlowCardProps) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [isHovered, setIsHovered] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    })
  }

  return (
    <div
      ref={cardRef}
      className={`relative group ${className}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Glow effect */}
      <div
        className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: isHovered
            ? `radial-gradient(400px circle at ${mousePosition.x}px ${mousePosition.y}px, var(--${glowColor}) 0%, transparent 70%)`
            : "none",
          opacity: isHovered ? 0.15 : 0,
        }}
      />
      {children}
    </div>
  )
}

export function FloatingOrbs() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Primary orb */}
      <div className="absolute w-[600px] h-[600px] rounded-full opacity-30 blur-3xl top-[10%] left-[10%] bg-primary/50 animate-float-slow" />
      {/* Accent orb */}
      <div className="absolute w-[500px] h-[500px] rounded-full opacity-20 blur-3xl bottom-[20%] right-[10%] bg-accent/50 animate-float-reverse" />
      {/* Small accent orb */}
      <div className="absolute w-[300px] h-[300px] rounded-full opacity-20 blur-2xl top-[50%] right-[30%] bg-primary/40 animate-float-fast" />
    </div>
  )
}
