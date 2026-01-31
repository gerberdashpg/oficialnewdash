import { getSession } from "@/lib/auth"
import { sql } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET() {
  const session = await getSession()
  if (!session || (session.role !== "ADMIN" && session.role !== "Administrador")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const permissions = await sql`
      SELECT id, code, name, description, category
      FROM permissions
      ORDER BY category, name
    `
    
    // Group permissions by category
    const grouped: Record<string, Array<{id: string, code: string, name: string, description: string | null, category: string}>> = {}
    for (const perm of permissions) {
      const category = perm.category
      if (!grouped[category]) {
        grouped[category] = []
      }
      grouped[category].push(perm)
    }

    return NextResponse.json({ permissions, grouped })
  } catch (error) {
    console.error("Error fetching permissions:", error)
    return NextResponse.json({ error: "Failed to fetch permissions" }, { status: 500 })
  }
}
