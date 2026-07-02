import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

// API to update challenge progress based on user actions
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { challengeType, value } = await req.json()

    // Get active challenges of this type for the user
    const activeChallenges = await sql`
      SELECT uc.*, c.challenge_type, c.target_value, c.reward_points, c.name
      FROM user_challenges uc
      JOIN challenges c ON uc.challenge_id = c.id
      WHERE uc.user_id = ${user.id} 
        AND uc.status = 'active'
        AND c.challenge_type = ${challengeType}
    `

    const completedChallenges = []

    for (const challenge of activeChallenges) {
      const newValue = Number(challenge.current_value) + value
      const targetValue = Number(challenge.target_value) || 1

      if (newValue >= targetValue) {
        // Challenge completed!
        await sql`
          UPDATE user_challenges 
          SET current_value = ${targetValue}, status = 'completed', completed_at = NOW()
          WHERE id = ${challenge.id}
        `

        // Award points
        await sql`
          INSERT INTO user_points (user_id, points, action_type, description)
          VALUES (${user.id}, ${challenge.reward_points}, 'challenge_complete', ${`Completou: ${challenge.name}`})
        `

        // Update total points
        await sql`
          UPDATE users SET total_points = total_points + ${challenge.reward_points}
          WHERE id = ${user.id}
        `

        completedChallenges.push({
          id: challenge.id,
          name: challenge.name,
          points: challenge.reward_points,
        })
      } else {
        // Update progress
        await sql`
          UPDATE user_challenges SET current_value = ${newValue}
          WHERE id = ${challenge.id}
        `
      }
    }

    return NextResponse.json({
      success: true,
      completedChallenges,
    })
  } catch (error) {
    console.error("Error updating challenge progress:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// GET - Calculate and return current progress for all active challenges
export async function GET(req: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get current month dates
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    // Get active challenges
    const activeChallenges = await sql`
      SELECT uc.*, c.challenge_type, c.target_value, c.name, c.target_category_id
      FROM user_challenges uc
      JOIN challenges c ON uc.challenge_id = c.id
      WHERE uc.user_id = ${user.id} AND uc.status = 'active'
    `

    // Calculate progress for each challenge type
    const progressUpdates = []

    for (const challenge of activeChallenges) {
      let calculatedProgress = 0

      switch (challenge.challenge_type) {
        case "save_amount": {
          // Calculate savings this month (income - expenses)
          const [incomeResult] = await sql`
            SELECT COALESCE(SUM(amount), 0) as total
            FROM incomes WHERE user_id = ${user.id}
            AND date >= ${startOfMonth.toISOString().split("T")[0]}
            AND date <= ${endOfMonth.toISOString().split("T")[0]}
          `
          const [expenseResult] = await sql`
            SELECT COALESCE(SUM(amount), 0) as total
            FROM expenses WHERE user_id = ${user.id}
            AND date >= ${startOfMonth.toISOString().split("T")[0]}
            AND date <= ${endOfMonth.toISOString().split("T")[0]}
          `
          calculatedProgress = Math.max(0, Number(incomeResult.total) - Number(expenseResult.total))
          break
        }

        case "streak": {
          // Count consecutive days with transactions
          const transactions = await sql`
            SELECT DISTINCT date FROM (
              SELECT date FROM expenses WHERE user_id = ${user.id} AND date >= ${challenge.start_date}
              UNION
              SELECT date FROM incomes WHERE user_id = ${user.id} AND date >= ${challenge.start_date}
            ) t ORDER BY date
          `
          calculatedProgress = transactions.length
          break
        }

        case "reduce_expense": {
          // Compare with previous month
          const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
          const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)

          const [prevExpenses] = await sql`
            SELECT COALESCE(SUM(amount), 0) as total
            FROM expenses WHERE user_id = ${user.id}
            AND date >= ${prevMonthStart.toISOString().split("T")[0]}
            AND date <= ${prevMonthEnd.toISOString().split("T")[0]}
          `
          const [currentExpenses] = await sql`
            SELECT COALESCE(SUM(amount), 0) as total
            FROM expenses WHERE user_id = ${user.id}
            AND date >= ${startOfMonth.toISOString().split("T")[0]}
            AND date <= ${endOfMonth.toISOString().split("T")[0]}
          `

          const prevTotal = Number(prevExpenses.total)
          const currentTotal = Number(currentExpenses.total)

          if (prevTotal > 0) {
            const reductionPercent = ((prevTotal - currentTotal) / prevTotal) * 100
            calculatedProgress = Math.max(0, reductionPercent)
          }
          break
        }

        case "pay_debt":
        case "pay_debt_amount": {
          // Sum debt payments in period
          const [payments] = await sql`
            SELECT COALESCE(SUM(dp.amount), 0) as total
            FROM debt_payments dp
            JOIN debts d ON dp.debt_id = d.id
            WHERE d.user_id = ${user.id}
            AND dp.payment_date >= ${challenge.start_date}
            AND dp.payment_date <= ${challenge.end_date}
          `
          calculatedProgress = Number(payments.total)
          break
        }

        case "no_category_spend": {
          // Check days without spending in specific categories (delivery, transport apps)
          const startDate = new Date(challenge.start_date)
          const today = new Date()
          const daysElapsed = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))

          // Check for spending on delivery/transport categories
          const categoryKeywords = ["delivery", "ifood", "uber", "99", "rappi", "uber eats"]
          const expenses = await sql`
            SELECT COUNT(*) as count FROM expenses
            WHERE user_id = ${user.id}
            AND date >= ${challenge.start_date}
            AND LOWER(description) SIMILAR TO ${`%(${categoryKeywords.join("|")})%`}
          `

          if (Number(expenses[0].count) === 0) {
            calculatedProgress = daysElapsed + 1
          } else {
            calculatedProgress = 0
          }
          break
        }

        case "invest": {
          // Count investments this month
          const [investments] = await sql`
            SELECT COUNT(*) as count FROM investments
            WHERE user_id = ${user.id}
            AND start_date >= ${startOfMonth.toISOString().split("T")[0]}
          `
          calculatedProgress = Number(investments.count)
          break
        }
      }

      // Update progress in database
      await sql`
        UPDATE user_challenges SET current_value = ${calculatedProgress}
        WHERE id = ${challenge.id}
      `

      progressUpdates.push({
        challengeId: challenge.challenge_id,
        name: challenge.name,
        currentValue: calculatedProgress,
        targetValue: Number(challenge.target_value) || 1,
      })
    }

    return NextResponse.json({ progress: progressUpdates })
  } catch (error) {
    console.error("Error calculating challenge progress:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
