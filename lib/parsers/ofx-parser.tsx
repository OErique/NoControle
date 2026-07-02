import type { ParsedTransaction } from "./types"
import { determineTransactionType } from "./types"

export function parseOFX(content: string): ParsedTransaction[] {
  const transactions: ParsedTransaction[] = []

  // Find all STMTTRN blocks (Statement Transactions)
  const transactionRegex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/gi
  const matches = content.matchAll(transactionRegex)

  for (const match of matches) {
    const block = match[1]
    const parsed = parseOFXTransaction(block)
    if (parsed) {
      transactions.push(parsed)
    }
  }

  // If no transactions found with closing tags, try without (OFX 1.x format)
  if (transactions.length === 0) {
    const ofx1Regex = /<STMTTRN>([\s\S]*?)(?=<STMTTRN>|<\/BANKTRANLIST>|<\/STMTRS>|$)/gi
    const ofx1Matches = content.matchAll(ofx1Regex)

    for (const match of ofx1Matches) {
      const block = match[1]
      const parsed = parseOFXTransaction(block)
      if (parsed) {
        transactions.push(parsed)
      }
    }
  }

  return transactions
}

function parseOFXTransaction(block: string): ParsedTransaction | null {
  // Extract fields - handle both OFX 1.x (SGML) and 2.x (XML) formats
  const trntype = extractOFXField(block, "TRNTYPE")
  const dtposted = extractOFXField(block, "DTPOSTED")
  const trnamt = extractOFXField(block, "TRNAMT")
  const memo = extractOFXField(block, "MEMO") || extractOFXField(block, "NAME") || ""
  const name = extractOFXField(block, "NAME") || ""

  if (!dtposted || !trnamt) return null

  // Parse date (YYYYMMDD or YYYYMMDDHHMMSS format)
  const date = parseOFXDate(dtposted)
  if (!date) return null

  // Parse amount
  const amount = parseOFXAmount(trnamt)
  if (amount === null || amount === 0) return null

  // Build description from available fields
  let description = memo || name
  if (memo && name && memo !== name) {
    description = `${name} - ${memo}`
  }
  description = description.trim()
  if (!description || description.length < 2) {
    description = trntype || "Transação"
  }

  // Determine transaction type
  let type: "income" | "expense"

  // OFX TRNTYPE values: CREDIT, DEBIT, INT, DIV, FEE, SRVCHG, DEP, ATM, POS, XFER, CHECK, PAYMENT, CASH, DIRECTDEP, DIRECTDEBIT, etc.
  const trnTypeLower = (trntype || "").toLowerCase()

  if (
    trnTypeLower === "credit" ||
    trnTypeLower === "dep" ||
    trnTypeLower === "directdep" ||
    trnTypeLower === "div" ||
    trnTypeLower === "int"
  ) {
    type = "income"
  } else if (
    trnTypeLower === "debit" ||
    trnTypeLower === "payment" ||
    trnTypeLower === "fee" ||
    trnTypeLower === "srvchg" ||
    trnTypeLower === "directdebit" ||
    trnTypeLower === "check" ||
    trnTypeLower === "atm" ||
    trnTypeLower === "pos" ||
    trnTypeLower === "cash"
  ) {
    type = "expense"
  } else if (amount > 0) {
    type = "income"
  } else if (amount < 0) {
    type = "expense"
  } else {
    type = determineTransactionType(description, amount)
  }

  return {
    date,
    description: cleanDescription(description),
    amount: Math.abs(amount),
    type,
    originalLine: block.substring(0, 200),
  }
}

function extractOFXField(block: string, fieldName: string): string | null {
  // Try XML format first: <FIELDNAME>value</FIELDNAME>
  const xmlRegex = new RegExp(`<${fieldName}>([^<]*)</${fieldName}>`, "i")
  const xmlMatch = block.match(xmlRegex)
  if (xmlMatch) return xmlMatch[1].trim()

  // Try SGML format: <FIELDNAME>value (no closing tag)
  const sgmlRegex = new RegExp(`<${fieldName}>([^<\\r\\n]+)`, "i")
  const sgmlMatch = block.match(sgmlRegex)
  if (sgmlMatch) return sgmlMatch[1].trim()

  return null
}

function parseOFXDate(dateStr: string): string | null {
  // OFX date format: YYYYMMDD or YYYYMMDDHHMMSS or YYYYMMDDHHMMSS[timezone]
  const cleaned = dateStr.replace(/\[.*\]/, "").trim()

  if (cleaned.length >= 8) {
    const year = cleaned.substring(0, 4)
    const month = cleaned.substring(4, 6)
    const day = cleaned.substring(6, 8)

    // Validate
    const y = Number.parseInt(year)
    const m = Number.parseInt(month)
    const d = Number.parseInt(day)

    if (y >= 1990 && y <= 2100 && m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      return `${year}-${month}-${day}`
    }
  }

  return null
}

function parseOFXAmount(amountStr: string): number | null {
  // OFX amounts can be negative with minus sign, and use period as decimal separator
  let cleaned = amountStr.trim()

  // Remove any currency symbols
  cleaned = cleaned.replace(/[R$]/gi, "")

  // Handle comma as decimal (some Brazilian banks)
  if (cleaned.includes(",") && !cleaned.includes(".")) {
    cleaned = cleaned.replace(",", ".")
  } else if (cleaned.includes(",") && cleaned.includes(".")) {
    // Brazilian format: 1.234,56
    if (cleaned.lastIndexOf(",") > cleaned.lastIndexOf(".")) {
      cleaned = cleaned.replace(/\./g, "").replace(",", ".")
    }
  }

  const amount = Number.parseFloat(cleaned)
  return isNaN(amount) ? null : amount
}

function cleanDescription(desc: string): string {
  return desc
    .replace(/\s+/g, " ")
    .replace(/[*#]+/g, "")
    .replace(/^\s*[-:]\s*/, "")
    .trim()
}
