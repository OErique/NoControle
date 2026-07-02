import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"
import { DebtsModule } from "@/components/debts/debts-module"

async function getDebtsData(userId: string) {
  // Get all debts with categories
  const debts = await sql`
    SELECT d.*, dc.name as category_name, dc.color as category_color, dc.icon as category_icon
    FROM debts d
    LEFT JOIN debt_categories dc ON d.category_id = dc.id
    WHERE d.user_id = ${userId}
    ORDER BY 
      CASE WHEN d.status = 'active' THEN 0 ELSE 1 END,
      d.interest_rate DESC,
      d.due_date ASC
  `

  const categories = await sql`
    SELECT DISTINCT ON (LOWER(TRIM(name))) *
    FROM debt_categories 
    ORDER BY LOWER(TRIM(name)), created_at
  `

  // Get summary stats
  const stats = await sql`
    SELECT 
      COALESCE(SUM(CASE WHEN status = 'active' THEN current_amount ELSE 0 END), 0) as total_active,
      COALESCE(SUM(CASE WHEN status = 'paid' THEN original_amount ELSE 0 END), 0) as total_paid,
      COUNT(CASE WHEN status = 'active' THEN 1 END) as active_count,
      COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid_count,
      COALESCE(AVG(CASE WHEN status = 'active' THEN interest_rate END), 0) as avg_interest
    FROM debts
    WHERE user_id = ${userId}
  `

  // Get payment history for chart
  const paymentHistory = await sql`
    SELECT 
      TO_CHAR(dp.payment_date, 'YYYY-MM') as month,
      SUM(dp.amount) as total_paid
    FROM debt_payments dp
    JOIN debts d ON dp.debt_id = d.id
    WHERE d.user_id = ${userId}
    AND dp.payment_date >= CURRENT_DATE - INTERVAL '6 months'
    GROUP BY TO_CHAR(dp.payment_date, 'YYYY-MM')
    ORDER BY month
  `

  return {
    debts,
    categories,
    stats: stats[0],
    paymentHistory,
  }
}

export default async function DebtsPage() {
  const user = await getCurrentUser()

  if (!user) {
    return null
  }

  const data = await getDebtsData(user.id)

  return <DebtsModule data={data} userId={user.id} />
}
