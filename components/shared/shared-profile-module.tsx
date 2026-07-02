"use client"

import { useState, useEffect } from "react"
import {
  Heart,
  Mail,
  Check,
  X,
  Wallet,
  Target,
  Settings,
  Send,
  Clock,
  Link2,
  Unlink,
  Plus,
  TrendingUp,
  TrendingDown,
  Flame,
  Trophy,
  Star,
  PieChart,
  Calendar,
  History,
  Sparkles,
  Lock,
  MoreVertical,
  Pause,
  Play,
  Trash2,
  DollarSign,
  Lightbulb,
  Crown,
  MoreHorizontal,
  Pencil,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { AnimatedCard } from "@/components/ui/animated-card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { formatCurrency } from "@/lib/utils"

interface SharedProfileModuleProps {
  userId: string
  userName: string
  userEmail: string
}

interface Partner {
  id: string
  name: string
  email: string
  avatar: string
  points: number
}

interface SharedProfile {
  id: string
  partner_email: string
  partner: Partner
  status: string
  share_expenses: boolean
  share_incomes: boolean
  share_debts: boolean
  share_investments: boolean
  share_goals: boolean
  couple_level: number
  couple_points: number
  couple_streak: number
  longest_couple_streak: number
  monthly_limit: number
  who_can_create_goals: string
  who_can_edit_goals: string
  include_personal_income: boolean
  isOwner: boolean
  created_at: string
  accepted_at?: string
  owner_name?: string
}

interface SharedGoal {
  id: string
  name: string
  target_amount: number
  current_amount: number
  target_date: string
  category: string
  contribution_type: string
  monthly_contribution: number
  is_paused: boolean
  description: string
  icon: string
  created_by_name: string
  contributions: Array<{
    id: string
    amount: number
    notes: string
    created_at: string
    user_name: string
  }>
  status?: string
}

interface DashboardStats {
  totalExpenses: number
  activeGoals: number
  monthlySavings: number
  coupleLevel: number
  couplePoints: number
  coupleStreak: number
  longestStreak: number
}

interface Activity {
  id: string
  activity_type: string
  title: string
  description: string
  created_at: string
  user_name: string
  avatar_url: string
}

interface Insight {
  type: string
  icon: string
  message: string
}

interface Achievement {
  id: string
  achievement_type: string
  name: string
  description: string
  icon: string
  points: number
  earned_at: string
}

interface CoupleExpense {
  id: string
  description: string
  amount: number
  category: string
  expense_date: string
  added_by_name: string
  split_type: string
  owner_percentage: number
  partner_percentage: number
}

const COUPLE_LEVELS = [
  { level: 1, name: "Iniciantes", minPoints: 0, color: "from-gray-400 to-gray-500" },
  { level: 2, name: "Parceiros", minPoints: 100, color: "from-green-400 to-green-500" },
  { level: 3, name: "Comprometidos", minPoints: 300, color: "from-blue-400 to-blue-500" },
  { level: 4, name: "Sintonizados", minPoints: 600, color: "from-purple-400 to-purple-500" },
  { level: 5, name: "Alma Gêmea", minPoints: 1000, color: "from-amber-400 to-amber-500" },
]

const GOAL_CATEGORIES = [
  { value: "viagem", label: "Viagem", icon: "plane" },
  { value: "casa", label: "Casa", icon: "home" },
  { value: "carro", label: "Carro", icon: "car" },
  { value: "casamento", label: "Casamento", icon: "heart" },
  { value: "emergencia", label: "Emergência", icon: "shield" },
  { value: "investimento", label: "Investimento", icon: "trending-up" },
  { value: "outro", label: "Outro", icon: "target" },
]

export function SharedProfileModule({ userId, userName, userEmail }: SharedProfileModuleProps) {
  const [profile, setProfile] = useState<SharedProfile | null>(null)
  const [pendingInvites, setPendingInvites] = useState<SharedProfile[]>([])
  const [goals, setGoals] = useState<SharedGoal[]>([])
  const [expenses, setExpenses] = useState<CoupleExpense[]>([])
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null)
  const [activities, setActivities] = useState<Activity[]>([])
  const [insights, setInsights] = useState<Insight[]>([])
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [hasAccess, setHasAccess] = useState(false)
  const [userPlan, setUserPlan] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [partnerEmail, setPartnerEmail] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [showEndDialog, setShowEndDialog] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")

  // Goal dialog states
  const [showGoalDialog, setShowGoalDialog] = useState(false)
  const [isCreatingGoal, setIsCreatingGoal] = useState(false)
  const [newGoal, setNewGoal] = useState({
    name: "",
    target_amount: "",
    target_date: "",
    category: "viagem",
    contribution_type: "manual",
    monthly_contribution: "",
    description: "",
  })

  // Contribution dialog
  const [showContributeDialog, setShowContributeDialog] = useState(false)
  const [selectedGoal, setSelectedGoal] = useState<SharedGoal | null>(null)
  const [contributionAmount, setContributionAmount] = useState("")
  const [contributionNotes, setContributionNotes] = useState("")
  const [isContributing, setIsContributing] = useState(false)

  // Expense dialog
  const [showExpenseDialog, setShowExpenseDialog] = useState(false)
  const [isCreatingExpense, setIsCreatingExpense] = useState(false)
  const [newExpense, setNewExpense] = useState({
    description: "",
    amount: "",
    category: "outros",
    expense_date: new Date().toISOString().split("T")[0],
    split_type: "equal",
    owner_percentage: "50",
  })

  const [editingExpense, setEditingExpense] = useState<CoupleExpense | null>(null)
  const [showEditExpenseDialog, setShowEditExpenseDialog] = useState(false)
  const [isDeletingExpense, setIsDeletingExpense] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const [profileRes, invitesRes, goalsRes] = await Promise.all([
        fetch("/api/shared/profile"),
        fetch("/api/shared/invites"),
        fetch("/api/shared/goals"),
      ])

      if (profileRes.ok) {
        const data = await profileRes.json()
        setProfile(data.profile)
        setHasAccess(data.hasAccess)
        setUserPlan(data.userPlan || "")

        if (data.profile?.status === "accepted") {
          fetchDashboardData()
          fetchExpenses()
          fetchInsights()
          checkAchievements()
        }
      }

      if (invitesRes.ok) {
        const data = await invitesRes.json()
        setPendingInvites(data.invites || [])
      }

      if (goalsRes.ok) {
        const data = await goalsRes.json()
        setGoals(data.goals || [])
      }
    } catch (error) {
      console.error("Error fetching shared data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchDashboardData = async () => {
    try {
      const res = await fetch("/api/shared/dashboard")
      if (res.ok) {
        const data = await res.json()
        setDashboardStats(data.stats)
        setActivities(data.activities || [])
        setAchievements(data.achievements || [])
      }
    } catch (error) {
      console.error("Error fetching dashboard:", error)
    }
  }

  const fetchGoals = async () => {
    try {
      const res = await fetch("/api/shared/goals")
      if (res.ok) {
        const data = await res.json()
        setGoals(data.goals || [])
      }
    } catch (error) {
      console.error("Error fetching goals:", error)
    }
  }

  const fetchExpenses = async () => {
    try {
      const res = await fetch("/api/shared/expenses")
      if (res.ok) {
        const data = await res.json()
        setExpenses(data.expenses || [])
      }
    } catch (error) {
      console.error("Error fetching expenses:", error)
    }
  }

  const fetchInsights = async () => {
    try {
      const res = await fetch("/api/shared/insights")
      if (res.ok) {
        const data = await res.json()
        setInsights(data.insights || [])
      }
    } catch (error) {
      console.error("Error fetching insights:", error)
    }
  }

  const checkAchievements = async () => {
    try {
      await fetch("/api/shared/achievements/check", { method: "POST" })
      // Refresh dashboard to get updated points
      fetchDashboardData()
    } catch (error) {
      console.error("Error checking achievements:", error)
    }
  }

  const handleInvite = async () => {
    if (!partnerEmail) return

    if (partnerEmail.toLowerCase() === userEmail.toLowerCase()) {
      toast.error("Você não pode enviar um convite para si mesmo")
      return
    }

    setIsSending(true)

    try {
      const res = await fetch("/api/shared/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: partnerEmail }),
      })

      if (res.ok) {
        toast.success("Convite enviado!")
        setPartnerEmail("")
        fetchData()
      } else {
        const data = await res.json()
        toast.error(data.error || "Erro ao enviar convite")
      }
    } catch (error) {
      toast.error("Erro ao enviar convite")
    } finally {
      setIsSending(false)
    }
  }

  const handleAcceptInvite = async (inviteId: string) => {
    try {
      const res = await fetch("/api/shared/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteId }),
      })

      if (res.ok) {
        toast.success("Convite aceito! Bem-vindos ao perfil compartilhado!")
        fetchData()
      }
    } catch (error) {
      toast.error("Erro ao aceitar convite")
    }
  }

  const handleRejectInvite = async (inviteId: string) => {
    try {
      const res = await fetch("/api/shared/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteId }),
      })

      if (res.ok) {
        toast.success("Convite recusado")
        fetchData()
      }
    } catch (error) {
      toast.error("Erro ao recusar convite")
    }
  }

  const handleEndConnection = async () => {
    try {
      const res = await fetch("/api/shared/end", { method: "POST" })
      if (res.ok) {
        toast.success("Conexão encerrada. Seu histórico foi preservado.")
        setProfile(null)
        setShowEndDialog(false)
        fetchData()
      }
    } catch (error) {
      toast.error("Erro ao encerrar conexão")
    }
  }

  const handleUpdateSettings = async (settings: Partial<SharedProfile>) => {
    try {
      const res = await fetch("/api/shared/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      })

      if (res.ok) {
        toast.success("Configurações salvas")
        fetchData()
      }
    } catch (error) {
      toast.error("Erro ao salvar")
    }
  }

  const handleCreateGoal = async () => {
    if (!newGoal.name || !newGoal.target_amount) {
      toast.error("Nome e valor são obrigatórios")
      return
    }

    setIsCreatingGoal(true)
    try {
      const res = await fetch("/api/shared/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newGoal.name,
          target_amount: Number.parseFloat(newGoal.target_amount),
          target_date: newGoal.target_date || null,
          category: newGoal.category,
          contribution_type: newGoal.contribution_type,
          monthly_contribution: newGoal.monthly_contribution ? Number.parseFloat(newGoal.monthly_contribution) : null,
          description: newGoal.description,
        }),
      })

      if (res.ok) {
        toast.success("Meta criada com sucesso!")
        setShowGoalDialog(false)
        setNewGoal({
          name: "",
          target_amount: "",
          target_date: "",
          category: "viagem",
          contribution_type: "manual",
          monthly_contribution: "",
          description: "",
        })
        fetchGoals()
        fetchDashboardData()
      } else {
        const data = await res.json()
        toast.error(data.error || "Erro ao criar meta")
      }
    } catch (error) {
      toast.error("Erro ao criar meta")
    } finally {
      setIsCreatingGoal(false)
    }
  }

  const handleContribute = async (goalId: string, amount: number, notes?: string) => {
    try {
      const res = await fetch(`/api/shared/goals/${goalId}/contribute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, notes }),
      })

      if (res.ok) {
        const data = await res.json()
        toast.success(data.message)
        setShowContributeDialog(false)
        setContributionAmount("")
        setContributionNotes("")
        setSelectedGoal(null)
        fetchGoals()
        fetchDashboardData()
        checkAchievements()
      } else {
        const data = await res.json()
        toast.error(data.error || "Erro ao contribuir")
      }
    } catch (error) {
      toast.error("Erro ao contribuir")
    } finally {
      setIsContributing(false)
    }
  }

  const handleDeleteGoal = async (goalId: string) => {
    try {
      const res = await fetch(`/api/shared/goals/${goalId}`, { method: "DELETE" })
      if (res.ok) {
        toast.success("Meta excluída")
        fetchGoals()
      }
    } catch (error) {
      toast.error("Erro ao excluir meta")
    }
  }

  const handleTogglePauseGoal = async (goal: SharedGoal) => {
    try {
      const res = await fetch(`/api/shared/goals/${goal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_paused: !goal.is_paused }),
      })

      if (res.ok) {
        toast.success(goal.is_paused ? "Meta retomada" : "Meta pausada")
        fetchGoals()
      }
    } catch (error) {
      toast.error("Erro ao atualizar meta")
    }
  }

  const handleCreateExpense = async () => {
    if (!newExpense.description || !newExpense.amount) {
      toast.error("Descrição e valor são obrigatórios")
      return
    }

    setIsCreatingExpense(true)
    try {
      const res = await fetch("/api/shared/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: newExpense.description,
          amount: Number.parseFloat(newExpense.amount),
          category: newExpense.category,
          expense_date: newExpense.expense_date,
          split_type: newExpense.split_type,
          owner_percentage: Number.parseFloat(newExpense.owner_percentage),
        }),
      })

      if (res.ok) {
        toast.success("Despesa adicionada!")
        setShowExpenseDialog(false)
        setNewExpense({
          description: "",
          amount: "",
          category: "outros",
          expense_date: new Date().toISOString().split("T")[0],
          split_type: "equal",
          owner_percentage: "50",
        })
        fetchExpenses()
        fetchDashboardData()
      } else {
        const data = await res.json()
        toast.error(data.error || "Erro ao criar despesa")
      }
    } catch (error) {
      toast.error("Erro ao criar despesa")
    } finally {
      setIsCreatingExpense(false)
    }
  }

  const handleEditExpense = async () => {
    if (!editingExpense) return

    try {
      const res = await fetch(`/api/shared/expenses/${editingExpense.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: editingExpense.description,
          amount: editingExpense.amount,
          category: editingExpense.category,
          expense_date: editingExpense.expense_date,
          split_type: editingExpense.split_type,
          owner_percentage: editingExpense.owner_percentage,
        }),
      })

      if (res.ok) {
        toast.success("Despesa atualizada!")
        setShowEditExpenseDialog(false)
        setEditingExpense(null)
        fetchExpenses()
        fetchDashboardData()
      } else {
        const data = await res.json()
        toast.error(data.error || "Erro ao atualizar despesa")
      }
    } catch (error) {
      toast.error("Erro ao atualizar despesa")
    }
  }

  const handleDeleteExpense = async (expenseId: string) => {
    setIsDeletingExpense(true)
    try {
      const res = await fetch(`/api/shared/expenses/${expenseId}`, {
        method: "DELETE",
      })

      if (res.ok) {
        toast.success("Despesa excluída!")
        fetchExpenses()
        fetchDashboardData()
      } else {
        const data = await res.json()
        toast.error(data.error || "Erro ao excluir despesa")
      }
    } catch (error) {
      toast.error("Erro ao excluir despesa")
    } finally {
      setIsDeletingExpense(false)
    }
  }

  const getCoupleLevel = () => {
    const points = dashboardStats?.couplePoints || 0
    return COUPLE_LEVELS.findLast((l) => points >= l.minPoints) || COUPLE_LEVELS[0]
  }

  const getNextLevel = () => {
    const currentLevel = getCoupleLevel()
    return COUPLE_LEVELS.find((l) => l.level === currentLevel.level + 1)
  }

  const getProgressToNextLevel = () => {
    const points = dashboardStats?.couplePoints || 0
    const currentLevel = getCoupleLevel()
    const nextLevel = getNextLevel()
    if (!nextLevel) return 100
    const pointsInLevel = points - currentLevel.minPoints
    const levelRange = nextLevel.minPoints - currentLevel.minPoints
    return Math.min((pointsInLevel / levelRange) * 100, 100)
  }

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  // No access - show upgrade prompt
  if (!hasAccess && !profile) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Perfil Compartilhado</h1>
          <p className="text-muted-foreground">Gerencie finanças em casal</p>
        </div>

        {/* Upgrade message */}
        <AnimatedCard className="p-8 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-500/10">
              <Lock className="h-8 w-8 text-rose-500" />
            </div>
            <h2 className="text-xl font-bold">Perfil Casal</h2>
            <p className="text-muted-foreground max-w-md">
              Compartilhe suas finanças com seu cônjuge, criem metas juntos e acompanhem a evolução financeira do casal.
            </p>
            <div className="flex flex-col gap-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-rose-500" />
                <span>Dashboard financeiro do casal</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-rose-500" />
                <span>Metas compartilhadas com contribuições</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-rose-500" />
                <span>Sistema de níveis e conquistas do casal</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-rose-500" />
                <span>Insights financeiros combinados</span>
              </div>
            </div>
            <Button className="mt-4 bg-rose-500 hover:bg-rose-600" asChild>
              <a href="/settings?tab=subscription">
                <Crown className="mr-2 h-4 w-4" />
                Fazer Upgrade para Total
              </a>
            </Button>
          </div>
        </AnimatedCard>
      </div>
    )
  }

  // Not connected - show invite screen
  if (!profile || profile.status !== "accepted") {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Perfil Compartilhado</h1>
          <p className="text-muted-foreground">Gerencie finanças em casal</p>
        </div>

        {pendingInvites.length > 0 && (
          <AnimatedCard className="border-primary/30 bg-gradient-to-r from-primary/5 to-rose-500/5">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Convites Pendentes</h3>
                <p className="text-sm text-muted-foreground">Alguém quer compartilhar finanças com você!</p>
              </div>
            </div>
            <div className="space-y-3">
              {pendingInvites.map((invite) => (
                <div key={invite.id} className="flex items-center justify-between p-4 rounded-lg bg-card border">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-primary/20 text-primary">
                        {(invite.owner_name || "U")[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{invite.owner_name || "Usuário"}</p>
                      <p className="text-sm text-muted-foreground">Quer compartilhar finanças com você</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <Clock className="h-3 w-3" />
                        {new Date(invite.created_at).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleRejectInvite(invite.id)}>
                      <X className="h-4 w-4" />
                    </Button>
                    <Button size="sm" onClick={() => handleAcceptInvite(invite.id)}>
                      <Check className="h-4 w-4 mr-1" />
                      Aceitar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </AnimatedCard>
        )}

        <AnimatedCard className="text-center py-12">
          <div className="max-w-lg mx-auto space-y-8">
            <div className="relative">
              <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-rose-500/20 to-pink-500/20 animate-pulse">
                <Heart className="h-12 w-12 text-rose-500" />
              </div>
              <Sparkles className="absolute top-0 right-1/3 h-6 w-6 text-amber-500 animate-bounce" />
            </div>

            <div className="space-y-3">
              <h2 className="text-2xl font-bold">Finanças a Dois</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Convide seu cônjuge ou parceiro(a) para organizar as finanças juntos. Criem metas, dividam despesas e
                acompanhem o progresso como um time!
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-left">
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <Target className="h-6 w-6 text-primary" />
                <p className="font-medium text-sm">Metas Compartilhadas</p>
                <p className="text-xs text-muted-foreground">Sonhem e conquistem juntos</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <Wallet className="h-6 w-6 text-success" />
                <p className="font-medium text-sm">Despesas em Comum</p>
                <p className="text-xs text-muted-foreground">Dividam gastos facilmente</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <Trophy className="h-6 w-6 text-amber-500" />
                <p className="font-medium text-sm">Conquistas do Casal</p>
                <p className="text-xs text-muted-foreground">Celebrem cada vitória</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <Lightbulb className="h-6 w-6 text-blue-500" />
                <p className="font-medium text-sm">Insights Exclusivos</p>
                <p className="text-xs text-muted-foreground">Dicas personalizadas</p>
              </div>
            </div>

            <div className="space-y-3 pt-4">
              <Label htmlFor="partnerEmail">Email do parceiro(a)</Label>
              <div className="flex gap-2">
                <Input
                  id="partnerEmail"
                  type="email"
                  placeholder="amor@email.com"
                  value={partnerEmail}
                  onChange={(e) => setPartnerEmail(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={handleInvite} disabled={isSending || !partnerEmail} size="lg">
                  {isSending ? (
                    "Enviando..."
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Convidar
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Seu parceiro(a) receberá uma notificação para aceitar o convite
              </p>
            </div>
          </div>
        </AnimatedCard>
      </div>
    )
  }

  // Connected - show full module
  const coupleLevel = getCoupleLevel()
  const nextLevel = getNextLevel()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className={`h-16 w-16 rounded-full bg-gradient-to-br ${coupleLevel.color} p-1`}>
              <div className="h-full w-full rounded-full bg-card flex items-center justify-center">
                <Heart className="h-8 w-8 text-rose-500" />
              </div>
            </div>
            <div className="absolute -bottom-1 -right-1 bg-card rounded-full p-1">
              <Badge variant="secondary" className="text-xs px-1.5">
                Lv.{coupleLevel.level}
              </Badge>
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              {userName} & {profile.partner?.name || "Parceiro"}
              {dashboardStats?.coupleStreak && dashboardStats.coupleStreak >= 7 && (
                <Flame className="h-5 w-5 text-orange-500 animate-pulse" />
              )}
            </h1>
            <p className="text-muted-foreground flex items-center gap-2">
              <span className={`bg-gradient-to-r ${coupleLevel.color} bg-clip-text text-transparent font-medium`}>
                {coupleLevel.name}
              </span>
              <span className="text-xs">•</span>
              <span className="text-xs">{dashboardStats?.couplePoints || 0} pts</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-success/20 text-success px-3 py-1.5 rounded-full text-sm">
            <Link2 className="h-4 w-4" />
            Conectados
          </div>
        </div>
      </div>

      {/* Level Progress */}
      {nextLevel && (
        <AnimatedCard className="bg-gradient-to-r from-muted/50 to-muted/30">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-amber-500" />
              <span className="text-sm font-medium">Progresso para {nextLevel.name}</span>
            </div>
            <span className="text-xs text-muted-foreground">
              {dashboardStats?.couplePoints || 0} / {nextLevel.minPoints} pts
            </span>
          </div>
          <Progress value={getProgressToNextLevel()} className="h-2" />
        </AnimatedCard>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <TabsList className="inline-flex w-max sm:w-full sm:grid sm:grid-cols-5">
            <TabsTrigger value="overview" className="min-w-[80px]">
              <PieChart className="h-4 w-4 mr-1.5 hidden sm:inline" />
              Visão Geral
            </TabsTrigger>
            <TabsTrigger value="goals" className="min-w-[80px]">
              <Target className="h-4 w-4 mr-1.5 hidden sm:inline" />
              Metas
            </TabsTrigger>
            <TabsTrigger value="expenses" className="min-w-[80px]">
              <Wallet className="h-4 w-4 mr-1.5 hidden sm:inline" />
              Despesas
            </TabsTrigger>
            <TabsTrigger value="insights" className="min-w-[80px]">
              <Lightbulb className="h-4 w-4 mr-1.5 hidden sm:inline" />
              Insights
            </TabsTrigger>
            <TabsTrigger value="settings" className="min-w-[80px]">
              <Settings className="h-4 w-4 mr-1.5 hidden sm:inline" />
              Config
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4 mt-4">
          {/* Stats Grid */}
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            <AnimatedCard>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-500/20">
                  <Wallet className="h-6 w-6 text-rose-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Gastos do Mês</p>
                  <p className="text-lg font-bold">{formatCurrency(dashboardStats?.totalExpenses || 0)}</p>
                </div>
              </div>
            </AnimatedCard>

            <AnimatedCard>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/20">
                  <Target className="h-6 w-6 text-success" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Metas Ativas</p>
                  <p className="text-lg font-bold">{dashboardStats?.activeGoals || 0}</p>
                </div>
              </div>
            </AnimatedCard>

            <AnimatedCard>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500/20">
                  <Flame className="h-6 w-6 text-orange-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Sequência</p>
                  <p className="text-lg font-bold">{dashboardStats?.coupleStreak || 0} dias</p>
                </div>
              </div>
            </AnimatedCard>

            <AnimatedCard>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/20">
                  <Trophy className="h-6 w-6 text-amber-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Conquistas</p>
                  <p className="text-lg font-bold">{achievements.length}</p>
                </div>
              </div>
            </AnimatedCard>
          </div>

          {/* Partner Card & Last Activity */}
          <div className="grid gap-4 sm:grid-cols-2">
            <AnimatedCard>
              <div className="flex items-center gap-4">
                <Avatar className="h-14 w-14">
                  <AvatarImage src={profile.partner?.avatar || "/placeholder.svg"} />
                  <AvatarFallback className="bg-primary/20 text-primary text-lg">
                    {(profile.partner?.name || "P")[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium">{profile.partner?.name || profile.partner?.email}</p>
                  <p className="text-sm text-muted-foreground">{profile.partner?.points || 0} pontos individuais</p>
                </div>
                <Heart className="h-5 w-5 text-rose-500" />
              </div>
            </AnimatedCard>

            <AnimatedCard>
              <div className="flex items-center gap-3 mb-2">
                <History className="h-5 w-5 text-muted-foreground" />
                <p className="font-medium text-sm">Última Atividade</p>
              </div>
              {activities[0] ? (
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={activities[0].avatar_url || "/placeholder.svg"} />
                    <AvatarFallback className="text-xs">
                      {activities[0].user_name?.[0]?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{activities[0].title}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(activities[0].created_at).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhuma atividade ainda</p>
              )}
            </AnimatedCard>
          </div>

          {/* Timeline */}
          <AnimatedCard>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <History className="h-5 w-5" />
                Linha do Tempo
              </h3>
            </div>
            {activities.length > 0 ? (
              <div className="space-y-4 max-h-64 overflow-y-auto pr-2">
                {activities.slice(0, 5).map((activity) => (
                  <div key={activity.id} className="flex gap-3">
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarImage src={activity.avatar_url || "/placeholder.svg"} />
                      <AvatarFallback className="text-xs">
                        {activity.user_name?.[0]?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">
                        <span className="font-medium">{activity.user_name}</span>{" "}
                        <span className="text-muted-foreground">{activity.title.toLowerCase()}</span>
                      </p>
                      {activity.description && (
                        <p className="text-xs text-muted-foreground truncate">{activity.description}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(activity.created_at).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <History className="mx-auto h-12 w-12 mb-2 opacity-50" />
                <p>Nenhuma atividade registrada ainda</p>
                <p className="text-sm">Comece adicionando uma despesa ou meta!</p>
              </div>
            )}
          </AnimatedCard>

          {/* Achievements */}
          {achievements.length > 0 && (
            <AnimatedCard>
              <h3 className="font-semibold flex items-center gap-2 mb-4">
                <Trophy className="h-5 w-5 text-amber-500" />
                Conquistas do Casal
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {achievements.map((achievement) => (
                  <div
                    key={achievement.id}
                    className="flex items-center gap-2 p-3 rounded-lg bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/20">
                      <Trophy className="h-5 w-5 text-amber-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{achievement.name}</p>
                      <p className="text-xs text-muted-foreground">+{achievement.points} pts</p>
                    </div>
                  </div>
                ))}
              </div>
            </AnimatedCard>
          )}
        </TabsContent>

        {/* Goals Tab */}
        <TabsContent value="goals" className="space-y-4 mt-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold">Metas do Casal</h3>
            <Button onClick={() => setShowGoalDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Meta
            </Button>
          </div>

          {goals.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {goals.map((goal) => {
                const progress = goal.target_amount > 0 ? (goal.current_amount / goal.target_amount) * 100 : 0
                const isComplete = goal.status === "completed"
                const monthsToGoal =
                  goal.monthly_contribution && goal.monthly_contribution > 0
                    ? Math.ceil((goal.target_amount - goal.current_amount) / goal.monthly_contribution)
                    : null

                return (
                  <AnimatedCard key={goal.id} className={goal.is_paused ? "opacity-60" : ""}>
                    <div className="space-y-4">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <div
                            className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                              isComplete ? "bg-success/20" : "bg-primary/20"
                            }`}
                          >
                            {isComplete ? (
                              <Check className="h-5 w-5 text-success" />
                            ) : (
                              <Target className="h-5 w-5 text-primary" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium flex items-center gap-2">
                              {goal.name}
                              {goal.is_paused && (
                                <Badge variant="secondary" className="text-xs">
                                  Pausada
                                </Badge>
                              )}
                            </p>
                            <p className="text-xs text-muted-foreground capitalize">{goal.category}</p>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleTogglePauseGoal(goal)}>
                              {goal.is_paused ? (
                                <>
                                  <Play className="mr-2 h-4 w-4" />
                                  Retomar
                                </>
                              ) : (
                                <>
                                  <Pause className="mr-2 h-4 w-4" />
                                  Pausar
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteGoal(goal.id)}>
                              <Trash2 className="mr-2 h-4 w-4" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Progresso</span>
                          <span className="font-medium">{progress.toFixed(0)}%</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{formatCurrency(goal.current_amount)}</span>
                          <span>{formatCurrency(goal.target_amount)}</span>
                        </div>
                      </div>

                      {monthsToGoal !== null && !isComplete && (
                        <p className="text-xs text-muted-foreground bg-muted/50 rounded px-2 py-1">
                          Previsão: {monthsToGoal} {monthsToGoal === 1 ? "mês" : "meses"} para atingir
                        </p>
                      )}

                      {goal.target_date && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Meta para {new Date(goal.target_date).toLocaleDateString("pt-BR")}
                        </p>
                      )}

                      {!isComplete && !goal.is_paused && (
                        <Button
                          variant="outline"
                          className="w-full bg-transparent"
                          onClick={() => {
                            setSelectedGoal(goal)
                            setShowContributeDialog(true)
                          }}
                        >
                          <DollarSign className="mr-2 h-4 w-4" />
                          Contribuir
                        </Button>
                      )}

                      {goal.contributions && goal.contributions.length > 0 && (
                        <div className="pt-2 border-t">
                          <p className="text-xs font-medium mb-2">Últimas contribuições</p>
                          <div className="space-y-1.5 max-h-24 overflow-y-auto">
                            {goal.contributions.slice(0, 3).map((c) => (
                              <div key={c.id} className="flex justify-between text-xs text-muted-foreground">
                                <span>{c.user_name}</span>
                                <span className="text-success">+{formatCurrency(c.amount)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </AnimatedCard>
                )
              })}
            </div>
          ) : (
            <AnimatedCard className="text-center py-12">
              <Target className="mx-auto h-16 w-16 text-muted-foreground/50 mb-4" />
              <h3 className="font-semibold mb-2">Nenhuma meta criada</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Criem a primeira meta do casal e comecem a conquistar juntos!
              </p>
              <Button onClick={() => setShowGoalDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Criar Primeira Meta
              </Button>
            </AnimatedCard>
          )}
        </TabsContent>

        {/* Expenses Tab */}
        <TabsContent value="expenses" className="space-y-4 mt-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold">Despesas Compartilhadas</h3>
            <Button onClick={() => setShowExpenseDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Despesa
            </Button>
          </div>

          {expenses.length > 0 ? (
            <div className="space-y-3">
              {expenses.map((expense) => (
                <AnimatedCard key={expense.id}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-rose-500/20 flex items-center justify-center">
                        <Wallet className="h-5 w-5 text-rose-500" />
                      </div>
                      <div>
                        <p className="font-medium">{expense.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {expense.added_by_name} • {new Date(expense.expense_date).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <p className="font-bold text-rose-500">{formatCurrency(expense.amount)}</p>
                        <p className="text-xs text-muted-foreground capitalize">{expense.category}</p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setEditingExpense(expense)
                              setShowEditExpenseDialog(true)
                            }}
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDeleteExpense(expense.id)}
                            disabled={isDeletingExpense}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </AnimatedCard>
              ))}
            </div>
          ) : (
            <AnimatedCard className="text-center py-12">
              <Wallet className="mx-auto h-16 w-16 text-muted-foreground/50 mb-4" />
              <h3 className="font-semibold mb-2">Nenhuma despesa compartilhada</h3>
              <p className="text-sm text-muted-foreground mb-4">Registre despesas do casal para acompanhar juntos</p>
              <Button onClick={() => setShowExpenseDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Despesa
              </Button>
            </AnimatedCard>
          )}
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-4 mt-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-amber-500" />
            Insights do Casal
          </h3>

          {insights.length > 0 ? (
            <div className="space-y-3">
              {insights.map((insight, index) => (
                <AnimatedCard
                  key={index}
                  className={`border-l-4 ${
                    insight.type === "success"
                      ? "border-l-success bg-success/5"
                      : insight.type === "warning"
                        ? "border-l-warning bg-warning/5"
                        : insight.type === "motivation"
                          ? "border-l-rose-500 bg-rose-500/5"
                          : "border-l-primary bg-primary/5"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`h-10 w-10 rounded-full flex items-center justify-center ${
                        insight.type === "success"
                          ? "bg-success/20 text-success"
                          : insight.type === "warning"
                            ? "bg-warning/20 text-warning"
                            : insight.type === "motivation"
                              ? "bg-rose-500/20 text-rose-500"
                              : "bg-primary/20 text-primary"
                      }`}
                    >
                      {insight.type === "success" ? (
                        <TrendingDown className="h-5 w-5" />
                      ) : insight.type === "warning" ? (
                        <TrendingUp className="h-5 w-5" />
                      ) : insight.type === "motivation" ? (
                        <Heart className="h-5 w-5" />
                      ) : (
                        <PieChart className="h-5 w-5" />
                      )}
                    </div>
                    <p className="text-sm flex-1 pt-2">{insight.message}</p>
                  </div>
                </AnimatedCard>
              ))}
            </div>
          ) : (
            <AnimatedCard className="text-center py-12">
              <Lightbulb className="mx-auto h-16 w-16 text-muted-foreground/50 mb-4" />
              <h3 className="font-semibold mb-2">Insights em breve</h3>
              <p className="text-sm text-muted-foreground">
                Adicione mais despesas e metas para receber insights personalizados
              </p>
            </AnimatedCard>
          )}
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4 mt-4">
          <AnimatedCard>
            <div className="flex items-center gap-4 mb-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
                <Settings className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold">Configurações de Compartilhamento</h3>
                <p className="text-sm text-muted-foreground">Escolha o que deseja compartilhar</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Despesas</p>
                  <p className="text-sm text-muted-foreground">Compartilhar gastos pessoais</p>
                </div>
                <Switch
                  checked={profile.share_expenses}
                  onCheckedChange={(checked) => handleUpdateSettings({ share_expenses: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Receitas</p>
                  <p className="text-sm text-muted-foreground">Mostrar suas receitas</p>
                </div>
                <Switch
                  checked={profile.share_incomes}
                  onCheckedChange={(checked) => handleUpdateSettings({ share_incomes: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Dívidas</p>
                  <p className="text-sm text-muted-foreground">Compartilhar dívidas</p>
                </div>
                <Switch
                  checked={profile.share_debts}
                  onCheckedChange={(checked) => handleUpdateSettings({ share_debts: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Investimentos</p>
                  <p className="text-sm text-muted-foreground">Mostrar seus investimentos</p>
                </div>
                <Switch
                  checked={profile.share_investments}
                  onCheckedChange={(checked) => handleUpdateSettings({ share_investments: checked })}
                />
              </div>
            </div>
          </AnimatedCard>

          <AnimatedCard>
            <div className="flex items-center gap-4 mb-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
                <Target className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold">Permissões de Metas</h3>
                <p className="text-sm text-muted-foreground">Quem pode criar e editar metas</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Quem pode criar metas</Label>
                <Select
                  value={profile.who_can_create_goals || "both"}
                  onValueChange={(value) => handleUpdateSettings({ who_can_create_goals: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="both">Ambos</SelectItem>
                    <SelectItem value="owner">Apenas eu</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Quem pode editar metas</Label>
                <Select
                  value={profile.who_can_edit_goals || "both"}
                  onValueChange={(value) => handleUpdateSettings({ who_can_edit_goals: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="both">Ambos</SelectItem>
                    <SelectItem value="owner">Apenas eu</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </AnimatedCard>

          <AnimatedCard className="border-destructive/30">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/20">
                <Unlink className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <h3 className="font-semibold">Encerrar Conexão</h3>
                <p className="text-sm text-muted-foreground">
                  Ao encerrar a conexão, vocês não poderão mais compartilhar dados financeiros. O histórico de metas e
                  despesas compartilhadas será preservado, mas ficará congelado.
                </p>
              </div>
            </div>
            <Button variant="destructive" onClick={() => setShowEndDialog(true)}>
              <Unlink className="mr-2 h-4 w-4" />
              Encerrar Conexão
            </Button>
          </AnimatedCard>
        </TabsContent>
      </Tabs>

      {/* Create Goal Dialog */}
      <Dialog open={showGoalDialog} onOpenChange={setShowGoalDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Nova Meta do Casal</DialogTitle>
            <DialogDescription>Criem uma meta financeira para conquistar juntos</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome da Meta *</Label>
              <Input
                placeholder="Ex: Viagem para o Nordeste"
                value={newGoal.name}
                onChange={(e) => setNewGoal({ ...newGoal, name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Valor Total *</Label>
                <Input
                  type="number"
                  placeholder="5000"
                  value={newGoal.target_amount}
                  onChange={(e) => setNewGoal({ ...newGoal, target_amount: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select value={newGoal.category} onValueChange={(value) => setNewGoal({ ...newGoal, category: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {GOAL_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Data Alvo (opcional)</Label>
              <Input
                type="date"
                value={newGoal.target_date}
                onChange={(e) => setNewGoal({ ...newGoal, target_date: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Como será alimentada?</Label>
              <Select
                value={newGoal.contribution_type}
                onValueChange={(value) => setNewGoal({ ...newGoal, contribution_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Contribuição Manual</SelectItem>
                  <SelectItem value="monthly">Contribuição Mensal Fixa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {newGoal.contribution_type === "monthly" && (
              <div className="space-y-2">
                <Label>Valor Mensal</Label>
                <Input
                  type="number"
                  placeholder="500"
                  value={newGoal.monthly_contribution}
                  onChange={(e) => setNewGoal({ ...newGoal, monthly_contribution: e.target.value })}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Descrição (opcional)</Label>
              <Textarea
                placeholder="Detalhes sobre a meta..."
                value={newGoal.description}
                onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGoalDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateGoal} disabled={isCreatingGoal}>
              {isCreatingGoal ? "Criando..." : "Criar Meta"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Contribute Dialog */}
      <Dialog open={showContributeDialog} onOpenChange={setShowContributeDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Contribuir com a Meta</DialogTitle>
            <DialogDescription>
              {selectedGoal?.name} - {formatCurrency(selectedGoal?.current_amount || 0)} de{" "}
              {formatCurrency(selectedGoal?.target_amount || 0)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Valor da Contribuição *</Label>
              <Input
                type="number"
                placeholder="100"
                value={contributionAmount}
                onChange={(e) => setContributionAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Observação (opcional)</Label>
              <Input
                placeholder="Ex: Bônus do trabalho"
                value={contributionNotes}
                onChange={(e) => setContributionNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowContributeDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                if (selectedGoal && contributionAmount) {
                  handleContribute(selectedGoal.id, Number.parseFloat(contributionAmount), contributionNotes)
                }
              }}
              disabled={isContributing || !contributionAmount}
            >
              {isContributing ? "Adicionando..." : "Contribuir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Expense Dialog */}
      <Dialog open={showExpenseDialog} onOpenChange={setShowExpenseDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Nova Despesa Compartilhada</DialogTitle>
            <DialogDescription>Registre um gasto em comum do casal</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Descrição *</Label>
              <Input
                placeholder="Ex: Jantar de aniversário"
                value={newExpense.description}
                onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Valor *</Label>
                <Input
                  type="number"
                  placeholder="150"
                  value={newExpense.amount}
                  onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Data</Label>
                <Input
                  type="date"
                  value={newExpense.expense_date}
                  onChange={(e) => setNewExpense({ ...newExpense, expense_date: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select
                value={newExpense.category}
                onValueChange={(value) => setNewExpense({ ...newExpense, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="alimentacao">Alimentação</SelectItem>
                  <SelectItem value="moradia">Moradia</SelectItem>
                  <SelectItem value="transporte">Transporte</SelectItem>
                  <SelectItem value="lazer">Lazer</SelectItem>
                  <SelectItem value="saude">Saúde</SelectItem>
                  <SelectItem value="outros">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Divisão</Label>
              <Select
                value={newExpense.split_type}
                onValueChange={(value) => setNewExpense({ ...newExpense, split_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="equal">50% / 50%</SelectItem>
                  <SelectItem value="custom">Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {newExpense.split_type === "custom" && (
              <div className="space-y-2">
                <Label>Minha parte (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={newExpense.owner_percentage}
                  onChange={(e) => setNewExpense({ ...newExpense, owner_percentage: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Parceiro(a): {100 - Number(newExpense.owner_percentage)}%
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExpenseDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateExpense} disabled={isCreatingExpense}>
              {isCreatingExpense ? "Adicionando..." : "Adicionar Despesa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showEditExpenseDialog} onOpenChange={setShowEditExpenseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Despesa</DialogTitle>
            <DialogDescription>Atualize os dados da despesa compartilhada</DialogDescription>
          </DialogHeader>
          {editingExpense && (
            <div className="space-y-4">
              <div>
                <Label>Descrição</Label>
                <Input
                  value={editingExpense.description}
                  onChange={(e) => setEditingExpense({ ...editingExpense, description: e.target.value })}
                  placeholder="Ex: Conta de luz"
                />
              </div>
              <div>
                <Label>Valor (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={editingExpense.amount}
                  onChange={(e) => setEditingExpense({ ...editingExpense, amount: Number(e.target.value) })}
                  placeholder="0,00"
                />
              </div>
              <div>
                <Label>Categoria</Label>
                <Select
                  value={editingExpense.category}
                  onValueChange={(value) => setEditingExpense({ ...editingExpense, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="moradia">Moradia</SelectItem>
                    <SelectItem value="alimentação">Alimentação</SelectItem>
                    <SelectItem value="transporte">Transporte</SelectItem>
                    <SelectItem value="lazer">Lazer</SelectItem>
                    <SelectItem value="saúde">Saúde</SelectItem>
                    <SelectItem value="outros">Outros</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Data</Label>
                <Input
                  type="date"
                  value={editingExpense.expense_date?.split("T")[0] || ""}
                  onChange={(e) => setEditingExpense({ ...editingExpense, expense_date: e.target.value })}
                />
              </div>
              <div>
                <Label>Divisão</Label>
                <Select
                  value={editingExpense.split_type}
                  onValueChange={(value) => setEditingExpense({ ...editingExpense, split_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="equal">50/50</SelectItem>
                    <SelectItem value="custom">Personalizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {editingExpense.split_type === "custom" && (
                <div>
                  <Label>Sua parte (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={editingExpense.owner_percentage}
                    onChange={(e) => setEditingExpense({ ...editingExpense, owner_percentage: Number(e.target.value) })}
                  />
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditExpenseDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEditExpense}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* End Connection Dialog */}
      <AlertDialog open={showEndDialog} onOpenChange={setShowEndDialog}>
        <AlertDialogContent className="max-w-[95vw] sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Encerrar conexão?</AlertDialogTitle>
            <AlertDialogDescription>
              Ao encerrar a conexão, vocês não poderão mais compartilhar dados financeiros. O histórico de metas e
              despesas compartilhadas será preservado, mas ficará congelado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleEndConnection} className="bg-destructive text-destructive-foreground">
              Encerrar Conexão
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
