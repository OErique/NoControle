import type { ParsedTransaction } from "./types"

export function parseTXT(content: string): ParsedTransaction[] {
  const lines = content.trim().split(/\r?\n/)
  const transactions: ParsedTransaction[] = []

  const format = detectFormat(lines)

  console.log("[NoControle] Detected TXT format:", format)
  console.log("[NoControle] Total lines:", lines.length)

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()

    if (!trimmed || trimmed.length < 5) continue
    if (isHeaderLine(trimmed)) continue

    const parsed = parseLine(trimmed, format)
    if (parsed) {
      console.log("[NoControle] Parsed transaction:", parsed.description, "| Type:", parsed.type, "| Amount:", parsed.amount)
      transactions.push(parsed)
    }
  }

  console.log("[NoControle] Total transactions parsed:", transactions.length)
  return transactions
}

type FileFormat = "tabular" | "bb" | "itau" | "nubank" | "generic"

function detectFormat(lines: string[]): FileFormat {
  const content = lines.join("\n").toLowerCase()

  // Banco do Brasil format
  if (content.includes("banco do brasil") || content.includes("bb ")) {
    return "bb"
  }

  // Itaú format
  if (content.includes("itau") || content.includes("itaú")) {
    return "itau"
  }

  // Nubank format
  if (content.includes("nubank") || content.includes("nu pagamentos")) {
    return "nubank"
  }

  // Check if it's tabular (columns separated by tabs or multiple spaces)
  const hasTabular = lines.some((line) => line.includes("\t") || /\s{3,}/.test(line))

  if (hasTabular) {
    return "tabular"
  }

  return "generic"
}

function isHeaderLine(line: string): boolean {
  const lowerLine = line.toLowerCase()

  // Common header patterns
  const headerPatterns = [
    /^data\s/i,
    /^date\s/i,
    /^\s*data\s+.*\s+valor/i,
    /^\s*data\s+.*\s+descrição/i,
    /^histórico/i,
    /^lançamento/i,
    /^movimentação/i,
    /^extrato/i,
    /^saldo\s+(anterior|inicial)/i,
    /^[\s\-=_*]+$/,
    /^total\s/i,
  ]

  return headerPatterns.some((pattern) => pattern.test(lowerLine))
}

function parseLine(line: string, format: FileFormat): ParsedTransaction | null {
  // Strategy 1: Explicit ENTRADA/SAÍDA/DÉBITO/CRÉDITO in text
  const explicitResult = parseExplicitType(line)
  if (explicitResult) return explicitResult

  // Strategy 2: Tabular format with columns
  if (format === "tabular" || line.includes("\t")) {
    const tabularResult = parseTabular(line)
    if (tabularResult) return tabularResult
  }

  // Strategy 3: D/C indicator at end
  const dcResult = parseDCIndicator(line)
  if (dcResult) return dcResult

  // Strategy 4: Positive/negative value format
  const signedResult = parseSignedAmount(line)
  if (signedResult) return signedResult

  // Strategy 5: Generic parsing with keyword detection
  const genericResult = parseGeneric(line)
  if (genericResult) return genericResult

  return null
}

function parseExplicitType(line: string): ParsedTransaction | null {
  const lowerLine = line.toLowerCase()

  // Check for explicit type keywords
  let type: "income" | "expense" | null = null

  // Income indicators (order matters - check most specific first)
  const incomePatterns = [
    /\bentrada\b/i,
    /\bcrédito\b/i,
    /\bcredito\b/i,
    /\brecebido\b/i,
    /\brecebimento\b/i,
    /\bdepósito\b/i,
    /\bdeposito\b/i,
    /\btransferência\s+recebida\b/i,
    /\btransferencia\s+recebida\b/i,
    /\bpix\s+recebido\b/i,
    /\bted\s+recebido\b/i,
    /\bdoc\s+recebido\b/i,
    /\bresgat[e]?\b/i,
    /\bdevolu[çc][ãa]o\b/i,
    /\bestorno\b/i,
    /\bsalário\b/i,
    /\bsalario\b/i,
    /\breembolso\b/i,
  ]

  // Expense indicators
  const expensePatterns = [
    /\bsaída\b/i,
    /\bsaida\b/i,
    /\bdébito\b/i,
    /\bdebito\b/i,
    /\bpagamento\b/i,
    /\bpago\b/i,
    /\bcompra\b/i,
    /\btransferência\s+enviada\b/i,
    /\btransferencia\s+enviada\b/i,
    /\bpix\s+enviado\b/i,
    /\btransf\b/i,
    /\bted\s+enviado\b/i,
    /\bdoc\s+enviado\b/i,
    /\bsaque\b/i,
    /\btarifa\b/i,
    /\biof\b/i,
    /\bjuros\b/i,
    /\bcobrança\b/i,
    /\bcobranca\b/i,
    /\bboleto\b/i,
    /\bfatura\b/i,
  ]

  for (const pattern of incomePatterns) {
    if (pattern.test(lowerLine)) {
      type = "income"
      break
    }
  }

  if (!type) {
    for (const pattern of expensePatterns) {
      if (pattern.test(lowerLine)) {
        type = "expense"
        break
      }
    }
  }

  if (!type) return null

  // Extract date
  const date = extractDate(line)
  if (!date) return null

  // Extract amount
  const amount = extractAmount(line)
  if (!amount || amount === 0) return null

  // Extract description (remove date and amount from line)
  const description = extractDescription(line)
  if (!description) return null

  return {
    date,
    description,
    amount: Math.abs(amount),
    type,
    originalLine: line,
  }
}

