"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Loader2, TrendingUp, Check, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { toast } from "sonner"

export default function RegisterPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  })

  const passwordRequirements = [
    { label: "Pelo menos 8 caracteres", met: formData.password.length >= 8 },
    { label: "Letra maiúscula", met: /[A-Z]/.test(formData.password) },
    { label: "Letra minúscula", met: /[a-z]/.test(formData.password) },
    { label: "Um número", met: /\d/.test(formData.password) },
  ]

  const allRequirementsMet = passwordRequirements.every((req) => req.met)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!allRequirementsMet) {
      toast.error("A senha não atende aos requisitos mínimos")
      return
    }

    if (!termsAccepted) {
      toast.error("Você precisa aceitar os Termos de Uso para continuar")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, termsAccepted: true }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erro ao criar conta")
      }

      toast.success("Conta criada com sucesso!")
      router.push("/onboarding")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao criar conta")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Mobile logo */}
      <div className="flex items-center justify-center gap-2 lg:hidden">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary">
          <TrendingUp className="h-6 w-6 text-primary-foreground" />
        </div>
        <span className="text-2xl font-bold text-foreground">NoControle</span>
      </div>

      <div className="space-y-2 text-center lg:text-left">
        <h2 className="text-3xl font-bold text-foreground">Criar sua conta</h2>
        <p className="text-muted-foreground">Comece sua jornada financeira agora</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="name">Nome completo</Label>
          <Input
            id="name"
            type="text"
            placeholder="Seu nome"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            className="h-12 bg-muted/50"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            type="email"
            placeholder="seu@email.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            className="h-12 bg-muted/50"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Senha</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              className="h-12 bg-muted/50 pr-12"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>

          {/* Password requirements */}
          <div className="mt-3 space-y-2">
            {passwordRequirements.map((req, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <div
                  className={`flex h-4 w-4 items-center justify-center rounded-full ${
                    req.met ? "bg-success text-success-foreground" : "bg-muted"
                  }`}
                >
                  {req.met && <Check className="h-3 w-3" />}
                </div>
                <span className={req.met ? "text-success" : "text-muted-foreground"}>{req.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-start gap-3 p-4 rounded-lg border border-border bg-muted/30">
            <Checkbox
              id="terms"
              checked={termsAccepted}
              onCheckedChange={(checked) => setTermsAccepted(checked === true)}
              className="mt-0.5"
            />
            <div className="space-y-1 flex-1">
              <Label htmlFor="terms" className="text-sm font-medium cursor-pointer leading-relaxed">
                Li e aceito os{" "}
                <Dialog>
                  <DialogTrigger asChild>
                    <button type="button" className="text-primary hover:underline inline-flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      Termos de Uso
                    </button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        Termos de Uso
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 text-sm text-muted-foreground">
                      <p className="font-medium text-foreground">
                        Ao utilizar este aplicativo, declaro que estou ciente de que:
                      </p>
                      <ul className="space-y-3">
                        <li className="flex items-start gap-2">
                          <span className="text-primary mt-1">•</span>
                          <span>
                            Este aplicativo possui finalidade exclusivamente{" "}
                            <strong className="text-foreground">
                              informativa, educacional e de organização financeira
                            </strong>
                            .
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-primary mt-1">•</span>
                          <span>
                            Todas as decisões financeiras tomadas com base nos dados registrados são de{" "}
                            <strong className="text-foreground">minha inteira responsabilidade</strong>.
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-primary mt-1">•</span>
                          <span>
                            O aplicativo <strong className="text-foreground">não se responsabiliza</strong> por perdas,
                            ganhos, prejuízos, dívidas ou decisões financeiras do usuário.
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-primary mt-1">•</span>
                          <span>
                            Estou utilizando a versão gratuita e{" "}
                            <strong className="text-foreground">compreendo suas limitações</strong>.
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-primary mt-1">•</span>
                          <span>
                            O uso do app{" "}
                            <strong className="text-foreground">não substitui orientação profissional</strong>{" "}
                            financeira, contábil ou jurídica.
                          </span>
                        </li>
                      </ul>
                      <div className="pt-4 border-t border-border">
                        <p className="text-xs">
                          Ao criar sua conta, você concorda com estes termos e com nossa{" "}
                          <Link href="/privacy" className="text-primary hover:underline">
                            Política de Privacidade
                          </Link>
                          .
                        </p>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </Label>
              <p className="text-xs text-muted-foreground">Obrigatório para criar sua conta</p>
            </div>
          </div>
          {!termsAccepted && formData.email && formData.password && allRequirementsMet && (
            <p className="text-xs text-warning flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-warning" />
              Aceite os termos para continuar
            </p>
          )}
        </div>

        <Button
          type="submit"
          className="h-12 w-full gradient-primary text-primary-foreground"
          disabled={isLoading || !allRequirementsMet || !termsAccepted}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Criando conta...
            </>
          ) : (
            "Criar conta grátis"
          )}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Já tem uma conta?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Fazer login
        </Link>
      </p>
    </div>
  )
}
