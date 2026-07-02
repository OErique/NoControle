import type React from "react"
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { sql } from "@/lib/db"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { DashboardHeader } from "@/components/dashboard/header"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  if (!user.onboarding_completed) {
    redirect("/onboarding")
  }

  let planDetails = { name: "Essencial", slug: "essencial", modules_allowed: 1 }
  try {
    const planResult = await sql`
      SELECT p.name, p.slug, p.modules_allowed 
      FROM plans p
      JOIN users u ON u.plan_id = p.id
      WHERE u.id = ${user.id}
    `
    if (planResult.length > 0) {
      planDetails = {
        name: planResult[0].name,
        slug: planResult[0].slug,
        modules_allowed: planResult[0].modules_allowed,
      }
    }
  } catch {
    // Use default plan if error
  }

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar
        user={{
          ...user,
          plan_name: planDetails.name,
          plan_slug: planDetails.slug,
          modules_allowed: planDetails.modules_allowed,
        }}
      />
      <div className="flex flex-1 flex-col lg:pl-64">
        <DashboardHeader user={user} />
        <main className="flex-1 p-4 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
