import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/session"


export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    // Check if table exists
    const tableCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'shared_profiles'
      )
    `

    if (!tableCheck[0]?.exists) {
      return NextResponse.json({ profile: null, hasAccess: false })
    }

    // Get user's plan
    const userPlan = await sql`
      SELECT p.slug as plan_slug FROM users u
      LEFT JOIN plans p ON u.plan_id = p.id
      WHERE u.id = ${user.id}
    `

    const userHasTotalPlan = userPlan[0]?.plan_slug === "total"

    // Check if user is owner or partner of an accepted profile
    const profiles = await sql`
      SELECT 
        sp.*,
        owner.name as owner_name,
        owner.email as owner_email,
        owner.avatar_url as owner_avatar,
        owner.total_points as owner_points,
        partner.name as partner_name,
        partner.email as partner_email,
        partner.avatar_url as partner_avatar,
        partner.total_points as partner_points,
        owner_plan.slug as owner_plan_slug,
        partner_plan.slug as partner_plan_slug
      FROM shared_profiles sp
      LEFT JOIN users owner ON sp.owner_user_id = owner.id
      LEFT JOIN users partner ON sp.partner_user_id = partner.id
      LEFT JOIN plans owner_plan ON owner.plan_id = owner_plan.id
      LEFT JOIN plans partner_plan ON partner.plan_id = partner_plan.id
      WHERE (sp.owner_user_id = ${user.id} OR sp.partner_user_id = ${user.id})
        AND sp.status = 'accepted'
        AND sp.ended_at IS NULL
      LIMIT 1
    `

    const profile = profiles[0]

    if (!profile) {
      return NextResponse.json({
        profile: null,
        hasAccess: userHasTotalPlan,
        userPlan: userPlan[0]?.plan_slug || "essencial",
      })
    }

    // Check if user has access (either owns total plan or is invited by someone who does)
    const isOwner = profile.owner_user_id === user.id
    const ownerHasTotalPlan = profile.owner_plan_slug === "total"
    const partnerHasTotalPlan = profile.partner_plan_slug === "total"

    const hasAccess = ownerHasTotalPlan || partnerHasTotalPlan

    // Determine partner info based on who the current user is
    const partnerInfo = isOwner
      ? {
          id: profile.partner_user_id,
          name: profile.partner_name,
          email: profile.partner_email,
          avatar: profile.partner_avatar,
          points: profile.partner_points,
        }
      : {
          id: profile.owner_user_id,
          name: profile.owner_name,
          email: profile.owner_email,
          avatar: profile.owner_avatar,
          points: profile.owner_points,
        }

    return NextResponse.json({
      profile: {
        ...profile,
        partner: partnerInfo,
        isOwner,
      },
      hasAccess,
      userPlan: userPlan[0]?.plan_slug || "essencial",
    })
  } catch (error) {
    console.error("Error fetching shared profile:", error)
    return NextResponse.json({ profile: null, hasAccess: false })
  }
}