function parseTabular(line: string): ParsedTransaction | null {
  // Split by tabs or multiple spaces
  const columns = line
    .split(/\t+|\s{2,}/)
    .map((c) => c.trim())
    .filter((c) => c)

  if (columns.length < 2) return null

  let date: string | null = null
  let description = ""
  let amount: number | null = null
  let type: "income" | "expense" = "expense"

  for (const col of columns) {
    // Try to identify what this column is
    const dateMatch = extractDate(col)
    if (dateMatch && !date) {
      date = dateMatch
      continue
    }

    const amountMatch = extractAmount(col)
    if (amountMatch !== null && amount === null) {
      amount = Math.abs(amountMatch)
      // If original had negative sign, it's expense
      if (col.includes("-") || col.toLowerCase().includes("d")) {
        type = "expense"
      } else if (col.includes("+") || col.toLowerCase().includes("c")) {
        type = "income"
      }
      continue
    }

    // Check for type indicators in column
    const lowerCol = col.toLowerCase()
    if (lowerCol === "entrada" || lowerCol === "crédito" || lowerCol === "credito" || lowerCol === "c") {
      type = "income"
      continue
    }
    if (
      lowerCol === "saída" ||
      lowerCol === "saida" ||
      lowerCol === "débito" ||
      lowerCol === "debito" ||
      lowerCol === "d"
    ) {
      type = "expense"
      continue
    }

    // Otherwise it's probably description
    if (col.length > 2 && !amountMatch) {
      description += (description ? " " : "") + col
    }
  }

  if (!date || !amount || !description) return null

  // Refine type based on description keywords
  type = refineType(description, type)

  return {
    date,
    description: cleanDescription(description),
    amount,
    type,
    originalLine: line,
  }
}

function parseDCIndicator(line: string): ParsedTransaction | null {
  // Look for D or C at end of line or after amount
  const dcMatch = line.match(/\s+([DC])\s*$/i) || line.match(/[\d,.]+\s*([DC])\b/i)

  if (!dcMatch) return null

  const indicator = dcMatch[1].toUpperCase()
  const type: "income" | "expense" = indicator === "C" ? "income" : "expense"

  const date = extractDate(line)
  if (!date) return null

  const amount = extractAmount(line)
  if (!amount) return null

  const description = extractDescription(line)
  if (!description) return null

  return {
    date,
    description,
    amount: Math.abs(amount),
    type,
    originalLine: line,
  }
}

function parseSignedAmount(line: string): ParsedTransaction | null {
  // Look for explicit + or - before/after amount
  const positiveMatch = line.match(/\+\s*R?\$?\s*([\d.,]+)/) || line.match(/R?\$?\s*([\d.,]+)\s*\+/)
  const negativeMatch = line.match(/-\s*R?\$?\s*([\d.,]+)/) || line.match(/R?\$?\s*([\d.,]+)\s*-/)

  let type: "income" | "expense"
  let amountStr: string

  if (positiveMatch) {
    type = "income"
    amountStr = positiveMatch[1]
  } else if (negativeMatch) {
    type = "expense"
    amountStr = negativeMatch[1]
  } else {
    return null
  }

  const date = extractDate(line)
  if (!date) return null

  // Parse amount
  const amount = parseAmount(amountStr)
  if (!amount) return null

  const description = extractDescription(line)
  if (!description) return null

  return {
    date,
    description,
    amount: Math.abs(amount),
    type,
    originalLine: line,
  }
}

function parseGeneric(line: string): ParsedTransaction | null {
  const date = extractDate(line)
  if (!date) return null

  const amount = extractAmount(line)
  if (!amount) return null

  const description = extractDescription(line)
  if (!description) return null

  // Determine type based on description keywords
  const type = refineType(description, "expense")

  return {
    date,
    description,
    amount: Math.abs(amount),
    type,
    originalLine: line,
  }
}

function extractDate(text: string): string | null {
  const patterns = [
    /(\d{2}\/\d{2}\/\d{4})/, // DD/MM/YYYY
    /(\d{4}-\d{2}-\d{2})/, // YYYY-MM-DD
    /(\d{2}-\d{2}-\d{4})/, // DD-MM-YYYY
    /(\d{2}\/\d{2}\/\d{2})/, // DD/MM/YY
    /(\d{2}\.\d{2}\.\d{4})/, // DD.MM.YYYY
  ]

  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) {
      return normalizeDate(match[1])
    }
  }

  return null
}

