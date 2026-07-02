"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { MessageSquare, Plus, ThumbsUp, User, Send, HelpCircle, Lightbulb, MoreVertical, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { AnimatedCard } from "@/components/ui/animated-card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
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
import { LevelBadge } from "@/components/gamification/level-badge"
import { getLevelByPoints } from "@/lib/levels"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import { toast } from "sonner"
import Link from "next/link"

interface TipsModuleProps {
  userId: string
  userName?: string
  userAvatar?: string
  userPoints?: number
}

interface Tip {
  id: string
  user_id: string
  user_name: string
  user_avatar: string | null
  user_points: number
  title: string
  content: string
  category: string
  is_answered: boolean
  views_count: number
  helpful_count: number
  responses_count: number
  created_at: string
}

interface TipResponse {
  id: string
  user_id: string
  user_name: string
  user_avatar: string | null
  user_points: number
  content: string
  helpful_votes: number
  is_helpful: boolean
  created_at: string
}

const categories = [
  { value: "alimentacao", label: "Alimentacao" },
  { value: "transporte", label: "Transporte" },
  { value: "lazer", label: "Lazer" },
  { value: "moradia", label: "Moradia" },
  { value: "economia_geral", label: "Economia Geral" },
]

export function TipsModule({ userId, userName, userAvatar, userPoints }: TipsModuleProps) {
  const [tips, setTips] = useState<Tip[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newTip, setNewTip] = useState({ title: "", content: "", category: "" })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedTip, setSelectedTip] = useState<Tip | null>(null)
  const [responses, setResponses] = useState<TipResponse[]>([])
  const [newResponse, setNewResponse] = useState("")
  const [tipToDelete, setTipToDelete] = useState<string | null>(null)
  const [responseToDelete, setResponseToDelete] = useState<string | null>(null)

  useEffect(() => {
    fetchTips()
  }, [])

  const fetchTips = async () => {
    try {
      const res = await fetch("/api/tips")
      if (res.ok) {
        const data = await res.json()
        setTips(data.tips || [])
      }
    } catch (error) {
      console.error("Error fetching tips:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateTip = async () => {
    if (!newTip.title || !newTip.content || !newTip.category) {
      toast.error("Preencha todos os campos")
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch("/api/tips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTip),
      })
      if (res.ok) {
        const data = await res.json()
        const tipWithUser = {
          ...data.tip,
          user_name: userName || "Voce",
          user_avatar: userAvatar,
          user_points: userPoints || 0,
        }
        setTips([tipWithUser, ...tips])
        setNewTip({ title: "", content: "", category: "" })
        setIsDialogOpen(false)
        toast.success("Pergunta publicada!")
      }
    } catch (error) {
      toast.error("Erro ao publicar pergunta")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOpenTip = async (tip: Tip) => {
    setSelectedTip(tip)
    try {
      const res = await fetch(`/api/tips/${tip.id}/responses`)
      if (res.ok) {
        const data = await res.json()
        setResponses(data.responses || [])
      }
    } catch (error) {
      console.error("Error fetching responses:", error)
    }
  }

  const handleSubmitResponse = async () => {
    if (!selectedTip || !newResponse.trim()) return

    try {
      const res = await fetch(`/api/tips/${selectedTip.id}/responses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newResponse }),
      })
      if (res.ok) {
        const data = await res.json()
        setResponses([...responses, data.response])
        setNewResponse("")
        // Update tip responses count locally
        setTips((prev) =>
          prev.map((t) => (t.id === selectedTip.id ? { ...t, responses_count: (t.responses_count || 0) + 1 } : t)),
        )
        toast.success("Resposta enviada! +10 pontos")
      }
    } catch (error) {
      toast.error("Erro ao enviar resposta")
    }
  }

  const handleMarkHelpful = async (responseId: string) => {
    try {
      const res = await fetch(`/api/tips/responses/${responseId}/helpful`, {
        method: "POST",
      })
      if (res.ok) {
        setResponses((prev) =>
          prev.map((r) => (r.id === responseId ? { ...r, helpful_votes: r.helpful_votes + 1, is_helpful: true } : r)),
        )
      }
    } catch (error) {
      console.error("Error marking helpful:", error)
    }
  }

  const handleDeleteTip = async () => {
    if (!tipToDelete) return

    try {
      const res = await fetch(`/api/tips/${tipToDelete}/delete`, {
        method: "DELETE",
      })
      if (res.ok) {
        setTips((prev) => prev.filter((t) => t.id !== tipToDelete))
        toast.success("Pergunta excluida")
      } else {
        const data = await res.json()
        toast.error(data.error || "Erro ao excluir")
      }
    } catch (error) {
      toast.error("Erro ao excluir pergunta")
    } finally {
      setTipToDelete(null)
    }
  }

  const handleDeleteResponse = async () => {
    if (!responseToDelete) return

    try {
      const res = await fetch(`/api/tips/responses/${responseToDelete}/delete`, {
        method: "DELETE",
      })
      if (res.ok) {
        setResponses((prev) => prev.filter((r) => r.id !== responseToDelete))
        if (selectedTip) {
          setTips((prev) =>
            prev.map((t) =>
              t.id === selectedTip.id ? { ...t, responses_count: Math.max((t.responses_count || 1) - 1, 0) } : t,
            ),
          )
        }
        toast.success("Resposta excluida")
      } else {
        const data = await res.json()
        toast.error(data.error || "Erro ao excluir")
      }
    } catch (error) {
      toast.error("Erro ao excluir resposta")
    } finally {
      setResponseToDelete(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dicas da Comunidade</h1>
          <p className="text-muted-foreground">Peca e compartilhe dicas de economia</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Fazer Pergunta
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Fazer uma Pergunta</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Input
                  placeholder="Ex: Como economizar com alimentacao?"
                  value={newTip.title}
                  onChange={(e) => setNewTip({ ...newTip, title: e.target.value })}
                />
              </div>
              <div>
                <Textarea
                  placeholder="Descreva sua duvida com mais detalhes..."
                  value={newTip.content}
                  onChange={(e) => setNewTip({ ...newTip, content: e.target.value })}
                  rows={4}
                />
              </div>
              <div>
                <Select value={newTip.category} onValueChange={(v) => setNewTip({ ...newTip, category: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleCreateTip} disabled={isSubmitting} className="w-full">
                {isSubmitting ? "Publicando..." : "Publicar Pergunta"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <AnimatedCard>
        <div className="p-4 flex items-start gap-3">
          <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
            <Lightbulb className="h-5 w-5 text-green-500" />
          </div>
          <div>
            <h3 className="font-medium">Ganhe pontos ajudando!</h3>
            <p className="text-sm text-muted-foreground">
              Responda perguntas e ganhe 10 pontos. Se sua resposta for marcada como util, ganhe mais 20 pontos!
            </p>
          </div>
        </div>
      </AnimatedCard>

      <div className="space-y-4">
        {tips.length === 0 ? (
          <AnimatedCard>
            <div className="p-8 text-center">
              <HelpCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="font-semibold mb-2">Nenhuma pergunta ainda</h3>
              <p className="text-sm text-muted-foreground">Seja o primeiro a fazer uma pergunta!</p>
            </div>
          </AnimatedCard>
        ) : (
          tips.map((tip, i) => {
            const level = getLevelByPoints(tip.user_points || 0)
            const isOwner = tip.user_id === userId
            return (
              <motion.div
                key={tip.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <AnimatedCard className="cursor-pointer hover:border-primary/50 transition-colors">
                  <div className="p-4" onClick={() => handleOpenTip(tip)}>
                    <div className="flex items-start gap-3">
                      <Link href={`/profile/${tip.user_id}`} onClick={(e) => e.stopPropagation()}>
                        <div className="relative">
                          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                            {tip.user_avatar ? (
                              <img
                                src={tip.user_avatar || "/placeholder.svg"}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <User className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                          <div className="absolute -bottom-1 -right-1">
                            <LevelBadge level={level.slug} size="sm" />
                          </div>
                        </div>
                      </Link>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{tip.user_name || "Usuario"}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(tip.created_at), {
                              addSuffix: true,
                              locale: ptBR,
                            })}
                          </span>
                        </div>
                        <h3 className="font-semibold mb-1">{tip.title}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">{tip.content}</p>
                        <div className="flex items-center gap-4 mt-3">
                          <span className="text-xs px-2 py-1 rounded-full bg-muted">
                            {categories.find((c) => c.value === tip.category)?.label || tip.category}
                          </span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            {tip.responses_count || 0} respostas
                          </span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <ThumbsUp className="h-3 w-3" />
                            {tip.helpful_count || 0} uteis
                          </span>
                        </div>
                      </div>
                      {isOwner && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              className="text-danger focus:text-danger"
                              onClick={(e) => {
                                e.stopPropagation()
                                setTipToDelete(tip.id)
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                </AnimatedCard>
              </motion.div>
            )
          })
        )}
      </div>

      <Dialog open={!!selectedTip} onOpenChange={() => setSelectedTip(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedTip && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedTip.title}</DialogTitle>
              </DialogHeader>
              <div className="mt-4 space-y-6">
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm">{selectedTip.content}</p>
                  <div className="flex items-center gap-2 mt-3">
                    <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                      {categories.find((c) => c.value === selectedTip.category)?.label}
                    </span>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Respostas ({responses.length})</h4>
                  <div className="space-y-3">
                    {responses.map((response) => {
                      const level = getLevelByPoints(response.user_points || 0)
                      const isResponseOwner = response.user_id === userId
                      return (
                        <div key={response.id} className="p-4 rounded-lg border">
                          <div className="flex items-start gap-3">
                            <div className="relative">
                              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                                {response.user_avatar ? (
                                  <img
                                    src={response.user_avatar || "/placeholder.svg"}
                                    alt=""
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <User className="h-4 w-4 text-muted-foreground" />
                                )}
                              </div>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-sm">{response.user_name}</span>
                                <LevelBadge level={level.slug} size="sm" />
                              </div>
                              <p className="text-sm">{response.content}</p>
                              <div className="flex items-center gap-3 mt-2">
                                <button
                                  onClick={() => handleMarkHelpful(response.id)}
                                  disabled={response.is_helpful}
                                  className={`flex items-center gap-1 text-xs transition-colors ${
                                    response.is_helpful
                                      ? "text-green-500"
                                      : "text-muted-foreground hover:text-green-500"
                                  }`}
                                >
                                  <ThumbsUp className={`h-3 w-3 ${response.is_helpful ? "fill-current" : ""}`} />
                                  <span>{response.helpful_votes} acharam util</span>
                                </button>
                              </div>
                            </div>
                            {isResponseOwner && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-6 w-6">
                                    <MoreVertical className="h-3 w-3" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    className="text-danger focus:text-danger"
                                    onClick={() => setResponseToDelete(response.id)}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Excluir
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Input
                    placeholder="Escreva sua resposta..."
                    value={newResponse}
                    onChange={(e) => setNewResponse(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSubmitResponse()}
                  />
                  <Button onClick={handleSubmitResponse}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!tipToDelete} onOpenChange={(open) => !open && setTipToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir pergunta?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acao nao pode ser desfeita. A pergunta e todas as respostas serao removidas permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTip} className="bg-danger hover:bg-danger/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!responseToDelete} onOpenChange={(open) => !open && setResponseToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir resposta?</AlertDialogTitle>
            <AlertDialogDescription>Esta acao nao pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteResponse} className="bg-danger hover:bg-danger/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
