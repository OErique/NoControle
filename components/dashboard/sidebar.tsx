"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutDashboard,
  AlertTriangle,
  Wallet,
  TrendingUp,
  Settings,
  Lock,
  Crown,
  ShieldCheck,
  ChevronLeft,
  Menu,
  Upload,
  Target,
  Bot,
  User,
  Users,
  MessageSquare,
  Dice5,
  CreditCard,
  Heart,
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useEffect, useMemo, useState } from "react"

interface SidebarProps {
  user: {
    name?: string | null
    email: string
    plan_name?: string
    plan_slug?: string
    modules_allowed?: number
    main_goal?: string
    gambling_enabled?: boolean
  }
}

const modules = [
  {
    id: "debts",
    name: "Sair do Vermelho",
    icon: AlertTriangle,
    href: "/debts",
    color: "text-danger",
    bgColor: "bg-danger/10",
    description: "Gerencie suas dívidas",
  },
  {
    id: "finances",
    name: "Controle Financeiro",
    icon: Wallet,
    href: "/finances",
    color: "text-primary",
    bgColor: "bg-primary/10",
    description: "Receitas e despesas",
  },
  {
    id: "investments",
    name: "Investimentos",
    icon: TrendingUp,
    href: "/investments",
    color: "text-accent",
    bgColor: "bg-accent/10",
    description: "Acompanhe seu patrimônio",
  },
]

const tools = [
  {
    id: "challenges",
    name: "Desafios",
    icon: Target,
    href: "/challenges",
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
    description: "Complete desafios e ganhe pontos",
    minPlan: 1,
  },
  {
    id: "cards",
    name: "Cartões",
    icon: CreditCard,
    href: "/cards",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    description: "Gerencie seus cartões",
    minPlan: 1,
  },
  {
    id: "import",
    name: "Importar Extrato",
    icon: Upload,
    href: "/import",
    color: "text-warning",
    bgColor: "bg-warning/10",
    description: "Importe extratos bancários",
    minPlan: 2,
  },
  {
    id: "copilot",
    name: "Alfred IA",
    icon: Bot,
    href: "/copilot",
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
    description: "Seu assistente financeiro",
    minPlan: 3,
    badge: "Pro",
  },
]

const gamblingItem = {
  id: "gambling",
  name: "Apostas",
  icon: Dice5,
  href: "/gambling",
  color: "text-red-500",
  bgColor: "bg-red-500/10",
  description: "Controle de apostas",
}

const social = [
  {
    id: "profile",
    name: "Meu Perfil",
    icon: User,
    href: "/profile",
    color: "text-cyan-500",
    bgColor: "bg-cyan-500/10",
  },
  {
    id: "community",
    name: "Comunidade",
    icon: Users,
    href: "/community",
    color: "text-pink-500",
    bgColor: "bg-pink-500/10",
  },
  {
    id: "tips",
    name: "Dicas",
    icon: MessageSquare,
    href: "/tips",
    color: "text-green-500",
    bgColor: "bg-green-500/10",
  },
  {
    id: "shared",
    name: "Perfil Casal",
    icon: Heart,
    href: "/shared",
    color: "text-rose-500",
    bgColor: "bg-rose-500/10",
    minPlan: 3, // Requires Total plan
    badge: "Total",
  },
]

