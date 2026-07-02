"use client"

import { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import {
  Crown,
  DollarSign,
  HelpCircle,
  Lightbulb,
  Loader2,
  MessageSquare,
  Mic,
  MicOff,
  PiggyBank,
  Send,
  Sparkles,
  Trash2,
  TrendingUp,
  Volume2,
  WalletCards,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AnimatedCard } from "@/components/ui/animated-card"

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

type SendOptions = {
  autoSpeak?: boolean
  resumeListening?: boolean
  source?: "text" | "voice"
}

const QUICK_RESPONSES = [
  { text: "Gastei 50 reais de mercado", icon: DollarSign, color: "text-red-500" },
  { text: "Recebi 3000 de salario", icon: TrendingUp, color: "text-green-500" },
  { text: "Quanto gastei esse mes?", icon: MessageSquare, color: "text-blue-500" },
  { text: "Qual meu saldo atual?", icon: PiggyBank, color: "text-amber-500" },
  { text: "Me da dicas pra economizar", icon: Lightbulb, color: "text-purple-500" },
  { text: "Como funciona o app?", icon: HelpCircle, color: "text-cyan-500" },
]

const WAVE_BARS = Array.from({ length: 56 }, (_, index) => {
  const intensity = 0.45 + Math.sin(index * 0.72) * 0.25 + Math.cos(index * 0.31) * 0.2
  return {
    angle: (360 / 56) * index,
    height: Math.max(9, Math.round(18 + intensity * 22)),
    delay: index * 0.018,
  }
})

export function CopilotModule({ user }: CopilotModuleProps) {
  const router = useRouter()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState("")
  const [liveTranscript, setLiveTranscript] = useState("")
  const [voiceStatus, setVoiceStatus] = useState("Pronto para conversar")
  const [isProcessing, setIsProcessing] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isVoiceModeActive, setIsVoiceModeActive] = useState(false)
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null)
  const [isSpeechConfigured, setIsSpeechConfigured] = useState(false)
  const [isLoadingHistory, setIsLoadingHistory] = useState(true)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<any>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const isProcessingRef = useRef(false)
  const isSpeakingRef = useRef(false)
  const isVoiceModeActiveRef = useRef(false)
  const isSpeechConfiguredRef = useRef(false)

  const isPremiumPlan = user?.plan_slug === "total"

  useEffect(() => {
    isProcessingRef.current = isProcessing
  }, [isProcessing])

  useEffect(() => {
    isSpeakingRef.current = isSpeaking
  }, [isSpeaking])

  useEffect(() => {
    isVoiceModeActiveRef.current = isVoiceModeActive
  }, [isVoiceModeActive])

  useEffect(() => {
    isSpeechConfiguredRef.current = isSpeechConfigured
  }, [isSpeechConfigured])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    const loadSpeechStatus = async () => {
      try {
        const res = await fetch("/api/copilot/speak")
        const data = await res.json()
        setIsSpeechConfigured(Boolean(data.configured))
      } catch {
        setIsSpeechConfigured(false)
      }
    }

    loadSpeechStatus()
  }, [])

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
    return () => {
      recognitionRef.current?.stop?.()
      audioRef.current?.pause()
    }
  }, [])

  const buildSpeechText = (content: string) => {
    const firstName = String(user?.name || "").trim().split(/\s+/)[0]
    const cleanContent = content.replace(/^(oi|ola|olá|olÃ¡)[,!.\s]+/i, "").trim()

    if (!firstName) return cleanContent
    if (new RegExp(`\\b(senhor|senhora|${firstName})\\b`, "i").test(cleanContent)) return cleanContent
    if (cleanContent.length > 180) return cleanContent

    const address = `senhor ${firstName}`
    const confirmation = cleanContent.match(/^(pronto|claro|certo|perfeito|beleza|sim)[,!.\s]*(.*)$/i)

    if (confirmation) {
      const [, opener, rest] = confirmation
      return `${opener}, ${address}.${rest ? ` ${rest.trim()}` : ""}`
    }

    return `Senhor ${firstName}, ${cleanContent.charAt(0).toLowerCase()}${cleanContent.slice(1)}`
  }

  async function speakMessage(content: string, messageId: string) {
    try {
      setSpeakingMessageId(messageId)
      setIsSpeaking(true)
      setVoiceStatus("Alfred respondendo")
      isSpeakingRef.current = true
      audioRef.current?.pause()

      const res = await fetch("/api/copilot/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: buildSpeechText(content) }),
      })

      if (!res.ok) {
        const message =
          res.status === 503 ? "Configure a chave da ElevenLabs para ativar a voz do Alfred" : "Nao consegui gerar a voz"
        toast.error(message)
        return false
      }

      const blob = await res.blob()
      const audioUrl = URL.createObjectURL(blob)
      const audio = new Audio(audioUrl)
      audioRef.current = audio

      await new Promise<void>((resolve, reject) => {
        audio.onended = () => {
          URL.revokeObjectURL(audioUrl)
          resolve()
        }
        audio.onerror = () => {
          URL.revokeObjectURL(audioUrl)
          reject(new Error("Audio playback failed"))
        }
        audio.play().catch(reject)
      })

      return true
    } catch (error) {
      console.error("Error playing Alfred voice:", error)
      toast.error("Nao consegui tocar a voz do Alfred")
      return false
    } finally {
      setSpeakingMessageId(null)
      setIsSpeaking(false)
      isSpeakingRef.current = false
      if (isVoiceModeActiveRef.current) {
        setVoiceStatus("Pronto para ouvir")
      }
    }
  }

  function getRecognition() {
    if (recognitionRef.current) return recognitionRef.current

    if (typeof window === "undefined") return null

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) return null

    const recognition = new SpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = true
    recognition.lang = "pt-BR"

    recognition.onstart = () => {
      setIsListening(true)
      setLiveTranscript("")
      setVoiceStatus("Escutando")
    }

    recognition.onresult = (event: any) => {
      let finalTranscript = ""
      let interimTranscript = ""

      for (let index = event.resultIndex; index < event.results.length; index++) {
        const transcript = event.results[index][0].transcript
        if (event.results[index].isFinal) {
          finalTranscript += transcript
        } else {
          interimTranscript += transcript
        }
      }

      setLiveTranscript((finalTranscript || interimTranscript).trim())

      if (finalTranscript.trim()) {
        recognition.stop()
        void handleSendMessage(finalTranscript.trim(), {
          source: "voice",
          autoSpeak: true,
          resumeListening: true,
        })
      }
    }

    recognition.onerror = () => {
      setIsListening(false)
      if (isVoiceModeActiveRef.current) {
        setVoiceStatus("Nao consegui ouvir")
      }
      toast.error("Nao consegui capturar sua voz")
    }

    recognition.onend = () => {
      setIsListening(false)
      if (isVoiceModeActiveRef.current && !isProcessingRef.current && !isSpeakingRef.current) {
        setVoiceStatus("Pronto para ouvir")
      }
    }

    recognitionRef.current = recognition
    return recognition
  }

  function startVoiceListening() {
    if (!isSpeechConfiguredRef.current) {
      toast.error("A voz do Alfred ainda nao esta configurada")
      return
    }

    const recognition = getRecognition()
    if (!recognition) {
      toast.error("Seu navegador nao suporta conversa por voz")
      return
    }

    if (isProcessingRef.current || isSpeakingRef.current) return

    try {
      setIsVoiceModeActive(true)
      isVoiceModeActiveRef.current = true
      setVoiceStatus("Escutando")
      recognition.start()
    } catch {
      setIsListening(false)
    }
  }

  function stopVoiceMode() {
    setIsVoiceModeActive(false)
    isVoiceModeActiveRef.current = false
    setIsListening(false)
    setIsSpeaking(false)
    setLiveTranscript("")
    setVoiceStatus("Conversa pausada")
    recognitionRef.current?.stop?.()
    audioRef.current?.pause()
  }

  function toggleVoiceMode() {
    if (isVoiceModeActive) {
      stopVoiceMode()
    } else {
      startVoiceListening()
    }
  }

  async function handleSendMessage(text?: string, options: SendOptions = {}) {
    const messageText = text || inputValue.trim()
    if (!messageText || isProcessingRef.current) return

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: messageText,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue("")
    setLiveTranscript(messageText)
    setIsProcessing(true)
    isProcessingRef.current = true
    if (options.source === "voice") {
      setVoiceStatus("Analisando")
    }

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
        content: result.message || "Desculpe, nao consegui processar sua mensagem.",
        timestamp: new Date(),
        action: result.action,
      }

      setMessages((prev) => [...prev, assistantMessage])

      if (result.action) {
        setTimeout(() => router.refresh(), 1500)
      }

      if (options.autoSpeak !== false && isSpeechConfiguredRef.current) {
        await speakMessage(assistantMessage.content, assistantMessage.id)
      }

      if (options.resumeListening && isVoiceModeActiveRef.current) {
        window.setTimeout(startVoiceListening, 350)
      }
    } catch {
      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "Desculpe, tive um problema. Pode tentar de novo?",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsProcessing(false)
      isProcessingRef.current = false
      if (!isVoiceModeActiveRef.current) {
        setVoiceStatus("Pronto para conversar")
      }
    }
  }

  const handleClearHistory = async () => {
    try {
      await fetch("/api/copilot/chat", { method: "DELETE" })
      setMessages([])
      toast.success("Historico limpo")
    } catch {
      toast.error("Erro ao limpar historico")
    }
  }

  const handleQuickResponse = (text: string) => {
    setInputValue(text)
    void handleSendMessage(text)
  }

  const voiceOrbState = isSpeaking ? "speaking" : isListening ? "listening" : isProcessing ? "thinking" : "idle"

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-emerald-700 to-slate-950 shadow-lg">
            <Sparkles className="h-6 w-6 text-amber-300" />
          </div>
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold">
              Alfred
              {isPremiumPlan && (
                <span className="flex items-center gap-1 rounded-full bg-amber-500/20 px-2 py-0.5 text-xs text-amber-500">
                  <Crown className="h-3 w-3" />
                  Premium
                </span>
              )}
            </h1>
            <p className="text-sm text-muted-foreground">Seu assistente financeiro pessoal</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={handleClearHistory} disabled={messages.length === 0}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {messages.length === 0 && !isLoadingHistory && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <AnimatedCard delay={0.05} className="p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                <DollarSign className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <h3 className="text-sm font-medium">Registrar Gastos</h3>
                <p className="mt-1 text-xs text-muted-foreground">"Gastei 50 de mercado"</p>
              </div>
            </div>
          </AnimatedCard>

          <AnimatedCard delay={0.1} className="p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                <MessageSquare className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <h3 className="text-sm font-medium">Consultar Financas</h3>
                <p className="mt-1 text-xs text-muted-foreground">"Quanto gastei esse mes?"</p>
              </div>
            </div>
          </AnimatedCard>

          <AnimatedCard delay={0.15} className="p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
                <HelpCircle className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <h3 className="text-sm font-medium">Tirar Duvidas</h3>
                <p className="mt-1 text-xs text-muted-foreground">"Como funciona o app?"</p>
              </div>
            </div>
          </AnimatedCard>

          <AnimatedCard delay={0.2} className="p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                <Lightbulb className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <h3 className="text-sm font-medium">Dicas Financeiras</h3>
                <p className="mt-1 text-xs text-muted-foreground">"Me da dicas pra economizar"</p>
              </div>
            </div>
          </AnimatedCard>
        </div>
      )}

      <AnimatedCard delay={0.25} className="overflow-hidden">
        <div className="border-b border-border bg-card/95 p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <button
                type="button"
                onClick={toggleVoiceMode}
                disabled={!isSpeechConfigured}
                className="group relative flex h-24 w-24 shrink-0 items-center justify-center rounded-full disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                aria-label={isVoiceModeActive ? "Encerrar modo voz" : "Iniciar modo voz"}
              >
                <span className="absolute h-[74px] w-[74px] rounded-full bg-slate-950 shadow-[0_0_35px_rgba(14,165,233,0.28)]" />
                <span
                  className={`absolute h-[72px] w-[72px] rounded-full border transition-colors ${
                    voiceOrbState === "listening"
                      ? "border-cyan-300/70 bg-cyan-400/10"
                      : voiceOrbState === "speaking"
                        ? "border-emerald-300/70 bg-emerald-400/10"
                        : voiceOrbState === "thinking"
                          ? "border-amber-300/70 bg-amber-400/10"
                          : "border-slate-500/40 bg-slate-900"
                  }`}
                />
                <span className="absolute h-[46px] w-[46px] rounded-full bg-background" />
                {WAVE_BARS.map((bar, index) => {
                  const active = isListening || isSpeaking || isProcessing
                  const color =
                    voiceOrbState === "speaking"
                      ? "bg-emerald-300"
                      : voiceOrbState === "thinking"
                        ? "bg-amber-300"
                        : "bg-cyan-300"

                  return (
                    <motion.span
                      key={index}
                      className={`absolute left-1/2 top-1/2 w-[2px] origin-bottom rounded-full ${color}`}
                      style={{
                        transform: `rotate(${bar.angle}deg) translateY(-43px)`,
                      }}
                      animate={{
                        height: active ? [bar.height * 0.45, bar.height, bar.height * 0.62] : bar.height * 0.38,
                        opacity: active ? [0.35, 1, 0.55] : 0.35,
                      }}
                      transition={{
                        duration: active ? 0.95 : 0.2,
                        delay: active ? bar.delay : 0,
                        repeat: active ? Infinity : 0,
                        ease: "easeInOut",
                      }}
                    />
                  )
                })}
                <span className="relative flex h-12 w-12 items-center justify-center rounded-full text-cyan-100 transition-transform group-hover:scale-105">
                  {isProcessing ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : isSpeaking ? (
                    <Volume2 className="h-6 w-6" />
                  ) : isListening ? (
                    <Mic className="h-6 w-6" />
                  ) : isVoiceModeActive ? (
                    <MicOff className="h-6 w-6" />
                  ) : (
                    <WalletCards className="h-6 w-6" />
                  )}
                </span>
              </button>

              <div className="min-w-0">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-cyan-500/25 bg-cyan-500/10 px-2.5 py-1 text-xs font-medium text-cyan-500">
                    {isSpeechConfigured ? "Voz conectada" : "Voz indisponivel"}
                  </span>
                  <span className="rounded-full border border-border bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                    {voiceStatus}
                  </span>
                </div>
                <p className="text-sm font-medium">Modo voz do Alfred</p>
                <p className="mt-1 line-clamp-2 min-h-5 text-sm text-muted-foreground">
                  {liveTranscript || "Toque no anel e fale naturalmente. Alfred responde e registra no chat."}
                </p>
              </div>
            </div>

            <div className="flex shrink-0 flex-wrap gap-2 md:justify-end">
              <Button type="button" onClick={toggleVoiceMode} disabled={!isSpeechConfigured || isProcessing} size="sm">
                {isVoiceModeActive ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                {isVoiceModeActive ? "Pausar voz" : "Conversar"}
              </Button>
              {isVoiceModeActive && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={startVoiceListening}
                  disabled={isListening || isProcessing || isSpeaking}
                >
                  <Mic className="h-4 w-4" />
                  Ouvir
                </Button>
              )}
            </div>
          </div>
        </div>
        <div className="h-[400px] space-y-4 overflow-y-auto bg-muted/20 p-4">
          {isLoadingHistory ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-800 to-slate-950 shadow-lg">
                <Sparkles className="h-10 w-10 text-amber-300" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">Ola, sou o Alfred</h3>
              <p className="mb-6 max-w-md text-sm text-muted-foreground">
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
                      <AvatarFallback className="bg-gradient-to-br from-emerald-800 to-slate-950 text-xs font-bold text-amber-300">
                        A
                      </AvatarFallback>
                    ) : (
                      <AvatarFallback className="bg-primary text-xs text-primary-foreground">
                        {user?.name?.charAt(0) || "U"}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                      msg.role === "user"
                        ? "rounded-tr-sm bg-primary text-primary-foreground"
                        : "rounded-tl-sm border border-border bg-card"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      {msg.action && (
                        <span className="inline-block rounded bg-green-500/20 px-2 py-0.5 text-xs text-green-600 dark:text-green-400">
                          Acao executada
                        </span>
                      )}
                      {msg.role === "assistant" && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs"
                          onClick={() => speakMessage(msg.content, msg.id)}
                          disabled={speakingMessageId === msg.id || !isSpeechConfigured}
                        >
                          {speakingMessageId === msg.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Volume2 className="h-3 w-3" />
                          )}
                          Ouvir
                        </Button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}

          {isProcessing && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-gradient-to-br from-emerald-800 to-slate-950 text-xs font-bold text-amber-300">
                  A
                </AvatarFallback>
              </Avatar>
              <div className="rounded-2xl rounded-tl-sm border border-border bg-card px-4 py-3">
                <div className="flex gap-1">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: "0ms" }} />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: "150ms" }} />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="border-t border-border bg-muted/30 p-3">
          <p className="mb-2 text-xs text-muted-foreground">Respostas rapidas:</p>
          <div className="flex flex-wrap gap-2">
            {QUICK_RESPONSES.map((item, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                className="h-7 bg-transparent px-2 text-xs"
                onClick={() => handleQuickResponse(item.text)}
                disabled={isProcessing}
              >
                <item.icon className={`mr-1 h-3 w-3 ${item.color}`} />
                {item.text.length > 25 ? item.text.substring(0, 25) + "..." : item.text}
              </Button>
            ))}
          </div>
        </div>

        <div className="border-t border-border bg-card p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              void handleSendMessage()
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

            <Button
              type="button"
              variant={isVoiceModeActive ? "default" : "outline"}
              size="icon"
              onClick={toggleVoiceMode}
              disabled={!isSpeechConfigured}
              className={isVoiceModeActive ? "bg-emerald-600 hover:bg-emerald-700" : ""}
            >
              {isVoiceModeActive ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>

            <Button type="submit" size="icon" disabled={isProcessing || !inputValue.trim()}>
              {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
        </div>
      </AnimatedCard>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <AnimatedCard delay={0.3} className="p-4">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-medium">
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
          <h3 className="mb-3 flex items-center gap-2 text-sm font-medium">
            <TrendingUp className="h-4 w-4 text-green-500" />
            Registrar Receitas
          </h3>
          <div className="space-y-2 text-xs text-muted-foreground">
            <p>"Recebi 5000 de salario"</p>
            <p>"Ganhei 200 de freelance"</p>
            <p>"Entrou 150 de dividendos"</p>
          </div>
        </AnimatedCard>

        <AnimatedCard delay={0.4} className="p-4">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-medium">
            <HelpCircle className="h-4 w-4 text-blue-500" />
            Perguntas Uteis
          </h3>
          <div className="space-y-2 text-xs text-muted-foreground">
            <p>"Qual meu patrimonio liquido?"</p>
            <p>"Qual meu maior gasto do mes?"</p>
            <p>"Quanto tenho em investimentos?"</p>
          </div>
        </AnimatedCard>
      </div>
    </div>
  )
}
