import { getSession } from "@/lib/auth"
import { sql } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET() {
  const session = await getSession()
  if (!session || (session.role !== "ADMIN" && session.role !== "Administrador")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Get all roles
    const rolesData = await sql`
      SELECT id, name, description, color, is_system as is_system_role, created_at, updated_at
      FROM roles
      ORDER BY is_system DESC, name ASC
    `
    
    // Get all role permissions with permission details
    const rolePermissions = await sql`
      SELECT rp.role_id, p.id, p.code, p.name, p.category
      FROM role_permissions rp
      JOIN permissions p ON rp.permission_id = p.id
    `
    
    // Group permissions by role
    const permissionsByRole: Record<string, Array<{id: string, code: string, name: string, category: string}>> = {}
    for (const rp of rolePermissions) {
      if (!permissionsByRole[rp.role_id]) {
        permissionsByRole[rp.role_id] = []
      }
      permissionsByRole[rp.role_id].push({
        id: rp.id,
        code: rp.code,
        name: rp.name,
        category: rp.category
      })
    }
    
    // Combine roles with their permissions
    const roles = rolesData.map(role => ({
      ...role,
      permissions: permissionsByRole[role.id] || []
    }))
    
    return NextResponse.json({ roles })
  } catch (error) {
    console.error("Error fetching roles:", error)
    return NextResponse.json({ error: "Failed to fetch roles" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const session = await getSession()
  if (!session || (session.role !== "ADMIN" && session.role !== "Administrador")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { name, description, color, permissions } = body

    if (!name) {
      return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 })
    }

    // Check if role name already exists
    const existing = await sql`SELECT id FROM roles WHERE LOWER(name) = LOWER(${name})`
    if (existing.length > 0) {
      return NextResponse.json({ error: "Já existe uma role com esse nome" }, { status: 400 })
    }

    // Create the role
    const roleResult = await sql`
      INSERT INTO roles (name, description, color)
      VALUES (${name}, ${description || null}, ${color || '#6B7280'})
      RETURNING id, name, description, color, is_system as is_system_role, created_at
    `
    const newRole = roleResult[0]

    // Add permissions if provided
    if (permissions && permissions.length > 0) {
      for (const permissionId of permissions) {
        await sql`
          INSERT INTO role_permissions (role_id, permission_id)
          VALUES (${newRole.id}, ${permissionId})
          ON CONFLICT DO NOTHING
        `
      }
    }

    // Fetch the role's permissions
    const rolePerms = await sql`
      SELECT p.id, p.code, p.name, p.category
      FROM role_permissions rp
      JOIN permissions p ON rp.permission_id = p.id
      WHERE rp.role_id = ${newRole.id}
    `

    const roleWithPermissions = {
      ...newRole,
      permissions: rolePerms
    }

    return NextResponse.json({ role: roleWithPermissions }, { status: 201 })
  } catch (error) {
    console.error("Error creating role:", error)
    return NextResponse.json({ error: "Failed to create role" }, { status: 500 })
  }
}
