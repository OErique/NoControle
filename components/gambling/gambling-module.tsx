"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
  AlertTriangle,
  Plus,
  TrendingDown,
  TrendingUp,
  Calendar,
  DollarSign,
  BarChart3,
  Settings,
  Info,
  EyeOff,
  Trash2,
  MoreVertical,
  Lock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { AnimatedCard } from "@/components/ui/animated-card"
import { StatCard } from "@/components/ui/stat-card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { toast } from "sonner"
import { formatCurrency } from "@/lib/utils"
import { AddBetDialog } from "./add-bet-dialog"
import { GamblingChart } from "./gambling-chart"
import { GamblingInsights } from "./gambling-insights"

interface GamblingModuleProps {
  userId: string
  gamblingEnabled: boolean
}

interface Bet {
  id: string
  bet_date: string
  amount_bet: number
  amount_won: number
  platform: string | null
  notes: string | null
}

interface Stats {
  totalBet: number
  totalWon: number
  totalLost: number
  netResult: number
  betCount: number
  monthlyData: Array<{
    month: string
    bet: number
    won: number
    lost: number
    net: number
  }>
}

export function GamblingModule({ userId, gamblingEnabled: initialEnabled }: GamblingModuleProps) {
  const [isEnabled, setIsEnabled] = useState(initialEnabled)
  const [showEnableDialog, setShowEnableDialog] = useState(false)
  const [showDisableDialog, setShowDisableDialog] = useState(false)
  const [showSettingsDialog, setShowSettingsDialog] = useState(false)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [bets, setBets] = useState<Bet[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [monthlyLimit, setMonthlyLimit] = useState(500)
  const [tempLimit, setTempLimit] = useState(500)
  const [betToDelete, setBetToDelete] = useState<Bet | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (isEnabled) {
      fetchData()
    } else {
      setIsLoading(false)
    }
  }, [isEnabled])

  const fetchData = async () => {
    try {
      const [betsRes, statsRes] = await Promise.all([fetch("/api/gambling/bets"), fetch("/api/gambling/stats")])

      if (betsRes.ok) {
        const data = await betsRes.json()
        setBets(data.bets || [])
      }

      if (statsRes.ok) {
        const data = await statsRes.json()
        setStats(data)
        setMonthlyLimit(data.monthlyLimit || 500)
        setTempLimit(data.monthlyLimit || 500)
      }
    } catch (error) {
      console.error("Error fetching gambling data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleEnableModule = async () => {
    try {
      const res = await fetch("/api/gambling/enable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: true }),
      })

      if (res.ok) {
        setIsEnabled(true)
        setShowEnableDialog(false)
        toast.success("Módulo ativado com sucesso")
        fetchData()
      }
    } catch (error) {
      toast.error("Erro ao ativar módulo")
    }
  }

  const handleDisableModule = async () => {
    try {
      const res = await fetch("/api/gambling/enable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: false }),
      })

      if (res.ok) {
        setIsEnabled(false)
        setShowDisableDialog(false)
        toast.success("Módulo desativado")
      }
    } catch (error) {
      toast.error("Erro ao desativar módulo")
    }
  }

  const handleSaveSettings = async () => {
    try {
      const res = await fetch("/api/gambling/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ monthlyLimit: tempLimit }),
      })

      if (res.ok) {
        setMonthlyLimit(tempLimit)
        setShowSettingsDialog(false)
        toast.success("Configurações salvas")
      }
    } catch (error) {
      toast.error("Erro ao salvar configurações")
    }
  }

  const handleAddBet = async (bet: {
    bet_date: string
    amount_bet: number
    amount_won: number
    platform: string
    notes: string
  }) => {
    try {
      const res = await fetch("/api/gambling/bets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bet),
      })

      if (res.ok) {
        toast.success("Aposta registrada")
        fetchData()
        setShowAddDialog(false)
      }
    } catch (error) {
      toast.error("Erro ao registrar aposta")
    }
  }

  const handleDeleteBet = async () => {
    if (!betToDelete) return

    setIsDeleting(true)
    try {
      const res = await fetch(`/api/gambling/bets/${betToDelete.id}`, {
        method: "DELETE",
      })

      if (res.ok) {
        toast.success("Aposta excluída com sucesso")
        setBets((prev) => prev.filter((b) => b.id !== betToDelete.id))
        fetchData()
      } else {
        const data = await res.json()
        toast.error(data.error || "Erro ao excluir aposta")
      }
    } catch (error) {
      toast.error("Erro ao excluir aposta")
    } finally {
      setIsDeleting(false)
      setBetToDelete(null)
    }
  }

  if (!isEnabled) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Controle de Apostas</h1>
          <p className="text-muted-foreground">Monitore seus gastos com jogos de forma consciente</p>
        </div>

        <AnimatedCard className="text-center py-12 relative overflow-hidden">
          {/* Locked overlay effect */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-muted/20 pointer-events-none" />

          <div className="max-w-md mx-auto space-y-6 relative">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-muted/50 border-2 border-dashed border-muted-foreground/30"
            >
              <Lock className="h-12 w-12 text-muted-foreground" />
            </motion.div>
            <div className="space-y-2">
              <h2 className="text-xl font-semibold">Módulo Bloqueado</h2>
              <p className="text-muted-foreground">
                Este módulo é opcional e focado em <strong>controle e conscientização</strong>, não em incentivo a
                apostas.
              </p>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 text-left space-y-3">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-foreground">O que este módulo oferece:</p>
                  <ul className="mt-2 space-y-1 text-muted-foreground">
                    <li>• Registro de apostas (ganhos e perdas)</li>
                    <li>• Cálculo automático do saldo líquido</li>
                    <li>• Gráficos de evolução mensal</li>
                    <li>• Alertas de limite mensal</li>
                    <li>• Insights sobre seus hábitos</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-warning/10 border border-warning/30 rounded-lg p-4 text-left">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-warning mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-warning">Aviso Importante</p>
                  <p className="text-muted-foreground mt-1">
                    Jogos de azar podem causar dependência. Se você sente que está perdendo o controle, procure ajuda
                    profissional. Este módulo é uma ferramenta de autoconhecimento, não um incentivo a apostar.
                  </p>
                </div>
              </div>
            </div>

            <Button onClick={() => setShowEnableDialog(true)} variant="outline" className="w-full gap-2">
              <Lock className="h-4 w-4" />
              Desbloquear Módulo
            </Button>
          </div>
        </AnimatedCard>

        <AlertDialog open={showEnableDialog} onOpenChange={setShowEnableDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-warning" />
                Confirmar Ativação
              </AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="space-y-3">
                  <p>Ao ativar este módulo, você concorda que:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Usará esta ferramenta para controle pessoal</li>
                    <li>Entende que apostas podem causar prejuízos</li>
                    <li>Buscará ajuda se sentir que está perdendo o controle</li>
                  </ul>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleEnableModule}>Entendi, ativar módulo</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  const currentMonthSpent = stats?.monthlyData[stats.monthlyData.length - 1]?.lost || 0
  const limitPercentage = (currentMonthSpent / monthlyLimit) * 100
  const isOverLimit = limitPercentage >= 100
  const isNearLimit = limitPercentage >= 80

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Controle de Apostas</h1>
          <p className="text-muted-foreground">Monitore seus gastos com jogos de forma consciente</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowSettingsDialog(true)}>
            <Settings className="mr-2 h-4 w-4" />
            Configurar
          </Button>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Registrar Aposta
          </Button>
        </div>
      </div>

      {(isOverLimit || isNearLimit) && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-lg border ${
            isOverLimit ? "bg-danger/10 border-danger/30" : "bg-warning/10 border-warning/30"
          }`}
        >
          <div className="flex items-center gap-3">
            <AlertTriangle className={`h-5 w-5 ${isOverLimit ? "text-danger" : "text-warning"}`} />
            <div>
              <p className={`font-medium ${isOverLimit ? "text-danger" : "text-warning"}`}>
                {isOverLimit ? "Limite mensal ultrapassado!" : "Atenção: próximo do limite"}
              </p>
              <p className="text-sm text-muted-foreground">
                Você já gastou {formatCurrency(currentMonthSpent)} de {formatCurrency(monthlyLimit)} este mês (
                {limitPercentage.toFixed(0)}%)
              </p>
            </div>
          </div>
        </motion.div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Apostado" value={stats?.totalBet || 0} icon={DollarSign} color="default" />
        <StatCard title="Total Ganho" value={stats?.totalWon || 0} icon={TrendingUp} color="success" />
        <StatCard title="Total Perdido" value={stats?.totalLost || 0} icon={TrendingDown} color="danger" />
        <StatCard
          title="Saldo Líquido"
          value={stats?.netResult || 0}
          icon={BarChart3}
          color={(stats?.netResult || 0) >= 0 ? "success" : "danger"}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <GamblingChart data={stats?.monthlyData || []} />
        <GamblingInsights stats={stats} monthlyLimit={monthlyLimit} currentMonthSpent={currentMonthSpent} />
      </div>

      <AnimatedCard>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Últimas Apostas</h3>
          <span className="text-sm text-muted-foreground">{bets.length} registros</span>
        </div>

        {bets.length > 0 ? (
          <div className="space-y-3">
            {bets.slice(0, 10).map((bet) => {
              const result = bet.amount_won - bet.amount_bet
              const isWin = result > 0

              return (
                <div
                  key={bet.id}
                  className="flex items-center justify-between py-2 border-b border-border last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                        isWin ? "bg-success/20" : "bg-danger/20"
                      }`}
                    >
                      {isWin ? (
                        <TrendingUp className="h-5 w-5 text-success" />
                      ) : (
                        <TrendingDown className="h-5 w-5 text-danger" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{bet.platform || "Aposta"}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {new Date(bet.bet_date).toLocaleDateString("pt-BR")}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <p className={`font-semibold ${isWin ? "text-success" : "text-danger"}`}>
                        {isWin ? "+" : ""}
                        {formatCurrency(result)}
                      </p>
                      <p className="text-xs text-muted-foreground">Apostado: {formatCurrency(bet.amount_bet)}</p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="text-danger focus:text-danger" onClick={() => setBetToDelete(bet)}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground/50 mb-2" />
            <p className="text-muted-foreground">Nenhuma aposta registrada</p>
            <Button variant="link" onClick={() => setShowAddDialog(true)} className="mt-2">
              Registrar primeira aposta
            </Button>
          </div>
        )}
      </AnimatedCard>

      <AddBetDialog open={showAddDialog} onOpenChange={setShowAddDialog} onSubmit={handleAddBet} />

      <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configurações de Apostas
            </DialogTitle>
            <DialogDescription>Ajuste seu limite mensal e outras preferências</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="monthlyLimit">Limite Mensal de Perdas</Label>
              <Input
                id="monthlyLimit"
                type="number"
                value={tempLimit}
                onChange={(e) => setTempLimit(Number(e.target.value))}
                min={0}
              />
              <p className="text-xs text-muted-foreground">
                Você receberá alertas quando estiver próximo ou ultrapassar este limite
              </p>
            </div>

            <div className="pt-4 border-t">
              <Button
                variant="outline"
                className="w-full text-warning border-warning/30 hover:bg-warning/10 bg-transparent"
                onClick={() => {
                  setShowSettingsDialog(false)
                  setShowDisableDialog(true)
                }}
              >
                <EyeOff className="mr-2 h-4 w-4" />
                Desativar Módulo de Apostas
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSettingsDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveSettings}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDisableDialog} onOpenChange={setShowDisableDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desativar Módulo?</AlertDialogTitle>
            <AlertDialogDescription>
              Ao desativar, o módulo ficará bloqueado novamente. Seus dados serão mantidos e você poderá reativá-lo
              quando quiser.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDisableModule}>Desativar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!betToDelete} onOpenChange={(open) => !open && setBetToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Aposta?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta aposta de{" "}
              <strong>{betToDelete && formatCurrency(betToDelete.amount_bet)}</strong>? Esta ação não pode ser desfeita
              e os gráficos serão atualizados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteBet} disabled={isDeleting} className="bg-danger hover:bg-danger/90">
              {isDeleting ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