export function DashboardSidebar({ user }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [pendingHref, setPendingHref] = useState<string | null>(null)

  const modulesAllowed = user.modules_allowed || 1
  const isPremium = modulesAllowed >= 3
  const planSlug = user.plan_slug || "essencial"
  const isGamblingEnabled = user.gambling_enabled === true

  const getModuleAccess = (moduleId: string, index: number) => {
    if (isPremium) return true
    if (modulesAllowed >= 2 && index < 2) return true
    if (user.main_goal === "sair_do_vermelho" && moduleId === "debts") return true
    if (user.main_goal === "organizar_financas" && moduleId === "finances") return true
    if (user.main_goal === "investir" && moduleId === "investments") return true
    return index === 0
  }

  const getToolAccess = (minPlan: number) => {
    return modulesAllowed >= minPlan
  }

  const getSocialAccess = (item: (typeof social)[0]) => {
    if (!item.minPlan) return true
    return modulesAllowed >= item.minPlan
  }

  const prefetchHrefs = useMemo(() => {
    const moduleHrefs = modules.map((module, index) => {
      const isUnlocked =
        isPremium ||
        (modulesAllowed >= 2 && index < 2) ||
        (user.main_goal === "sair_do_vermelho" && module.id === "debts") ||
        (user.main_goal === "organizar_financas" && module.id === "finances") ||
        (user.main_goal === "investir" && module.id === "investments") ||
        index === 0

      return isUnlocked ? module.href : "/upgrade"
    })
    const toolHrefs = tools.map((tool) => tool.href)
    const socialHrefs = social.map((item) => (!item.minPlan || modulesAllowed >= item.minPlan ? item.href : "/settings?tab=subscription"))

    return Array.from(new Set(["/dashboard", "/settings", "/gambling", ...moduleHrefs, ...toolHrefs, ...socialHrefs]))
  }, [isPremium, modulesAllowed, user.main_goal])

  useEffect(() => {
    prefetchHrefs.forEach((href) => {
      router.prefetch(href)
    })
  }, [prefetchHrefs, router])

  useEffect(() => {
    setPendingHref(null)
    setIsMobileOpen(false)
  }, [pathname])

  const handleNavigate = (href: string) => {
    if (href.split("?")[0] !== pathname) {
      setPendingHref(href)
    }
    setIsMobileOpen(false)
    router.prefetch(href)
  }

  const isRoutePending = (href: string) => pendingHref === href

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="fixed left-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-lg bg-card border border-border lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col border-r border-border bg-sidebar transition-all duration-300",
          isCollapsed ? "w-20" : "w-64",
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
          {!isCollapsed && (
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-primary">
                <TrendingUp className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold text-sidebar-foreground">NoControle</span>
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setIsCollapsed(!isCollapsed)
              setIsMobileOpen(false)
            }}
            className="h-8 w-8 text-sidebar-foreground"
          >
            <ChevronLeft className={cn("h-4 w-4 transition-transform", isCollapsed && "rotate-180")} />
          </Button>
        </div>

        {/* Plan badge */}
        {!isCollapsed && (
          <div className="border-b border-sidebar-border p-4">
            <Link href="/upgrade">
              <div
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 transition-colors hover:opacity-80",
                  planSlug === "total"
                    ? "bg-gradient-to-r from-emerald-500/15 to-amber-500/15 text-emerald-300"
                    : planSlug === "completo"
                      ? "bg-warning/20 text-warning"
                      : "bg-sidebar-accent text-sidebar-accent-foreground",
                )}
              >
                {planSlug === "total" ? (
                  <ShieldCheck className="h-4 w-4" />
                ) : planSlug === "completo" ? (
                  <Crown className="h-4 w-4" />
                ) : null}
                <span className="text-sm font-medium">{user.plan_name || "Essencial"}</span>
                {planSlug === "essencial" && <span className="ml-auto text-xs text-primary">Upgrade</span>}
              </div>
            </Link>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
          {/* Dashboard link */}
          <Link
            href="/dashboard"
            onClick={() => handleNavigate("/dashboard")}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              pathname === "/dashboard"
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent/50",
            )}
          >
            <LayoutDashboard className="h-5 w-5 shrink-0" />
            {!isCollapsed && <span>Dashboard</span>}
            {isRoutePending("/dashboard") && <Loader2 className="ml-auto h-3.5 w-3.5 animate-spin" />}
          </Link>

          {/* Module section */}
          {!isCollapsed && (
            <div className="mt-6 mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Módulos
            </div>
          )}

          {modules.map((module, index) => {
            const isUnlocked = getModuleAccess(module.id, index)
            const isActive = pathname.startsWith(module.href)

            return (
              <Link
                key={module.id}
                href={isUnlocked ? module.href : "/upgrade"}
                onClick={() => handleNavigate(isUnlocked ? module.href : "/upgrade")}
                className={cn(
                  "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? `${module.bgColor} ${module.color}`
                    : isUnlocked
                      ? "text-sidebar-foreground hover:bg-sidebar-accent/50"
                      : "text-muted-foreground opacity-60 hover:opacity-80",
                )}
              >
                <module.icon className="h-5 w-5 shrink-0" />
                {!isCollapsed && (
                  <>
                    <span className="flex-1">{module.name}</span>
                    {isRoutePending(isUnlocked ? module.href : "/upgrade") && (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    )}
                    {!isUnlocked && <Lock className="h-4 w-4" />}
                  </>
                )}
                {isCollapsed && !isUnlocked && <Lock className="absolute right-1 top-1 h-3 w-3" />}
              </Link>
            )
          })}

          {!isCollapsed && (
            <div className="mt-6 mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Ferramentas
            </div>
          )}

          {tools.map((tool) => {
            const isUnlocked = getToolAccess(tool.minPlan)
            const isActive = pathname.startsWith(tool.href)

            return (
              <Link
                key={tool.id}
                href={tool.href}
                onClick={() => handleNavigate(tool.href)}
                className={cn(
                  "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? `${tool.bgColor} ${tool.color}`
                    : isUnlocked
                      ? "text-sidebar-foreground hover:bg-sidebar-accent/50"
                      : "text-muted-foreground opacity-60 hover:opacity-80",
                )}
              >
                <tool.icon className="h-5 w-5 shrink-0" />
                {!isCollapsed && (
                  <>
                    <span className="flex-1">{tool.name}</span>
                    {isRoutePending(tool.href) && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    {tool.badge && isUnlocked && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400">
                        {tool.badge}
                      </span>
                    )}
                    {!isUnlocked && <Lock className="h-4 w-4" />}
                  </>
                )}
                {isCollapsed && !isUnlocked && <Lock className="absolute right-1 top-1 h-3 w-3" />}
              </Link>
            )
          })}

          <Link
            href="/gambling"
            onClick={() => handleNavigate("/gambling")}
            className={cn(
              "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              pathname.startsWith("/gambling")
                ? `${gamblingItem.bgColor} ${gamblingItem.color}`
                : isGamblingEnabled
                  ? "text-sidebar-foreground hover:bg-sidebar-accent/50"
                  : "text-muted-foreground opacity-60 hover:opacity-80",
            )}
          >
            <Dice5 className="h-5 w-5 shrink-0" />
            {!isCollapsed && (
              <>
                <span className="flex-1">{gamblingItem.name}</span>
                {isRoutePending("/gambling") && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {!isGamblingEnabled && <Lock className="h-4 w-4" />}
              </>
            )}
            {isCollapsed && !isGamblingEnabled && <Lock className="absolute right-1 top-1 h-3 w-3" />}
          </Link>

          {/* Social section */}
          {!isCollapsed && (
            <div className="mt-6 mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Social
            </div>
          )}

          {social.map((item) => {
            const isActive = pathname.startsWith(item.href)
            const isUnlocked = getSocialAccess(item)

            return (
              <Link
                key={item.id}
                href={isUnlocked ? item.href : "/settings?tab=subscription"}
                onClick={() => handleNavigate(isUnlocked ? item.href : "/settings?tab=subscription")}
                className={cn(
                  "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? `${item.bgColor} ${item.color}`
                    : isUnlocked
                      ? "text-sidebar-foreground hover:bg-sidebar-accent/50"
                      : "text-muted-foreground opacity-60 hover:opacity-80",
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {!isCollapsed && (
                  <>
                    <span className="flex-1">{item.name}</span>
                    {isRoutePending(isUnlocked ? item.href : "/settings?tab=subscription") && (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    )}
                    {item.badge && isUnlocked && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400">
                        {item.badge}
                      </span>
                    )}
                    {!isUnlocked && <Lock className="h-4 w-4" />}
                  </>
                )}
                {isCollapsed && !isUnlocked && <Lock className="absolute right-1 top-1 h-3 w-3" />}
              </Link>
            )
          })}
        </nav>

        {/* Settings */}
        <div className="border-t border-sidebar-border p-4">
          <Link
            href="/settings"
            onClick={() => handleNavigate("/settings")}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              pathname === "/settings"
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent/50",
            )}
          >
            <Settings className="h-5 w-5 shrink-0" />
            {!isCollapsed && <span>Configurações</span>}
          </Link>
        </div>
      </aside>
    </>
  )
}
