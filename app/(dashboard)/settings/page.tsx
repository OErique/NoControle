"use client"

import { useState, useEffect } from "react"
import { User, Lock, Bell, CreditCard, Trash2, LogOut, Moon, Sun, Monitor, Check, Gamepad2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { AnimatedCard } from "@/components/ui/animated-card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { toast } from "sonner"

interface UserData {
  id: string
  name: string | null
  email: string
  plan_name: string
  plan_slug: string
  plan_price: number
  gambling_enabled?: boolean
}

const planFeatures: Record<string, string[]> = {
  essencial: ["Controle de despesas e receitas", "Gestao de dividas", "Dashboard basico", "Desafios limitados"],
  plus: [
    "Tudo do Essencial",
    "Score financeiro",
    "Importacao de extratos",
    "Desafios ilimitados",
    "Relatorios mensais",
  ],
  total: [
    "Tudo do Plus",
    "Copiloto IA",
    "Investimentos",
    "Analise avancada",
    "Suporte prioritario",
    "Perfil verificado",
  ],
}

export default function SettingsPage() {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [user, setUser] = useState<UserData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState("profile")

  // Form states
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  // Notification settings
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [dueDateReminders, setDueDateReminders] = useState(true)
  const [weeklyReports, setWeeklyReports] = useState(false)

  const [gamblingEnabled, setGamblingEnabled] = useState(false)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/auth/me")
        if (res.ok) {
          const data = await res.json()
          setUser(data.user)
          setName(data.user.name || "")
          setEmail(data.user.email)
          setGamblingEnabled(data.user.gambling_enabled || false)
        }
      } catch (error) {
        console.error("Error fetching user:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUser()
  }, [])

  const handleSaveProfile = async () => {
    setIsSaving(true)
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      })

      if (res.ok) {
        const data = await res.json()
        setUser((prev) => (prev ? { ...prev, name: data.user.name } : null))
        toast.success("Perfil atualizado!")
      }
    } catch (error) {
      console.error("Error saving profile:", error)
      toast.error("Erro ao salvar perfil")
    } finally {
      setIsSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error("As senhas nao coincidem")
      return
    }

    setIsSaving(true)
    try {
      const res = await fetch("/api/user/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      })

      if (res.ok) {
        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")
        toast.success("Senha alterada com sucesso!")
      } else {
        const data = await res.json()
        toast.error(data.error || "Erro ao alterar senha")
      }
    } catch (error) {
      console.error("Error changing password:", error)
      toast.error("Erro ao alterar senha")
    } finally {
      setIsSaving(false)
    }
  }

  const handleThemeChange = async (newTheme: string) => {
    setTheme(newTheme)
    try {
      await fetch("/api/theme", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme: newTheme }),
      })
    } catch (error) {
      console.error("Error saving theme:", error)
    }
  }

  const handleGamblingToggle = async (enabled: boolean) => {
    try {
      const res = await fetch("/api/gambling/enable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      })

      if (res.ok) {
        setGamblingEnabled(enabled)
        toast.success(enabled ? "Módulo de apostas ativado" : "Módulo de apostas desativado")
      }
    } catch (error) {
      toast.error("Erro ao alterar configuração")
    }
  }

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/login")
  }

  const handleDeleteAccount = async () => {
    try {
      const res = await fetch("/api/user/delete", { method: "DELETE" })
      if (res.ok) {
        router.push("/")
      }
    } catch (error) {
      console.error("Error deleting account:", error)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  const formatPrice = (price: number | undefined) => {
    if (price === undefined || price === null) return "Gratuito"
    if (price === 0) return "Gratuito"
    return `R$ ${price.toFixed(2).replace(".", ",")}/mês`
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Configurações</h1>
        <p className="text-muted-foreground">Gerencie sua conta e preferências</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
          <TabsList className="inline-flex w-max sm:w-full sm:grid sm:grid-cols-6 min-w-full">
            <TabsTrigger value="profile" className="min-w-[80px]">
              Perfil
            </TabsTrigger>
            <TabsTrigger value="theme" className="min-w-[80px]">
              Tema
            </TabsTrigger>
            <TabsTrigger value="modules" className="min-w-[80px]">
              Módulos
            </TabsTrigger>
            <TabsTrigger value="security" className="min-w-[80px]">
              Segurança
            </TabsTrigger>
            <TabsTrigger value="notifications" className="min-w-[80px]">
              Alertas
            </TabsTrigger>
            <TabsTrigger value="billing" className="min-w-[100px]">
              Assinatura
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="profile" className="mt-4">
          <AnimatedCard>
            <div className="p-4 sm:p-6 space-y-6">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/20 text-primary">
                  <User className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="font-semibold">{user?.name || "Usuario"}</h3>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" value={email} disabled className="bg-muted" />
                  <p className="text-xs text-muted-foreground">O email não pode ser alterado por segurança</p>
                </div>
              </div>

              <Button onClick={handleSaveProfile} disabled={isSaving}>
                {isSaving ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </div>
          </AnimatedCard>
        </TabsContent>

        <TabsContent value="theme" className="mt-4">
          <AnimatedCard>
            <div className="p-4 sm:p-6 space-y-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/20 text-accent">
                  <Moon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold">Aparência</h3>
                  <p className="text-sm text-muted-foreground">Personalize a aparência do app</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 sm:gap-4">
                <button
                  onClick={() => handleThemeChange("light")}
                  className={`flex flex-col items-center gap-2 p-3 sm:p-4 rounded-lg border-2 transition-colors ${
                    theme === "light" ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
                  }`}
                >
                  <Sun className="h-6 w-6 sm:h-8 sm:w-8" />
                  <span className="text-xs sm:text-sm font-medium">Claro</span>
                  {theme === "light" && <Check className="h-4 w-4 text-primary" />}
                </button>

                <button
                  onClick={() => handleThemeChange("dark")}
                  className={`flex flex-col items-center gap-2 p-3 sm:p-4 rounded-lg border-2 transition-colors ${
                    theme === "dark" ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
                  }`}
                >
                  <Moon className="h-6 w-6 sm:h-8 sm:w-8" />
                  <span className="text-xs sm:text-sm font-medium">Escuro</span>
                  {theme === "dark" && <Check className="h-4 w-4 text-primary" />}
                </button>

                <button
                  onClick={() => handleThemeChange("system")}
                  className={`flex flex-col items-center gap-2 p-3 sm:p-4 rounded-lg border-2 transition-colors ${
                    theme === "system" ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
                  }`}
                >
                  <Monitor className="h-6 w-6 sm:h-8 sm:w-8" />
                  <span className="text-xs sm:text-sm font-medium">Sistema</span>
                  {theme === "system" && <Check className="h-4 w-4 text-primary" />}
                </button>
              </div>
            </div>
          </AnimatedCard>
        </TabsContent>

        <TabsContent value="modules" className="mt-4">
          <AnimatedCard>
            <div className="p-4 sm:p-6 space-y-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-warning/20 text-warning">
                  <Gamepad2 className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold">Módulos Opcionais</h3>
                  <p className="text-sm text-muted-foreground">Ative ou desative módulos do app</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4 p-4 rounded-lg border border-border">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">Controle de Apostas</p>
                    <p className="text-sm text-muted-foreground">
                      Registre e acompanhe seus gastos com apostas de forma consciente
                    </p>
                  </div>
                  <Switch checked={gamblingEnabled} onCheckedChange={handleGamblingToggle} />
                </div>

                {gamblingEnabled && (
                  <div className="bg-warning/10 border border-warning/30 rounded-lg p-4">
                    <p className="text-sm text-warning font-medium">Aviso Importante</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Jogos de azar podem causar dependência. Este módulo é apenas para controle pessoal, não um
                      incentivo a apostar.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </AnimatedCard>
        </TabsContent>

        <TabsContent value="security" className="mt-4 space-y-4">
          <AnimatedCard>
            <div className="p-4 sm:p-6 space-y-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-warning/20 text-warning">
                  <Lock className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold">Alterar Senha</h3>
                  <p className="text-sm text-muted-foreground">Mantenha sua conta segura</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Senha Atual</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">Nova Senha</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>

              <Button onClick={handleChangePassword} disabled={isSaving}>
                {isSaving ? "Alterando..." : "Alterar Senha"}
              </Button>
            </div>
          </AnimatedCard>

          <AnimatedCard delay={0.1}>
            <div className="p-4 sm:p-6 space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-danger/20 text-danger">
                  <Trash2 className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold">Zona de Perigo</h3>
                  <p className="text-sm text-muted-foreground">Ações irreversíveis</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button variant="outline" onClick={handleLogout} className="gap-2 bg-transparent">
                  <LogOut className="h-4 w-4" />
                  Sair da Conta
                </Button>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="gap-2">
                      <Trash2 className="h-4 w-4" />
                      Excluir Conta
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="max-w-[90vw] sm:max-w-lg">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Tem certeza absoluta?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta ação não pode ser desfeita. Isso irá excluir permanentemente sua conta e remover todos os
                        seus dados dos nossos servidores.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                      <AlertDialogCancel className="w-full sm:w-auto">Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteAccount} className="bg-danger w-full sm:w-auto">
                        Sim, excluir minha conta
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </AnimatedCard>
        </TabsContent>

        <TabsContent value="notifications" className="mt-4">
          <AnimatedCard>
            <div className="p-4 sm:p-6 space-y-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/20 text-accent">
                  <Bell className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold">Preferências de Notificação</h3>
                  <p className="text-sm text-muted-foreground">Escolha como quer ser notificado</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">Notificações por Email</p>
                    <p className="text-sm text-muted-foreground truncate">Receba atualizações importantes</p>
                  </div>
                  <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
                </div>

                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">Lembretes de Vencimento</p>
                    <p className="text-sm text-muted-foreground truncate">Dívidas prestes a vencer</p>
                  </div>
                  <Switch checked={dueDateReminders} onCheckedChange={setDueDateReminders} />
                </div>

                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">Relatórios Semanais</p>
                    <p className="text-sm text-muted-foreground truncate">Resumo das finanças</p>
                  </div>
                  <Switch checked={weeklyReports} onCheckedChange={setWeeklyReports} />
                </div>
              </div>

              <Button>Salvar Preferências</Button>
            </div>
          </AnimatedCard>
        </TabsContent>

        <TabsContent value="billing" className="mt-4">
          <AnimatedCard>
            <div className="p-4 sm:p-6 space-y-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20 text-primary">
                  <CreditCard className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold">Sua Assinatura</h3>
                  <p className="text-sm text-muted-foreground">Gerencie seu plano</p>
                </div>
              </div>

              <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                  <div>
                    <p className="font-semibold text-lg">{user?.plan_name || "Essencial"}</p>
                    <p className="text-sm text-muted-foreground">{formatPrice(user?.plan_price)}</p>
                  </div>
                  <Button onClick={() => router.push("/upgrade")} className="w-full sm:w-auto">
                    {user?.plan_slug === "total" ? "Gerenciar" : "Fazer Upgrade"}
                  </Button>
                </div>

                {/* Plan features */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Benefícios inclusos:</p>
                  <ul className="space-y-1">
                    {(planFeatures[user?.plan_slug || "essencial"] || planFeatures.essencial).map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-primary flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </AnimatedCard>
        </TabsContent>
      </Tabs>
    </div>
  )
}