function normalizeDate(dateStr: string): string {
  // Convert to YYYY-MM-DD format

  // DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
  let match = dateStr.match(/(\d{2})[/\-.](\d{2})[/\-.](\d{4})/)
  if (match) {
    return `${match[3]}-${match[2]}-${match[1]}`
  }

  // DD/MM/YY
  match = dateStr.match(/(\d{2})\/(\d{2})\/(\d{2})/)
  if (match) {
    const year = Number.parseInt(match[3]) > 50 ? `19${match[3]}` : `20${match[3]}`
    return `${year}-${match[2]}-${match[1]}`
  }

  // Already YYYY-MM-DD
  if (/\d{4}-\d{2}-\d{2}/.test(dateStr)) {
    return dateStr
  }

  return dateStr
}

function extractAmount(text: string): number | null {
  // Remove date to avoid confusion
  const cleanText = text.replace(/\d{2}[/\-.]\d{2}[/\-.]\d{2,4}/g, "")

  // Amount patterns - ordered by specificity
  const patterns = [
    // With R$ symbol: R$ 1.234,56 or R$1234,56
    /R\$\s*([\d.,]+)/i,
    // Brazilian format with thousands: 1.234,56
    /\b(\d{1,3}(?:\.\d{3})*,\d{2})\b/,
    // Simple Brazilian format: 1234,56 or 123,45
    /\b(\d+,\d{2})\b/,
    // International format with decimals: 1234.56
    /\b(\d+\.\d{2})\b/,
  ]

  for (const pattern of patterns) {
    const match = cleanText.match(pattern)
    if (match) {
      return parseAmount(match[1])
    }
  }

  return null
}

function parseAmount(amountStr: string): number | null {
  let clean = amountStr.replace(/[R$\s]/gi, "")

  // Brazilian format: 1.234,56 -> 1234.56
  if (clean.includes(",")) {
    clean = clean.replace(/\./g, "").replace(",", ".")
  }

  const num = Number.parseFloat(clean)
  return isNaN(num) || num === 0 ? null : num
}

function extractDescription(line: string): string {
  let desc = line

  // Remove dates
  desc = desc.replace(/\d{2}[/\-.]\d{2}[/\-.]\d{2,4}/g, "")

  // Remove amounts (various formats)
  desc = desc.replace(/R\$\s*[\d.,]+/gi, "")
  desc = desc.replace(/\b\d{1,3}(?:\.\d{3})*,\d{2}\b/g, "")
  desc = desc.replace(/\b\d+,\d{2}\b/g, "")

  // Remove D/C indicators at end
  desc = desc.replace(/\s+[DC]\s*$/i, "")

  // Remove common separators
  desc = desc.replace(/^[\s\-|;:]+|[\s\-|;:]+$/g, "")
  desc = desc.replace(/\s+/g, " ")

  return cleanDescription(desc.trim())
}

function cleanDescription(desc: string): string {
  return desc
    .replace(/\s+/g, " ")
    .replace(/^[\s\-|;:*]+|[\s\-|;:*]+$/g, "")
    .trim()
}

function refineType(description: string, defaultType: "income" | "expense"): "income" | "expense" {
  const lowerDesc = description.toLowerCase()

  // Strong income indicators
  const incomeKeywords = [
    "entrada",
    "crédito",
    "credito",
    "recebido",
    "recebimento",
    "depósito",
    "deposito",
    "salário",
    "salario",
    "transferência recebida",
    "transferencia recebida",
    "pix recebido",
    "ted recebido",
    "doc recebido",
    "resgate",
    "devolução",
    "devolucao",
    "estorno",
    "reembolso",
    "rendimento",
    "dividendo",
    "cashback",
  ]

  // Strong expense indicators
  const expenseKeywords = [
    "saída",
    "saida",
    "débito",
    "debito",
    "pagamento",
    "pago",
    "pgto",
    "compra",
    "transferência enviada",
    "transferencia enviada",
    "pix enviado",
    "ted enviado",
    "doc enviado",
    "saque",
    "tarifa",
    "iof",
    "juros",
    "cobrança",
    "cobranca",
    "boleto",
    "fatura",
    "mensalidade",
    "assinatura",
    "uber",
    "99",
    "ifood",
    "rappi",
    "netflix",
    "spotify",
    "amazon",
    "google",
    "apple",
  ]

  for (const keyword of incomeKeywords) {
    if (lowerDesc.includes(keyword)) {
      return "income"
    }
  }

  for (const keyword of expenseKeywords) {
    if (lowerDesc.includes(keyword)) {
      return "expense"
    }
  }

  return defaultType
}
