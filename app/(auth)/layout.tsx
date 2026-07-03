import type React from "react"
import Link from "next/link"
import { LogoMark } from "@/components/brand/logo-mark"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 lg:flex-col lg:justify-between bg-gradient-to-br from-primary/20 via-background to-accent/20 p-12">
        <Link href="/" className="flex items-center gap-2">
          <LogoMark size="lg" />
          <span className="text-2xl font-bold text-foreground">NoControle</span>
        </Link>

        <div className="space-y-6">
          <h1 className="text-4xl font-bold leading-tight text-foreground">
            Transforme sua vida financeira em poucos passos
          </h1>
          <p className="text-lg text-muted-foreground">
            Junte-se a milhares de pessoas que já saíram do vermelho e estão construindo um futuro financeiro sólido.
          </p>
          <div className="flex items-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-success" />
              +10 mil usuários
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-success" />
              R$ 50M economizados
            </div>
          </div>
        </div>

        <p className="text-sm text-muted-foreground">© 2026 NoControle. Todos os direitos reservados.</p>
      </div>

      {/* Right side - Form */}
      <div className="flex w-full items-center justify-center p-8 lg:w-1/2">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  )
}
