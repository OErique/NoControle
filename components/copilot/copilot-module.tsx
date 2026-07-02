"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Sparkles,
  Send,
  Loader2,
  Mic,
  MicOff,
  Crown,
  Trash2,
  MessageSquare,
  DollarSign,
  HelpCircle,
  Lightbulb,
  TrendingUp,
  PiggyBank,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AnimatedCard } from "@/components/ui/animated-card"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  action?: string
}

interface CopilotModuleProps {
  user: any
  data?: unknown
  hasAccess?: boolean
}

const QUICK_RESPONSES = [
  { text: "Gastei 50 reais de mercado", icon: DollarSign, color: "text-red-500" },
  { text: "Recebi 3000 de salário", icon: TrendingUp, color: "text-green-500" },
  { text: "Quanto gastei esse mês?", icon: MessageSquare, color: "text-blue-500" },
  { text: "Qual meu saldo atual?", icon: PiggyBank, color: "text-amber-500" },
  { text: "Me dá dicas pra economizar", icon: Lightbulb, color: "text-purple-500" },
  { text: "Como funciona o app?", icon: HelpCircle, color: "text-cyan-500" },
]

export function CopilotModule({ user }: CopilotModuleProps) {
  const router = useRouter()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [isLoadingHistory, setIsLoadingHistory] = useState(true)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<any>(null)

  const isVoiceAllowed = user?.plan_slug === "total"

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const res = await fetch("/api/copilot/chat")
        const data = await res.json()
        if (data.messages && data.messages.length > 0) {
          setMessages(
            data.messages.map((m: any) => ({
              id: crypto.randomUUID(),
              role: m.role,
              content: m.content,
              timestamp: new Date(m.created_at),
            })),
          )
        }
      } catch (error) {
        console.error("Error loading history:", error)
      } finally {
        setIsLoadingHistory(false)
      }
    }
    loadHistory()
  }, [])

  useEffect(() => {
    if (typeof window !== "undefined" && "webkitSpeechRecognition" in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = false
      recognitionRef.current.interimResults = false
      recognitionRef.current.lang = "pt-BR"

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        setInputValue(transcript)
        setIsListening(false)
        handleSendMessage(transcript)
      }

      recognitionRef.current.onerror = () => {
        setIsListening(false)
        toast.error("Erro ao capturar voz")
      }

      recognitionRef.current.onend = () => {
        setIsListening(false)
      }
    }
  }, [])

  const toggleListening = () => {
    if (!recognitionRef.current) {
      toast.error("Seu navegador não suporta reconhecimento de voz")
      return
    }

    if (isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    } else {
      recognitionRef.current.start()
      setIsListening(true)
    }
  }

  const handleSendMessage = async (text?: string) => {
    const messageText = text || inputValue.trim()
    if (!messageText || isProcessing) return

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: messageText,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue("")
    setIsProcessing(true)

    try {
      const res = await fetch("/api/copilot/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: messageText }),
      })

      const result = await res.json()

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: result.message || "Desculpe, não consegui processar sua mensagem.",
        timestamp: new Date(),
        action: result.action,
      }

      setMessages((prev) => [...prev, assistantMessage])

      if (result.action) {
        setTimeout(() => router.refresh(), 1500)
      }
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "Desculpe, tive um problema. Pode tentar de novo?",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsProcessing(false)
    }
  }

  const handleClearHistory = async () => {
    try {
      await fetch("/api/copilot/chat", { method: "DELETE" })
      setMessages([])
      toast.success("Histórico limpo")
    } catch {
      toast.error("Erro ao limpar histórico")
    }
  }

  const handleQuickResponse = (text: string) => {
    setInputValue(text)
    handleSendMessage(text)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center shadow-lg">
            <Sparkles className="h-6 w-6 text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              Alfred
              {isVoiceAllowed && (
                <span className="text-xs bg-amber-500/20 text-amber-500 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Crown className="h-3 w-3" />
                  Premium
                </span>
              )}
            </h1>
            <p className="text-muted-foreground text-sm">Seu assistente financeiro pessoal</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={handleClearHistory} disabled={messages.length === 0}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Cards de funcionalidades quando não há mensagens */}
      {messages.length === 0 && !isLoadingHistory && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <AnimatedCard delay={0.05} className="p-4">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <h3 className="font-medium text-sm">Registrar Gastos</h3>
                <p className="text-xs text-muted-foreground mt-1">"Gastei 50 de mercado"</p>
              </div>
            </div>
          </AnimatedCard>

          <AnimatedCard delay={0.1} className="p-4">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <MessageSquare className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <h3 className="font-medium text-sm">Consultar Finanças</h3>
                <p className="text-xs text-muted-foreground mt-1">"Quanto gastei esse mês?"</p>
              </div>
            </div>
          </AnimatedCard>

          <AnimatedCard delay={0.15} className="p-4">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <HelpCircle className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <h3 className="font-medium text-sm">Tirar Dúvidas</h3>
                <p className="text-xs text-muted-foreground mt-1">"Como funciona o app?"</p>
              </div>
            </div>
          </AnimatedCard>

          <AnimatedCard delay={0.2} className="p-4">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Lightbulb className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <h3 className="font-medium text-sm">Dicas Financeiras</h3>
                <p className="text-xs text-muted-foreground mt-1">"Me dá dicas pra economizar"</p>
              </div>
            </div>
          </AnimatedCard>
        </div>
      )}

      {/* Chat Container */}
      <AnimatedCard delay={0.25} className="overflow-hidden">
        <div className="h-[400px] overflow-y-auto p-4 space-y-4 bg-muted/20">
          {isLoadingHistory ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center mb-4 shadow-lg">
                <Sparkles className="h-10 w-10 text-amber-400" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Olá, sou o Alfred</h3>
              <p className="text-sm text-muted-foreground max-w-md mb-6">
                Seu assistente financeiro pessoal. Posso registrar gastos, consultar seu saldo, dar dicas e muito mais.
                Como posso ajudar?
              </p>
            </div>
          ) : (
            <AnimatePresence>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                >
                  <Avatar className="h-8 w-8 shrink-0">
                    {msg.role === "assistant" ? (
                      <AvatarFallback className="bg-gradient-to-br from-slate-700 to-slate-900 text-amber-400 text-xs font-bold">
                        A
                      </AvatarFallback>
                    ) : (
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                        {user?.name?.charAt(0) || "U"}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-tr-sm"
                        : "bg-card border border-border rounded-tl-sm"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    {msg.action && (
                      <span className="inline-block mt-1 text-xs bg-green-500/20 text-green-600 dark:text-green-400 px-2 py-0.5 rounded">
                        Ação executada
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}

          {isProcessing && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-gradient-to-br from-slate-700 to-slate-900 text-amber-400 text-xs font-bold">
                  A
                </AvatarFallback>
              </Avatar>
              <div className="bg-card border border-border rounded-2xl rounded-tl-sm px-4 py-3">
                <div className="flex gap-1">
                  <span
                    className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  />
                  <span
                    className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  />
                  <span
                    className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  />
                </div>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Respostas Rápidas */}
        <div className="p-3 border-t border-border bg-muted/30">
          <p className="text-xs text-muted-foreground mb-2">Respostas rápidas:</p>
          <div className="flex flex-wrap gap-2">
            {QUICK_RESPONSES.map((item, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                className="text-xs h-7 px-2 bg-transparent"
                onClick={() => handleQuickResponse(item.text)}
                disabled={isProcessing}
              >
                <item.icon className={`h-3 w-3 mr-1 ${item.color}`} />
                {item.text.length > 25 ? item.text.substring(0, 25) + "..." : item.text}
              </Button>
            ))}
          </div>
        </div>

        {/* Input */}
        <div className="p-4 border-t border-border bg-card">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSendMessage()
            }}
            className="flex gap-2"
          >
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Digite sua mensagem..."
              className="flex-1"
              disabled={isProcessing}
            />

            {/* Botão de microfone - apenas para plano Total */}
            {isVoiceAllowed && (
              <Button
                type="button"
                variant={isListening ? "default" : "outline"}
                size="icon"
                onClick={toggleListening}
                disabled={isProcessing}
                className={isListening ? "bg-red-500 hover:bg-red-600 animate-pulse" : ""}
              >
                {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>
            )}

            <Button type="submit" size="icon" disabled={isProcessing || !inputValue.trim()}>
              {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
        </div>
      </AnimatedCard>

      {/* Cards de exemplo na parte inferior */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <AnimatedCard delay={0.3} className="p-4">
          <h3 className="font-medium text-sm mb-3 flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-red-500" />
            Registrar Despesas
          </h3>
          <div className="space-y-2 text-xs text-muted-foreground">
            <p>"Gastei 150 reais de supermercado"</p>
            <p>"Paguei 80 de luz"</p>
            <p>"Lancei 45 de Uber no Nubank"</p>
          </div>
        </AnimatedCard>

        <AnimatedCard delay={0.35} className="p-4">
          <h3 className="font-medium text-sm mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-green-500" />
            Registrar Receitas
          </h3>
          <div className="space-y-2 text-xs text-muted-foreground">
            <p>"Recebi 5000 de salário"</p>
            <p>"Ganhei 200 de freelance"</p>
            <p>"Entrou 150 de dividendos"</p>
          </div>
        </AnimatedCard>

        <AnimatedCard delay={0.4} className="p-4">
          <h3 className="font-medium text-sm mb-3 flex items-center gap-2">
            <HelpCircle className="h-4 w-4 text-blue-500" />
            Perguntas Úteis
          </h3>
          <div className="space-y-2 text-xs text-muted-foreground">
            <p>"Qual meu patrimônio líquido?"</p>
            <p>"Qual meu maior gasto do mês?"</p>
            <p>"Quanto tenho em investimentos?"</p>
          </div>
        </AnimatedCard>
      </div>
    </div>
  )
}
