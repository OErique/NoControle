import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value)
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "-"

  try {
    const dateObj = new Date(date)
    if (isNaN(dateObj.getTime())) return "-"

    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(dateObj)
  } catch {
    return "-"
  }
}

export function formatPercent(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "percent",
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  }).format(value / 100)
}

export function getFinancialStatus(balance: number, debts: number): "green" | "yellow" | "red" {
  if (debts > balance * 2) return "red"
  if (debts > balance * 0.5) return "yellow"
  return "green"
}
