"use client"

import { useState, useCallback } from "react"
import { Upload, FileSpreadsheet, FileText, Lock, Crown, ArrowRight, History } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { FileDropzone } from "./file-dropzone"
import { ImportPreview } from "./import-preview"
import { ImportHistory } from "./import-history"

interface ImportModuleProps {
  user: {
    id: string
    name?: string | null
    email: string
    plan_name?: string
    modules_allowed?: number
  }
  hasAccess: boolean
}

export interface ParsedTransaction {
  date: string
  description: string
  amount: number
  type: "income" | "expense"
  categoryId: string | null
  categoryName: string
  isDuplicate: boolean
  selected: boolean
}

interface ImportSummary {
  total: number
  unique: number
  duplicates: number
  totalIncome: number
  totalExpense: number
  periodStart: string
  periodEnd: string
}

interface Categories {
  expense: Array<{ id: string; name: string; color: string }>
  income: Array<{ id: string; name: string; color: string }>
}

type ViewState = "upload" | "preview" | "history"

export function ImportModule({ user, hasAccess }: ImportModuleProps) {
  const [view, setView] = useState<ViewState>("upload")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [transactions, setTransactions] = useState<ParsedTransaction[]>([])
  const [summary, setSummary] = useState<ImportSummary | null>(null)
  const [categories, setCategories] = useState<Categories | null>(null)
  const [fileName, setFileName] = useState("")
  const [fileType, setFileType] = useState("")

  const handleFileUpload = useCallback(async (file: File) => {
    setIsLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/import/parse", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erro ao processar arquivo")
      }

      setTransactions(data.transactions)
      setSummary(data.summary)
      setCategories(data.categories)
      setFileName(data.fileName)
      setFileType(data.fileType)
      setView("preview")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido")
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleConfirmImport = async (selectedTransactions: ParsedTransaction[]) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/import/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactions: selectedTransactions,
          fileName,
          fileType,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erro ao importar transações")
      }

      // Reset and go to history
      setTransactions([])
      setSummary(null)
      setView("history")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setTransactions([])
    setSummary(null)
    setError(null)
    setView("upload")
  }

  if (!hasAccess) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center p-4">
        <Card className="w-full max-w-lg bg-card/50 backdrop-blur border-border">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-warning/20">
              <Lock className="h-8 w-8 text-warning" />
            </div>
            <CardTitle className="text-2xl">Recurso Premium</CardTitle>
            <CardDescription className="text-base">
              A importação de extratos está disponível apenas para os planos Completo e Total.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <h4 className="font-medium mb-2">Com a importação você pode:</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4 text-primary" />
                  Importar extratos em OFX, TXT e mais
                </li>
                <li className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  Categorização automática inteligente
                </li>
                <li className="flex items-center gap-2">
                  <History className="h-4 w-4 text-primary" />
                  Histórico completo de importações
                </li>
              </ul>
            </div>

            <Button asChild className="w-full gradient-primary">
              <Link href="/upgrade">
                <Crown className="mr-2 h-4 w-4" />
                Fazer Upgrade
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Importar Extrato</h1>
          <p className="text-muted-foreground">
            Importe seu extrato bancário para registrar transações automaticamente
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant={view === "upload" ? "default" : "outline"}
            onClick={() => setView("upload")}
            disabled={view === "preview"}
          >
            <Upload className="mr-2 h-4 w-4" />
            Importar
          </Button>
          <Button
            variant={view === "history" ? "default" : "outline"}
            onClick={() => setView("history")}
            disabled={view === "preview"}
          >
            <History className="mr-2 h-4 w-4" />
            Histórico
          </Button>
        </div>
      </div>

      {/* Error message */}
      {error && <div className="rounded-lg border border-danger/50 bg-danger/10 p-4 text-danger">{error}</div>}

      {/* Views */}
      {view === "upload" && <FileDropzone onFileUpload={handleFileUpload} isLoading={isLoading} />}

      {view === "preview" && summary && categories && (
        <ImportPreview
          transactions={transactions}
          summary={summary}
          categories={categories}
          onConfirm={handleConfirmImport}
          onCancel={handleCancel}
          isLoading={isLoading}
        />
      )}

      {view === "history" && <ImportHistory />}
    </div>
  )
}
