import { neon } from "@neondatabase/serverless"

let _sql: ReturnType<typeof neon> | null = null
export type DbRow = any

function getSql() {
  if (!_sql) {
    const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL
    if (!connectionString) {
      throw new Error("DATABASE_URL or POSTGRES_URL environment variable is not set")
    }
    _sql = neon(connectionString)
  }
  return _sql
}

export const sql = <T = DbRow>(strings: TemplateStringsArray, ...values: unknown[]): Promise<T[]> => {
  return getSql()(strings, ...values) as Promise<T[]>
}

export type User = {
  id: string
  email: string
  name: string | null
  avatar_url: string | null
  monthly_income: number | null
  has_debts: boolean
  main_goal: string | null
  onboarding_completed: boolean
  plan_id: string | null
  plan_expires_at: string | null
  created_at: string
  updated_at: string
}

export type Plan = {
  id: string
  name: string
  description: string | null
  price: number
  modules_allowed: number
  features: string[]
  created_at: string
  updated_at: string
}

export type Debt = {
  id: string
  user_id: string
  category_id: string | null
  creditor: string
  original_amount: number
  current_amount: number
  interest_rate: number
  due_date: string | null
  minimum_payment: number | null
  status: "active" | "negotiating" | "paid"
  priority: number
  notes: string | null
  created_at: string
  updated_at: string
  category_name?: string
  category_color?: string
}

export type Income = {
  id: string
  user_id: string
  category_id: string | null
  description: string
  amount: number
  date: string
  is_recurring: boolean
  recurrence_type: string | null
  created_at: string
  updated_at: string
  category_name?: string
  category_color?: string
}

export type Expense = {
  id: string
  user_id: string
  category_id: string | null
  description: string
  amount: number
  date: string
  is_recurring: boolean
  recurrence_type: string | null
  created_at: string
  updated_at: string
  category_name?: string
  category_color?: string
}

export type Investment = {
  id: string
  user_id: string
  type_id: string | null
  name: string
  institution: string | null
  initial_amount: number
  current_amount: number
  expected_return: number | null
  start_date: string
  maturity_date: string | null
  status: "active" | "redeemed" | "matured"
  notes: string | null
  created_at: string
  updated_at: string
  type_name?: string
  type_color?: string
  risk_level?: string
}

export type FinancialGoal = {
  id: string
  user_id: string
  name: string
  target_amount: number
  current_amount: number
  target_date: string | null
  category: string
  status: "active" | "achieved" | "cancelled"
  created_at: string
  updated_at: string
}
