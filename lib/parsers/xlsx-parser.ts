import * as XLSX from "xlsx"
import type { ParsedTransaction } from "./types"
import { determineTransactionType } from "./types"

export function parseXLSX(buffer: ArrayBuffer): ParsedTransaction[] {
  const workbook = XLSX.read(buffer, { type: "array", cellDates: true })
  const transactions: ParsedTransaction[] = []

  // Process first sheet
  const sheetName = workbook.SheetNames[0]
  const sheet = workbook.Sheets[sheetName]

  // Convert to JSON with header detection
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { raw: false })

  if (rows.length === 0) return transactions

  // Detect columns by analyzing headers
  const headers = Object.keys(rows[0])
  const columnMap = detectColumns(headers)

  for (const row of rows) {
    const parsed = parseRow(row, columnMap)
    if (parsed) {
      transactions.push(parsed)
    }
  }

  return transactions
}

interface ColumnMap {
  date: string | null
  description: string | null
  amount: string | null
  debit: string | null
  credit: string | null
  type: string | null
}

function detectColumns(headers: string[]): ColumnMap {
  const map: ColumnMap = {
    date: null,
    description: null,
    amount: null,
    debit: null,
    credit: null,
    type: null,
  }

  for (const header of headers) {
    const h = header.toLowerCase().trim()

    // Date columns
    if (
      !map.date &&
      (h.includes("data") ||
        h.includes("date") ||
        h.includes("dt") ||
        h === "dia" ||
        h.includes("vencimento") ||
        h.includes("lancamento") ||
        h.includes("lançamento"))
    ) {
      map.date = header
    }

    // Description columns
    if (
      !map.description &&
      (h.includes("descri") ||
        h.includes("histórico") ||
        h.includes("historico") ||
        h.includes("memo") ||
        h.includes("detalhe") ||
        h.includes("lancamento") ||
        h.includes("lançamento") ||
        h.includes("observ") ||
        h.includes("referencia") ||
        h === "nome" ||
        h === "titulo" ||
        h === "título")
    ) {
      map.description = header
    }

    // Combined amount column
    if (
      !map.amount &&
      (h === "valor" ||
        h === "value" ||
        h === "amount" ||
        h === "quantia" ||
        (h.includes("saldo") === false && h.includes("valor")))
    ) {
      map.amount = header
    }

    // Separate debit column
    if (
      !map.debit &&
      (h.includes("débito") ||
        h.includes("debito") ||
        h === "deb" ||
        h.includes("saída") ||
        h.includes("saida") ||
        h === "d")
    ) {
      map.debit = header
    }

    // Separate credit column
    if (
      !map.credit &&
      (h.includes("crédito") || h.includes("credito") || h === "cred" || h.includes("entrada") || h === "c")
    ) {
      map.credit = header
    }

    // Type indicator column
    if (
      !map.type &&
      (h === "tipo" || h === "type" || h === "d/c" || h === "dc" || h.includes("natureza") || h.includes("movimento"))
    ) {
      map.type = header
    }
  }

  return map
}

function parseRow(row: Record<string, unknown>, map: ColumnMap): ParsedTransaction | null {
  // Extract date
  let date: string | null = null
  if (map.date && row[map.date]) {
    date = parseDate(row[map.date])
  }
  if (!date) return null

  // Extract description
  let description = ""
  if (map.description && row[map.description]) {
    description = String(row[map.description]).trim()
  }
  if (!description || description.length < 2) return null

  // Extract amount and determine type
  let amount: number | null = null
  let type: "income" | "expense" = "expense"

  // Check for separate debit/credit columns first (most reliable)
  if (map.debit && map.credit) {
    const debitVal = parseAmount(row[map.debit])
    const creditVal = parseAmount(row[map.credit])

    if (debitVal && debitVal > 0) {
      amount = debitVal
      type = "expense"
    } else if (creditVal && creditVal > 0) {
      amount = creditVal
      type = "income"
    }
  }

  // Check combined amount column
  if (amount === null && map.amount && row[map.amount]) {
    const rawAmount = parseAmount(row[map.amount])
    if (rawAmount !== null) {
      amount = Math.abs(rawAmount)

      // Check type indicator column
      if (map.type && row[map.type]) {
        const typeVal = String(row[map.type]).toLowerCase().trim()
        if (typeVal === "d" || typeVal.includes("déb") || typeVal.includes("deb") || typeVal.includes("saída")) {
          type = "expense"
        } else if (
          typeVal === "c" ||
          typeVal.includes("créd") ||
          typeVal.includes("cred") ||
          typeVal.includes("entrada")
        ) {
          type = "income"
        } else {
          type = determineTransactionType(description, rawAmount)
        }
      } else {
        type = determineTransactionType(description, rawAmount)
      }
    }
  }

  if (amount === null || amount === 0) return null

  return {
    date,
    description,
    amount,
    type,
    originalLine: JSON.stringify(row),
  }
}

function parseDate(value: unknown): string | null {
  if (!value) return null

  // Handle Date objects (from XLSX cellDates option)
  if (value instanceof Date) {
    const year = value.getFullYear()
    const month = String(value.getMonth() + 1).padStart(2, "0")
    const day = String(value.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
  }

  const str = String(value).trim()

  // Try DD/MM/YYYY (Brazilian format)
  const brMatch = str.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/)
  if (brMatch) {
    const [, day, month, year] = brMatch
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`
  }

  // Try YYYY-MM-DD (ISO format)
  const isoMatch = str.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/)
  if (isoMatch) {
    const [, year, month, day] = isoMatch
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`
  }

  // Try DD/MM/YY
  const shortMatch = str.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2})$/)
  if (shortMatch) {
    const [, day, month, shortYear] = shortMatch
    const year = Number(shortYear) > 50 ? `19${shortYear}` : `20${shortYear}`
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`
  }

  return null
}

function parseAmount(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null

  let str = String(value).trim()

  // Remove currency symbols and spaces
  str = str.replace(/[R$\s]/gi, "")

  // Handle empty after cleanup
  if (!str || str === "-") return null

  // Check for negative indicators
  const isNegative = str.startsWith("-") || str.startsWith("(") || str.endsWith("-")
  str = str.replace(/[()+-]/g, "")

  // Handle Brazilian format (1.234,56)
  if (str.includes(",") && str.includes(".")) {
    if (str.lastIndexOf(",") > str.lastIndexOf(".")) {
      str = str.replace(/\./g, "").replace(",", ".")
    } else {
      str = str.replace(/,/g, "")
    }
  } else if (str.includes(",")) {
    str = str.replace(",", ".")
  }

  const num = Number.parseFloat(str)
  if (isNaN(num)) return null

  return isNegative ? -num : num
}
