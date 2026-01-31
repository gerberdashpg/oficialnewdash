import { getSession } from "@/lib/auth"
import { sql } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session || (session.role !== "ADMIN" && session.role !== "Administrador")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  try {
    const roleResult = await sql`
      SELECT id, name, description, color, is_system as is_system_role, created_at, updated_at
      FROM roles
      WHERE id = ${id}
    `

    if (roleResult.length === 0) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 })
    }

    const rolePerms = await sql`
      SELECT p.id, p.code, p.name, p.category
      FROM role_permissions rp
      JOIN permissions p ON rp.permission_id = p.id
      WHERE rp.role_id = ${id}
    `

    const role = {
      ...roleResult[0],
      permissions: rolePerms
    }

    return NextResponse.json({ role })
  } catch (error) {
    console.error("Error fetching role:", error)
    return NextResponse.json({ error: "Failed to fetch role" }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session || (session.role !== "ADMIN" && session.role !== "Administrador")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  try {
    // Check if role exists and is not a system role
    const existingRole = await sql`SELECT id, is_system as is_system_role FROM roles WHERE id = ${id}`
    if (existingRole.length === 0) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 })
    }

    const body = await request.json()
    const { name, description, color, permissions } = body

    if (!name) {
      return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 })
    }

    // Check if another role has the same name
    const duplicateName = await sql`
      SELECT id FROM roles WHERE LOWER(name) = LOWER(${name}) AND id <> ${id}
    `
    if (duplicateName.length > 0) {
      return NextResponse.json({ error: "Já existe outra role com esse nome" }, { status: 400 })
    }

    // Update the role (allow updating system roles but with restrictions)
    await sql`
      UPDATE roles 
      SET name = ${name}, description = ${description || null}, color = ${color || '#6B7280'}, updated_at = NOW()
      WHERE id = ${id}
    `

    // Update permissions - remove all existing and add new ones
    await sql`DELETE FROM role_permissions WHERE role_id = ${id}`
    
    if (permissions && permissions.length > 0) {
      for (const permissionId of permissions) {
        await sql`
          INSERT INTO role_permissions (role_id, permission_id)
          VALUES (${id}, ${permissionId})
          ON CONFLICT DO NOTHING
        `
      }
    }

    // Fetch the updated role
    const updatedRole = await sql`
      SELECT id, name, description, color, is_system as is_system_role, created_at, updated_at
      FROM roles
      WHERE id = ${id}
    `

    // Fetch permissions
    const rolePerms = await sql`
      SELECT p.id, p.code, p.name, p.category
      FROM role_permissions rp
      JOIN permissions p ON rp.permission_id = p.id
      WHERE rp.role_id = ${id}
    `

    const roleWithPermissions = {
      ...updatedRole[0],
      permissions: rolePerms
    }

    return NextResponse.json({ role: roleWithPermissions })
  } catch (error) {
    console.error("Error updating role:", error)
    return NextResponse.json({ error: "Failed to update role" }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session || (session.role !== "ADMIN" && session.role !== "Administrador")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  try {
    // Check if role exists and is not a system role
    const existingRole = await sql`SELECT id, is_system as is_system_role FROM roles WHERE id = ${id}`
    if (existingRole.length === 0) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 })
    }

    if (existingRole[0].is_system_role) {
      return NextResponse.json({ error: "Não é possível excluir roles do sistema" }, { status: 400 })
    }

    // Check if role is assigned to any users
    const usersWithRole = await sql`SELECT COUNT(*) as count FROM user_roles WHERE role_id = ${id}`
    if (usersWithRole[0].count > 0) {
      return NextResponse.json({ 
        error: "Não é possível excluir esta role pois está atribuída a usuários" 
      }, { status: 400 })
    }

    // Delete role permissions first
    await sql`DELETE FROM role_permissions WHERE role_id = ${id}`
    
    // Delete the role
    await sql`DELETE FROM roles WHERE id = ${id}`

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting role:", error)
    return NextResponse.json({ error: "Failed to delete role" }, { status: 500 })
  }
}
