"use client"

import type React from "react"
import Link from "next/link"
import {
  ArrowRight,
  Shield,
  TrendingUp,
  PiggyBank,
  BarChart3,
  Check,
  LayoutGrid,
  Target,
  Users,
  Zap,
  ChevronDown,
  Medal,
  CreditCard,
  Smartphone,
  Globe,
  Lock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { LogoMark } from "@/components/brand/logo-mark"
import { ScrollReveal, HeroMockup, GlowCard, FloatingOrbs } from "@/components/landing/scroll-animations"

export default function LandingPage() {
  const handleSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault()
    const element = document.getElementById(targetId)
    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "start",
      })
    }
  }

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Header - Premium glass effect */}
      <header className="fixed top-0 z-50 w-full border-b border-border/30 bg-background/60 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <LogoMark size="md" />
            <span className="text-xl font-bold text-foreground">NoControle</span>
          </div>
          <nav className="hidden items-center gap-8 md:flex">
            <a
              href="#features"
              onClick={(e) => handleSmoothScroll(e, "features")}
              className="text-sm text-muted-foreground transition-all hover:text-foreground hover:scale-105 cursor-pointer"
            >
              Funcionalidades
            </a>
            <a
              href="#pricing"
              onClick={(e) => handleSmoothScroll(e, "pricing")}
              className="text-sm text-muted-foreground transition-all hover:text-foreground hover:scale-105 cursor-pointer"
            >
              Planos
            </a>
            <a
              href="#benefits"
              onClick={(e) => handleSmoothScroll(e, "benefits")}
              className="text-sm text-muted-foreground transition-all hover:text-foreground hover:scale-105 cursor-pointer"
            >
              Benefícios
            </a>
            <a
              href="#about"
              onClick={(e) => handleSmoothScroll(e, "about")}
              className="text-sm text-muted-foreground transition-all hover:text-foreground hover:scale-105 cursor-pointer"
            >
              Sobre
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="hover:bg-primary/10">
                Entrar
              </Button>
            </Link>
            <Link href="/register">
              <Button
                size="sm"
                className="gradient-primary text-primary-foreground hover:opacity-90 shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all hover:scale-105"
              >
                Começar Grátis
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section - Premium with animated mockup */}
      <section className="relative min-h-screen overflow-hidden">
        <FloatingOrbs />

        {/* Hero content */}
        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 pt-20 pb-10">
          <div className="mx-auto max-w-4xl text-center mb-8">
            <ScrollReveal delay={0}>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-sm text-primary backdrop-blur-sm">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                </span>
                Saia do vermelho de forma inteligente
              </div>
            </ScrollReveal>

            <ScrollReveal delay={100}>
              <h1 className="mb-6 text-balance text-4xl font-bold leading-tight text-foreground md:text-6xl lg:text-7xl">
                Transforme sua <span className="text-gradient">vida financeira</span> hoje
              </h1>
            </ScrollReveal>

            <ScrollReveal delay={200}>
              <p className="mx-auto mb-8 max-w-2xl text-pretty text-lg text-muted-foreground md:text-xl">
                Aplicativo completo para quitar suas dívidas, organizar suas finanças e começar a investir. Tudo em um
                só lugar, com visual premium e experiência guiada.
              </p>
            </ScrollReveal>

            <ScrollReveal delay={300}>
              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link href="/register">
                  <Button
                    size="lg"
                    className="gradient-primary text-primary-foreground hover:opacity-90 shadow-xl shadow-primary/30 hover:shadow-primary/50 transition-all hover:scale-105 group"
                  >
                    Começar Gratuitamente
                    <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}
                  className="border-border/50 hover:bg-muted/50 hover:border-primary/50 transition-all"
                >
                  Ver Funcionalidades
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={400}>
              <div className="mt-10 flex flex-wrap items-center justify-center gap-6 md:gap-10 text-sm text-muted-foreground">
                <div className="flex items-center gap-2 hover:text-foreground transition-colors">
                  <Shield className="h-4 w-4 text-primary" />
                  <span>Dados seguros</span>
                </div>
                <div className="flex items-center gap-2 hover:text-foreground transition-colors">
                  <Users className="h-4 w-4 text-primary" />
                  <span>+10 mil usuários</span>
                </div>
                <div className="flex items-center gap-2 hover:text-foreground transition-colors">
                  <PiggyBank className="h-4 w-4 text-primary" />
                  <span>R$ 50M economizados</span>
                </div>
              </div>
            </ScrollReveal>
          </div>

          {/* Animated Dashboard Mockup */}
          <ScrollReveal delay={500} direction="scale" className="w-full max-w-6xl px-4">
            <HeroMockup />
          </ScrollReveal>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-muted/30 to-transparent" />
        <div className="mx-auto max-w-7xl px-4 relative z-10">
          <ScrollReveal>
            <div className="grid gap-8 md:grid-cols-4">
              {[
                { value: "+10.000", label: "Usuários ativos", color: "text-primary" },
                { value: "R$ 50M+", label: "Economizados", color: "text-green-500" },
                { value: "4.9/5", label: "Avaliação média", color: "text-accent" },
                { value: "85%", label: "Saíram do vermelho", color: "text-orange-500" },
              ].map((stat, i) => (
                <ScrollReveal key={i} delay={i * 100}>
                  <div className="text-center p-6 rounded-2xl bg-card/50 border border-border/50 backdrop-blur-sm hover-lift">
                    <p className={`text-4xl md:text-5xl font-bold ${stat.color} mb-2`}>{stat.value}</p>
                    <p className="text-muted-foreground">{stat.label}</p>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 scroll-mt-20 relative">
        <div className="mx-auto max-w-7xl px-4">
          <ScrollReveal>
            <div className="mb-16 text-center">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm text-primary">
                <LayoutGrid className="h-4 w-4" />
                Funcionalidades
              </div>
              <h2 className="mb-4 text-3xl font-bold text-foreground md:text-5xl">
                Tudo que você precisa em um só lugar
              </h2>
              <p className="mx-auto max-w-2xl text-muted-foreground text-lg">
                Três módulos poderosos para transformar completamente sua vida financeira
              </p>
            </div>
          </ScrollReveal>

          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                icon: BarChart3,
                title: "Sair do Vermelho",
                description:
                  "Cadastre suas dívidas, veja a priorização inteligente e simule sua saída do vermelho com gráficos claros.",
                color: "danger",
                features: ["Algoritmo de priorização", "Simulação de quitação", "Alertas inteligentes"],
              },
              {
                icon: PiggyBank,
                title: "Controle Financeiro",
                description: "Registre receitas e despesas, categorize tudo e tenha visão clara do seu saldo mensal.",
                color: "primary",
                features: ["Categorias personalizadas", "Importação de extratos", "Gráficos interativos"],
              },
              {
                icon: TrendingUp,
                title: "Investimentos",
                description: "Acompanhe seus investimentos, registre aportes e veja a evolução do seu patrimônio.",
                color: "accent",
                features: ["Diversos tipos de ativos", "Evolução patrimonial", "Metas financeiras"],
              },
            ].map((module, i) => (
              <ScrollReveal key={i} delay={i * 150} direction={i === 0 ? "left" : i === 2 ? "right" : "up"}>
                <GlowCard glowColor={module.color}>
                  <div
                    className={`h-full rounded-2xl border border-${module.color}/30 bg-gradient-to-br from-${module.color}/10 via-${module.color}/5 to-transparent p-8 transition-all hover:border-${module.color}/50 hover-lift`}
                  >
                    <div className={`mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-${module.color}/20`}>
                      <module.icon className={`h-7 w-7 text-${module.color}`} />
                    </div>
                    <h3 className="mb-3 text-xl font-bold text-foreground">{module.title}</h3>
                    <p className="mb-6 text-muted-foreground">{module.description}</p>
                    <ul className="space-y-3">
                      {module.features.map((feature, j) => (
                        <li key={j} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Check className={`h-4 w-4 text-${module.color}`} />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                </GlowCard>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits/Gamification Section */}
      <section id="benefits" className="py-24 relative overflow-hidden scroll-mt-20">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-muted/20 to-transparent" />
        <div className="mx-auto max-w-7xl px-4 relative z-10">
          <ScrollReveal>
            <div className="mb-16 text-center">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm text-primary">
                <Target className="h-4 w-4" />
                Gamificação
              </div>
              <h2 className="mb-4 text-3xl font-bold text-foreground md:text-5xl">Aprenda finanças se divertindo</h2>
              <p className="mx-auto max-w-2xl text-muted-foreground text-lg">
                Complete desafios, ganhe pontos e suba de nível enquanto organiza suas finanças
              </p>
            </div>
          </ScrollReveal>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: Target,
                title: "Desafios Diários",
                description: "Complete metas e ganhe recompensas exclusivas",
                color: "orange-500",
              },
              {
                icon: Medal,
                title: "Sistema de Níveis",
                description: "Bronze, Prata, Ouro e Diamante com benefícios",
                color: "yellow-500",
              },
              {
                icon: Zap,
                title: "Sequências",
                description: "Mantenha sua streak de registros diários",
                color: "red-500",
              },
              {
                icon: Users,
                title: "Comunidade",
                description: "Compartilhe conquistas e aprenda com outros",
                color: "purple-500",
              },
            ].map((item, i) => (
              <ScrollReveal key={i} delay={i * 100}>
                <div className="rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm p-6 text-center hover-lift">
                  <div
                    className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-${item.color}/20`}
                  >
                    <item.icon className={`h-7 w-7 text-${item.color}`} />
                  </div>
                  <h3 className="font-semibold mb-2 text-lg">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 scroll-mt-20 relative">
        <div className="mx-auto max-w-7xl px-4">
          <ScrollReveal>
            <div className="mb-16 text-center">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm text-primary">
                <CreditCard className="h-4 w-4" />
                Planos
              </div>
              <h2 className="mb-4 text-3xl font-bold text-foreground md:text-5xl">Planos para todos os momentos</h2>
              <p className="mx-auto max-w-2xl text-muted-foreground text-lg">
                Comece grátis e faça upgrade quando estiver pronto para mais funcionalidades
              </p>
            </div>
          </ScrollReveal>

          <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-3">
            {/* Essential */}
            <ScrollReveal delay={0} direction="left">
              <div className="h-full rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm p-8 hover-lift">
                <h3 className="mb-2 text-lg font-semibold text-foreground">Essencial</h3>
                <p className="mb-6 text-sm text-muted-foreground">Para quem está começando</p>
                <div className="mb-6">
                  <span className="text-5xl font-bold text-foreground">Grátis</span>
                </div>
                <ul className="mb-8 space-y-4 text-sm">
                  {["1 módulo de sua escolha", "Dashboard básico", "Desafios diários", "Suporte por email"].map(
                    (item, i) => (
                      <li key={i} className="flex items-center gap-3 text-foreground">
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/20">
                          <Check className="h-3 w-3 text-primary" />
                        </div>
                        {item}
                      </li>
                    ),
                  )}
                </ul>
                <Link href="/register">
                  <Button
                    variant="outline"
                    className="w-full hover:bg-primary/10 hover:border-primary/50 transition-all bg-transparent"
                  >
                    Começar Grátis
                  </Button>
                </Link>
              </div>
            </ScrollReveal>

            {/* Complete - Popular */}
            <ScrollReveal delay={150}>
              <div className="relative h-full rounded-2xl border-2 border-primary bg-card p-8 shadow-2xl shadow-primary/20 hover-lift">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full gradient-primary px-4 py-1.5 text-xs font-medium text-primary-foreground shadow-lg">
                  Mais Popular
                </div>
                <h3 className="mb-2 text-lg font-semibold text-foreground">Completo</h3>
                <p className="mb-6 text-sm text-muted-foreground">Para organizar tudo</p>
                <div className="mb-6">
                  <span className="text-5xl font-bold text-foreground">R$ 29,90</span>
                  <span className="text-muted-foreground">/mês</span>
                </div>
                <ul className="mb-8 space-y-4 text-sm">
                  {[
                    "2 módulos de sua escolha",
                    "Dashboard completo",
                    "Importação de extratos",
                    "Score financeiro",
                    "Suporte prioritário",
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-foreground">
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/20">
                        <Check className="h-3 w-3 text-primary" />
                      </div>
                      {item}
                    </li>
                  ))}
                </ul>
                <Link href="/register">
                  <Button className="w-full gradient-primary text-primary-foreground hover:opacity-90 shadow-lg shadow-primary/25 transition-all">
                    Assinar Agora
                  </Button>
                </Link>
              </div>
            </ScrollReveal>

            {/* Total */}
            <ScrollReveal delay={300} direction="right">
              <div className="h-full rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm p-8 hover-lift">
                <h3 className="mb-2 text-lg font-semibold text-foreground">Total</h3>
                <p className="mb-6 text-sm text-muted-foreground">Acesso completo</p>
                <div className="mb-6">
                  <span className="text-5xl font-bold text-foreground">R$ 49,90</span>
                  <span className="text-muted-foreground">/mês</span>
                </div>
                <ul className="mb-8 space-y-4 text-sm">
                  {[
                    "Todos os módulos",
                    "Dashboard premium",
                    "Relatórios PDF personalizados",
                    "Alfred assistente por voz",
                    "Simulações ilimitadas",
                    "Suporte VIP",
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-foreground">
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/20">
                        <Check className="h-3 w-3 text-primary" />
                      </div>
                      {item}
                    </li>
                  ))}
                </ul>
                <Link href="/register">
                  <Button
                    variant="outline"
                    className="w-full hover:bg-primary/10 hover:border-primary/50 transition-all bg-transparent"
                  >
                    Assinar Agora
                  </Button>
                </Link>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-muted/20 to-transparent" />
        <div className="mx-auto max-w-7xl px-4 relative z-10">
          <div className="grid gap-12 md:grid-cols-2 items-center">
            <ScrollReveal direction="left">
              <div>
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm text-primary">
                  <Lock className="h-4 w-4" />
                  Segurança
                </div>
                <h2 className="mb-6 text-3xl font-bold text-foreground md:text-4xl">
                  Seus dados estão seguros conosco
                </h2>
                <p className="mb-8 text-muted-foreground text-lg">
                  Utilizamos as melhores práticas de segurança para proteger suas informações financeiras.
                </p>
                <div className="space-y-4">
                  {[
                    { icon: Shield, text: "Criptografia de ponta a ponta" },
                    { icon: Lock, text: "Autenticação em dois fatores" },
                    { icon: Globe, text: "Servidores seguros na nuvem" },
                    { icon: Smartphone, text: "Acesso seguro em qualquer dispositivo" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <item.icon className="h-5 w-5 text-primary" />
                      </div>
                      <span className="text-foreground">{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollReveal>
            <ScrollReveal direction="right">
              <div className="relative">
                <div className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-primary/20 to-accent/20 blur-2xl opacity-50" />
                <div className="relative rounded-2xl border border-border/50 bg-card/90 backdrop-blur-sm p-8">
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { value: "256-bit", label: "Criptografia" },
                      { value: "99.9%", label: "Uptime" },
                      { value: "24/7", label: "Monitoramento" },
                      { value: "LGPD", label: "Conformidade" },
                    ].map((stat, i) => (
                      <div key={i} className="text-center p-4 rounded-xl bg-muted/50">
                        <p className="text-2xl font-bold text-primary">{stat.value}</p>
                        <p className="text-sm text-muted-foreground">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="about" className="py-24 scroll-mt-20 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10" />
        </div>
        <div className="mx-auto max-w-4xl px-4 text-center relative z-10">
          <ScrollReveal>
            <h2 className="mb-6 text-3xl font-bold text-foreground md:text-5xl">
              Pronto para transformar suas finanças?
            </h2>
            <p className="mb-10 text-muted-foreground text-lg max-w-2xl mx-auto">
              Junte-se a milhares de pessoas que já estão no controle de suas finanças. Comece gratuitamente hoje.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register">
                <Button
                  size="lg"
                  className="gradient-primary text-primary-foreground hover:opacity-90 shadow-xl shadow-primary/30 hover:shadow-primary/50 transition-all hover:scale-105 group"
                >
                  Começar Gratuitamente
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link href="/login">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-border/50 hover:bg-muted/50 hover:border-primary/50 transition-all bg-transparent"
                >
                  Já tenho conta
                </Button>
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-card/50 backdrop-blur-sm py-12">
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <LogoMark size="sm" />
                <span className="text-lg font-bold text-foreground">NoControle</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Transformando vidas financeiras com tecnologia e educação.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-foreground">Produto</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#features" className="hover:text-foreground transition-colors">
                    Funcionalidades
                  </a>
                </li>
                <li>
                  <a href="#pricing" className="hover:text-foreground transition-colors">
                    Planos
                  </a>
                </li>
                <li>
                  <a href="#benefits" className="hover:text-foreground transition-colors">
                    Benefícios
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-foreground">Suporte</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Central de ajuda
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Contato
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    FAQ
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-foreground">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Termos de uso
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Privacidade
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Cookies
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-border/50 text-center text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} NoControle. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
