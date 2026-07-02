"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
  Plus,
  CreditCardIcon,
  Calendar,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Receipt,
  RefreshCw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { AnimatedCard } from "@/components/ui/animated-card"
import { Progress } from "@/components/ui/progress"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import { formatCurrency } from "@/lib/utils"
import { AddCardDialog } from "./add-card-dialog"
import { EditCardDialog } from "./edit-card-dialog"
import { CardDetailsDialog } from "./card-details-dialog"
import { identifyBank } from "@/lib/bank-brands"

interface CreditCardsModuleProps {
  userId: string
}

interface Card {
  id: string
  name: string
  brand: string
  last_digits: string
  credit_limit: number
  current_balance: number
  available_limit: number
  closing_day: number
  due_day: number
  color: string
  is_active: boolean
}

interface Invoice {
  id: string
  credit_card_id: string
  reference_month: number
  reference_year: number
  total_amount: number
  status: string
  due_date: string
}

export function CreditCardsModule({ userId }: CreditCardsModuleProps) {
  const [cards, setCards] = useState<Card[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [selectedCard, setSelectedCard] = useState<Card | null>(null)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [cardsRes, invoicesRes] = await Promise.all([
        fetch("/api/credit-cards"),
        fetch("/api/credit-cards/invoices"),
      ])

      if (cardsRes.ok) {
        const data = await cardsRes.json()
        const cardsArray = Array.isArray(data) ? data : data.cards || []
        setCards(cardsArray)
      }

      if (invoicesRes.ok) {
        const data = await invoicesRes.json()
        const invoicesArray = Array.isArray(data) ? data : data.invoices || []
        setInvoices(invoicesArray)
      }
    } catch (error) {
      console.error("Error fetching cards:", error)
      toast.error("Erro ao carregar cartões")
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  const handleRefresh = () => {
    setIsRefreshing(true)
    fetchData()
  }

  const handleDeleteCard = async (cardId: string) => {
    try {
      const res = await fetch(`/api/credit-cards/${cardId}`, { method: "DELETE" })
      if (res.ok) {
        toast.success("Cartão removido")
        fetchData()
      } else {
        toast.error("Erro ao remover cartão")
      }
    } catch (error) {
      toast.error("Erro ao remover cartão")
    }
  }

  const handleEditCard = (card: Card) => {
    setSelectedCard(card)
    setShowEditDialog(true)
  }

  const totalLimit = cards.reduce((sum, c) => sum + Number(c.credit_limit || 0), 0)
  const totalUsed = cards.reduce((sum, c) => sum + Number(c.current_balance || 0), 0)
  const totalAvailable = totalLimit - totalUsed

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Cartões de Crédito</h1>
          <p className="text-muted-foreground">Gerencie seus cartões e faturas</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          </Button>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Cartão
          </Button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <AnimatedCard className="bg-gradient-to-br from-primary/10 to-primary/5">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20">
              <CreditCardIcon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Limite Total</p>
              <p className="text-xl font-bold text-foreground">{formatCurrency(totalLimit)}</p>
            </div>
          </div>
        </AnimatedCard>

        <AnimatedCard className="bg-gradient-to-br from-red-500/10 to-red-500/5">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/20">
              <TrendingUp className="h-6 w-6 text-red-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Utilizado</p>
              <p className="text-xl font-bold text-red-500">{formatCurrency(totalUsed)}</p>
            </div>
          </div>
        </AnimatedCard>

        <AnimatedCard className="bg-gradient-to-br from-green-500/10 to-green-500/5">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-500/20">
              <DollarSign className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Disponível</p>
              <p className="text-xl font-bold text-green-500">{formatCurrency(totalAvailable)}</p>
            </div>
          </div>
        </AnimatedCard>
      </div>

      {/* Cards list */}
      {cards.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {cards.map((card, index) => {
            const usagePercent =
              card.credit_limit > 0 ? (Number(card.current_balance || 0) / Number(card.credit_limit)) * 100 : 0
            const isHighUsage = usagePercent > 80

            const bankInfo = identifyBank(card.name)
            const gradient = bankInfo.gradient

            return (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div
                  className={`relative rounded-xl bg-gradient-to-br ${gradient} p-5 shadow-lg transition-transform hover:scale-[1.02]`}
                  style={{ color: bankInfo.textColor }}
                >
                  {/* Card header */}
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <p className="text-sm opacity-80">{bankInfo.name}</p>
                      <p className="text-lg font-semibold">{card.name}</p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="hover:bg-white/20"
                          style={{ color: bankInfo.textColor }}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedCard(card)
                            setShowDetailsDialog(true)
                          }}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Ver Detalhes
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEditCard(card)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteCard(card.id)}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Remover
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Card number */}
                  <p className="text-xl tracking-widest mb-6">•••• •••• •••• {card.last_digits || "0000"}</p>

                  {/* Usage */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="opacity-80">Utilizado</span>
                      <span className="font-semibold">{formatCurrency(Number(card.current_balance || 0))}</span>
                    </div>
                    <Progress value={usagePercent} className="h-2 bg-white/30" />
                    <div className="flex justify-between text-xs opacity-80">
                      <span>Limite: {formatCurrency(Number(card.credit_limit || 0))}</span>
                      <span>{usagePercent.toFixed(0)}%</span>
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="flex justify-between mt-4 pt-4 border-t border-white/20 text-sm">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>Fecha: {card.closing_day || 15}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Receipt className="h-3 w-3" />
                      <span>Vence: {card.due_day || 25}</span>
                    </div>
                  </div>

                  {/* High usage warning */}
                  {isHighUsage && (
                    <div className="absolute top-2 right-12 flex items-center gap-1 bg-white/20 rounded-full px-2 py-1 text-xs">
                      <AlertTriangle className="h-3 w-3" />
                      Alto uso
                    </div>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      ) : (
        <AnimatedCard className="text-center py-12">
          <CreditCardIcon className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="font-semibold mb-2">Nenhum cartão cadastrado</h3>
          <p className="text-muted-foreground mb-4">Adicione seus cartões para controlar seus gastos</p>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Primeiro Cartão
          </Button>
        </AnimatedCard>
      )}

      {/* Upcoming invoices */}
      {invoices.length > 0 && (
        <AnimatedCard>
          <h3 className="font-semibold mb-4">Próximas Faturas</h3>
          <div className="space-y-3">
            {invoices.slice(0, 5).map((invoice) => {
              const card = cards.find((c) => c.id === invoice.credit_card_id)
              const isOverdue = new Date(invoice.due_date) < new Date() && invoice.status !== "paid"

              return (
                <div
                  key={invoice.id}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    isOverdue ? "border-red-500/50 bg-red-500/10" : "border-border"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                        isOverdue ? "bg-red-500/20" : "bg-primary/20"
                      }`}
                    >
                      <CreditCardIcon className={`h-5 w-5 ${isOverdue ? "text-red-500" : "text-primary"}`} />
                    </div>
                    <div>
                      <p className="font-medium">{card?.name || "Cartão"}</p>
                      <p className="text-sm text-muted-foreground">
                        {invoice.reference_month}/{invoice.reference_year} •{" "}
                        {new Date(invoice.due_date).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${isOverdue ? "text-red-500" : "text-foreground"}`}>
                      {formatCurrency(invoice.total_amount)}
                    </p>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        invoice.status === "paid"
                          ? "bg-green-500/20 text-green-500"
                          : isOverdue
                            ? "bg-red-500/20 text-red-500"
                            : "bg-yellow-500/20 text-yellow-500"
                      }`}
                    >
                      {invoice.status === "paid" ? "Pago" : isOverdue ? "Vencido" : "Aberto"}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </AnimatedCard>
      )}

      <AddCardDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSuccess={() => {
          fetchData()
          toast.success("Cartão cadastrado com sucesso!")
        }}
      />

      {selectedCard && (
        <EditCardDialog
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          card={selectedCard}
          onSuccess={() => {
            fetchData()
          }}
        />
      )}

      {selectedCard && (
        <CardDetailsDialog
          open={showDetailsDialog}
          onOpenChange={setShowDetailsDialog}
          card={selectedCard}
          invoices={invoices.filter((i) => i.credit_card_id === selectedCard.id)}
        />
      )}
    </div>
  )
}
