import type { ParsedTransaction } from "./types"
import { parseOFX } from "./ofx-parser"
import { parseTXT } from "./txt-parser"
import { parseXLSX } from "./xlsx-parser"

export type { ParsedTransaction }
export { determineTransactionType } from "./types"

export async function parseFile(content: string | ArrayBuffer, fileType: string): Promise<ParsedTransaction[]> {
  const type = fileType.toLowerCase()

  switch (type) {
    case "xlsx":
    case "xls":
      if (content instanceof ArrayBuffer) {
        return parseXLSX(content)
      }
      throw new Error("Arquivo Excel deve ser enviado como ArrayBuffer")
    case "txt":
    case "bbt":
      if (typeof content === "string") {
        return parseTXT(content)
      }
      throw new Error("Arquivo TXT deve ser enviado como string")
    case "ofx":
      if (typeof content === "string") {
        return parseOFX(content)
      }
      throw new Error("Arquivo OFX deve ser enviado como string")
    default:
      throw new Error(`Formato não suportado: ${type}`)
  }
}

export function detectDuplicates(
  newTransactions: ParsedTransaction[],
  existingTransactions: Array<{ date: string; description: string; amount: number }>,
): { unique: ParsedTransaction[]; duplicates: ParsedTransaction[] } {
  const unique: ParsedTransaction[] = []
  const duplicates: ParsedTransaction[] = []

  for (const transaction of newTransactions) {
    const isDuplicate = existingTransactions.some(
      (existing) =>
        existing.date === transaction.date &&
        normalizeDescription(existing.description) === normalizeDescription(transaction.description) &&
        Math.abs(existing.amount - transaction.amount) < 0.01,
    )

    if (isDuplicate) {
      duplicates.push(transaction)
    } else {
      unique.push(transaction)
    }
  }

  return { unique, duplicates }
}

function normalizeDescription(desc: string): string {
  return desc.toLowerCase().replace(/\s+/g, " ").trim()
}
