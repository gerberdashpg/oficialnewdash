import React from "react"
import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()

  if (!session) {
    redirect("/login")
  }

  // Only admins can access
  if (session.role !== "ADMIN" && session.role !== "Administrador") {
    redirect("/dashboard")
  }

  return (
    <DashboardShell user={session}>
      {children}
    </DashboardShell>
  )
}
