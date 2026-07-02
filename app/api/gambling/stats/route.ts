import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/session"


export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    // Get totals
    const [totals] = await sql`
      SELECT 
        COALESCE(SUM(amount_bet), 0) as total_bet,
        COALESCE(SUM(amount_won), 0) as total_won,
        COALESCE(SUM(amount_bet - amount_won), 0) as total_lost,
        COALESCE(SUM(amount_won - amount_bet), 0) as net_result,
        COUNT(*) as bet_count
      FROM gambling_bets
      WHERE user_id = ${user.id}
    `

    // Get monthly data
    const monthlyData = await sql`
      SELECT 
        TO_CHAR(bet_date, 'Mon') as month,
        COALESCE(SUM(amount_bet), 0) as bet,
        COALESCE(SUM(amount_won), 0) as won,
        COALESCE(SUM(CASE WHEN amount_bet > amount_won THEN amount_bet - amount_won ELSE 0 END), 0) as lost
      FROM gambling_bets
      WHERE user_id = ${user.id}
        AND bet_date >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '6 months')
      GROUP BY TO_CHAR(bet_date, 'Mon'), DATE_TRUNC('month', bet_date)
      ORDER BY DATE_TRUNC('month', bet_date)
    `

    // Get monthly limit
    const [alertSettings] = await sql`
      SELECT monthly_limit FROM gambling_alerts WHERE user_id = ${user.id}
    `

    return NextResponse.json({
      totalBet: Number(totals?.total_bet || 0),
      totalWon: Number(totals?.total_won || 0),
      totalLost: Number(totals?.total_lost || 0),
      netResult: Number(totals?.net_result || 0),
      betCount: Number(totals?.bet_count || 0),
      monthlyData: monthlyData.map((m) => ({
        month: m.month,
        bet: Number(m.bet),
        won: Number(m.won),
        lost: Number(m.lost),
      })),
      monthlyLimit: Number(alertSettings?.monthly_limit || 500),
    })
  } catch (error) {
    console.error("Error fetching gambling stats:", error)
    return NextResponse.json({
      totalBet: 0,
      totalWon: 0,
      totalLost: 0,
      netResult: 0,
      betCount: 0,
      monthlyData: [],
      monthlyLimit: 500,
    })
  }
}
