"use client"
import useSWR from "swr"
import { FileSpreadsheet, FileText, FileCode, CheckCircle, XCircle, Loader2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn, formatCurrency, formatDate } from "@/lib/utils"

interface ImportRecord {
  id: string
  file_name: string
  file_type: string
  total_transactions: number
  imported_transactions: number
  skipped_duplicates: number
  total_income: number
  total_expense: number
  period_start: string
  period_end: string
  status: string
  created_at: string
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

const getFileIcon = (type: string) => {
  switch (type.toLowerCase()) {
    case "csv":
      return FileSpreadsheet
    case "ofx":
      return FileCode
    default:
      return FileText
  }
}

export function ImportHistory() {
  const { data: history, error, isLoading } = useSWR<ImportRecord[]>("/api/import/history", fetcher)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <Card className="bg-card/50">
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Erro ao carregar histórico</p>
        </CardContent>
      </Card>
    )
  }

  if (!history || history.length === 0) {
    return (
      <Card className="bg-card/50">
        <CardContent className="py-12 text-center">
          <FileSpreadsheet className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">Nenhuma importação realizada ainda</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {history.map((record) => {
        const Icon = getFileIcon(record.file_type)
        const isSuccess = record.status === "completed"

        return (
          <Card key={record.id} className="bg-card/50">
            <CardContent className="py-4">
              <div className="flex items-start gap-4">
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-lg shrink-0",
                    isSuccess ? "bg-success/20" : "bg-danger/20",
                  )}
                >
                  <Icon className={cn("h-5 w-5", isSuccess ? "text-success" : "text-danger")} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium truncate">{record.file_name}</p>
                    {isSuccess ? (
                      <CheckCircle className="h-4 w-4 text-success shrink-0" />
                    ) : (
                      <XCircle className="h-4 w-4 text-danger shrink-0" />
                    )}
                  </div>

                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    <span>
                      {record.imported_transactions} de {record.total_transactions} importadas
                    </span>
                    {record.skipped_duplicates > 0 && <span>{record.skipped_duplicates} duplicatas ignoradas</span>}
                    <span>
                      Período: {formatDate(record.period_start)} - {formatDate(record.period_end)}
                    </span>
                  </div>

                  <div className="flex gap-4 mt-2 text-sm">
                    <span className="text-success">+{formatCurrency(record.total_income)}</span>
                    <span className="text-danger">-{formatCurrency(record.total_expense)}</span>
                  </div>
                </div>

                <div className="text-right text-sm text-muted-foreground shrink-0">{formatDate(record.created_at)}</div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
