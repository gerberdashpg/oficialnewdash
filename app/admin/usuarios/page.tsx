import { getSession } from "@/lib/auth"
import { sql } from "@/lib/db"
import { redirect } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard/header"
import { UsersTable } from "@/components/admin/users-table"
import { Card } from "@/components/ui/card"

async function getUsers() {
  return sql`
    SELECT 
      u.*,
      c.name as client_name,
      c.slug as client_slug
    FROM users u
    LEFT JOIN clients c ON u.client_id = c.id
    ORDER BY u.created_at DESC
  `
}

async function getClients() {
  return sql`SELECT id, name FROM clients ORDER BY name ASC`
}

async function getRoles() {
  return sql`SELECT id, name, color FROM roles ORDER BY is_system DESC, name ASC`
}

export default async function AdminUsersPage() {
  const session = await getSession()

  if (!session || session.role !== "ADMIN") {
    redirect("/login")
  }

  const [users, clients, roles] = await Promise.all([
    getUsers(),
    getClients(),
    getRoles(),
  ])

  return (
    <div className="min-h-screen">
      <div className="p-4 sm:p-6">
        <DashboardHeader
          title="Usuários"
          subtitle="Gerencie todos os usuários da plataforma"
        />
      </div>

      <div className="px-4 sm:px-6 pb-6">
        <Card className="bg-[#0D0D12] border-purple-500/20 overflow-hidden">
          <UsersTable users={users} clients={clients} roles={roles} />
        </Card>
      </div>
    </div>
  )
}
