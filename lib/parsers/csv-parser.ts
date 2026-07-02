export interface ParsedTransaction {
  date: string
  description: string
  amount: number
  type: "income" | "expense"
  originalLine?: string
}

export function parseCSV(content: string): ParsedTransaction[] {
  const lines = content.trim().split(/\r?\n/)
  const transactions: ParsedTransaction[] = []

  // Skip header line if detected
  const startIndex = isHeaderLine(lines[0]) ? 1 : 0

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    const parsed = parseCSVLine(line)
    if (parsed) {
      transactions.push(parsed)
    }
  }

  return transactions
}

function isHeaderLine(line: string): boolean {
  const lowerLine = line.toLowerCase()
  return (
    lowerLine.includes("data") ||
    lowerLine.includes("date") ||
    lowerLine.includes("descrição") ||
    lowerLine.includes("description") ||
    lowerLine.includes("valor") ||
    lowerLine.includes("value") ||
    lowerLine.includes("amount")
  )
}

function parseCSVLine(line: string): ParsedTransaction | null {
  // Try different delimiters
  const delimiters = [";", ",", "\t", "|"]

  for (const delimiter of delimiters) {
    const parts = line.split(delimiter).map((p) => p.trim().replace(/^["']|["']$/g, ""))

    if (parts.length >= 2) {
      const result = extractTransactionData(parts)
      if (result) {
        return { ...result, originalLine: line }
      }
    }
  }

  return null
}

function extractTransactionData(parts: string[]): Omit<ParsedTransaction, "originalLine"> | null {
  let date: string | null = null
  let description: string | null = null
  let amount: number | null = null

  for (const part of parts) {
    // Try to parse as date
    if (!date) {
      const parsedDate = parseDate(part)
      if (parsedDate) {
        date = parsedDate
        continue
      }
    }

    // Try to parse as amount
    if (amount === null) {
      const parsedAmount = parseAmount(part)
      if (parsedAmount !== null) {
        amount = parsedAmount
        continue
      }
    }

    // Otherwise, treat as description
    if (!description && part.length > 2) {
      description = part
    }
  }

  if (date && description && amount !== null) {
    return {
      date,
      description,
      amount: Math.abs(amount),
      type: amount < 0 ? "expense" : "income",
    }
  }

  return null
}

function parseDate(value: string): string | null {
  // Try DD/MM/YYYY
  const brDate = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (brDate) {
    const [, day, month, year] = brDate
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`
  }

  // Try YYYY-MM-DD
  const isoDate = value.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (isoDate) {
    return value
  }

  // Try MM/DD/YYYY
  const usDate = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (usDate) {
    const [, month, day, year] = usDate
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`
  }

  return null
}

function parseAmount(value: string): number | null {
  // Remove currency symbols and spaces
  let cleaned = value.replace(/[R$\s]/g, "").trim()

  // Handle Brazilian format (1.234,56)
  if (cleaned.includes(",") && cleaned.includes(".")) {
    if (cleaned.lastIndexOf(",") > cleaned.lastIndexOf(".")) {
      // Brazilian format: 1.234,56
      cleaned = cleaned.replace(/\./g, "").replace(",", ".")
    } else {
      // US format: 1,234.56
      cleaned = cleaned.replace(/,/g, "")
    }
  } else if (cleaned.includes(",")) {
    // Could be decimal comma: 123,45
    cleaned = cleaned.replace(",", ".")
  }

  // Handle negative values
  const isNegative = cleaned.startsWith("-") || cleaned.startsWith("(") || value.toLowerCase().includes("débito")
  cleaned = cleaned.replace(/[()+-]/g, "")

  const num = Number.parseFloat(cleaned)
  if (!isNaN(num)) {
    return isNegative ? -num : num
  }

  return null
}
