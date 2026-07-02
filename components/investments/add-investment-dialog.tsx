"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

interface AddInvestmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  types: { id: string; name: string; icon?: string }[]
  onSubmit: (data: {
    name: string
    typeId: string
    initialAmount: number
    currentAmount: number
    startDate: string
    notes?: string
    institution?: string
  }) => void
}

export function AddInvestmentDialog({ open, onOpenChange, types, onSubmit }: AddInvestmentDialogProps) {
  const [name, setName] = useState("")
  const [typeId, setTypeId] = useState("")
  const [initialAmount, setInitialAmount] = useState("")
  const [currentAmount, setCurrentAmount] = useState("")
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0])
  const [notes, setNotes] = useState("")
  const [institution, setInstitution] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const formatCurrency = (value: string) => {
    const numbers = value.replace(/\D/g, "")
    const amount = Number.parseInt(numbers) / 100
    if (isNaN(amount) || amount === 0) return ""
    return amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
  }

  const parseCurrency = (value: string) => {
    return Number.parseFloat(value.replace(/\D/g, "")) / 100 || 0
  }

  const handleSubmit = async () => {
    if (!name || !typeId || !initialAmount) {
      toast.error("Preencha os campos obrigatorios")
      return
    }

    setIsLoading(true)
    try {
      await onSubmit({
        name,
        typeId,
        initialAmount: parseCurrency(initialAmount),
        currentAmount: parseCurrency(currentAmount) || parseCurrency(initialAmount),
        startDate,
        notes: notes || undefined,
        institution: institution || undefined,
      })
      resetForm()
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setName("")
    setTypeId("")
    setInitialAmount("")
    setCurrentAmount("")
    setStartDate(new Date().toISOString().split("T")[0])
    setNotes("")
    setInstitution("")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Novo Investimento</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Investimento *</Label>
            <Input
              id="name"
              placeholder="Ex: Tesouro Selic 2029, Bitcoin, Nubank CDB"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Tipo *</Label>
            <Select value={typeId} onValueChange={setTypeId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                {types.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="institution">Instituicao/Corretora</Label>
            <Input
              id="institution"
              placeholder="Ex: Nubank, XP, Binance"
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="invested">Valor Investido *</Label>
              <Input
                id="invested"
                placeholder="R$ 0,00"
                value={initialAmount}
                onChange={(e) => setInitialAmount(formatCurrency(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="current">Valor Atual</Label>
              <Input
                id="current"
                placeholder="R$ 0,00"
                value={currentAmount}
                onChange={(e) => setCurrentAmount(formatCurrency(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">Deixe vazio para usar o valor investido</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Data do Investimento</Label>
            <Input id="date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observacoes (opcional)</Label>
            <Textarea
              id="notes"
              placeholder="Adicione notas sobre este investimento..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="bg-transparent">
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading} className="gradient-primary">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              "Adicionar"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
