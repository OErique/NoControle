"use client"

import { useCallback, useState } from "react"
import { useDropzone, type FileRejection } from "react-dropzone"
import { Upload, FileText, FileCode, FileSpreadsheet, Loader2, Info } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface FileDropzoneProps {
  onFileUpload: (file: File) => Promise<void>
  isLoading: boolean
}

const ACCEPTED_FORMATS = {
  "text/plain": [".txt", ".bbt"],
  "application/x-ofx": [".ofx"],
  "application/ofx": [".ofx"],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
  "application/vnd.ms-excel": [".xls"],
}

const formatInfo = [
  { ext: "XLSX/XLS", icon: FileSpreadsheet, desc: "Planilhas Excel com dados bancários" },
  { ext: "OFX", icon: FileCode, desc: "Formato padrão bancário (Open Financial Exchange)" },
  { ext: "TXT/BBT", icon: FileText, desc: "Arquivos de texto com transações" },
]

export function FileDropzone({ onFileUpload, isLoading }: FileDropzoneProps) {
  const [dragError, setDragError] = useState<string | null>(null)

  const onDrop = useCallback(
    async (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
      setDragError(null)

      if (rejectedFiles.length > 0) {
        setDragError("Formato de arquivo não suportado. Use XLSX, OFX, TXT ou BBT.")
        return
      }

      if (acceptedFiles.length > 0) {
        await onFileUpload(acceptedFiles[0])
      }
    },
    [onFileUpload],
  )

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: ACCEPTED_FORMATS,
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // Increased to 10MB for Excel files
    disabled: isLoading,
  })

  return (
    <div className="space-y-6">
      {/* Dropzone */}
      <Card
        {...getRootProps()}
        className={cn(
          "cursor-pointer border-2 border-dashed transition-all duration-200",
          isDragActive && !isDragReject && "border-primary bg-primary/5",
          isDragReject && "border-danger bg-danger/5",
          !isDragActive && "border-border hover:border-primary/50 hover:bg-muted/30",
          isLoading && "pointer-events-none opacity-60",
        )}
      >
        <input {...getInputProps()} />
        <CardContent className="flex flex-col items-center justify-center py-16">
          {isLoading ? (
            <>
              <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
              <p className="text-lg font-medium">Processando arquivo...</p>
              <p className="text-sm text-muted-foreground">Isso pode levar alguns segundos</p>
            </>
          ) : (
            <>
              <div
                className={cn(
                  "flex h-16 w-16 items-center justify-center rounded-full mb-4",
                  isDragActive ? "bg-primary/20" : "bg-muted",
                )}
              >
                <Upload
                  className={cn("h-8 w-8 transition-colors", isDragActive ? "text-primary" : "text-muted-foreground")}
                />
              </div>
              <p className="text-lg font-medium mb-1">
                {isDragActive ? "Solte o arquivo aqui" : "Arraste e solte seu extrato aqui"}
              </p>
              <p className="text-sm text-muted-foreground mb-4">ou clique para selecionar um arquivo</p>
              <Button variant="outline" disabled={isLoading}>
                Selecionar Arquivo
              </Button>
            </>
          )}

          {dragError && <p className="mt-4 text-sm text-danger">{dragError}</p>}
        </CardContent>
      </Card>

      {/* Supported formats */}
      <Card className="bg-card/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Info className="h-4 w-4 text-muted-foreground" />
            Formatos Suportados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-3">
            {formatInfo.map(({ ext, icon: Icon, desc }) => (
              <div key={ext} className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 p-3">
                <Icon className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">{ext}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            * Tamanho máximo: 10MB. Para melhores resultados, use arquivos OFX ou Excel exportados diretamente do seu
            banco.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
