import { getSession } from "@/lib/auth"
import { sql } from "@/lib/db"
import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session || (session.role !== "ADMIN" && session.role !== "Administrador")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const body = await request.json()
  const { name, email, password, role } = body

  try {
    // Check if email already exists for another user
    const existing = await sql`SELECT id FROM users WHERE email = ${email} AND id <> ${id}`
    if (existing.length > 0) {
      return NextResponse.json({ error: "Email already in use" }, { status: 400 })
    }

    let result
    if (password) {
      const password_hash = await bcrypt.hash(password, 10)
      result = await sql`
        UPDATE users 
        SET name = ${name}, email = ${email}, password_hash = ${password_hash}, role = ${role}, updated_at = NOW()
        WHERE id = ${id}
        RETURNING id, client_id, name, email, role, created_at, updated_at
      `
    } else {
      result = await sql`
        UPDATE users 
        SET name = ${name}, email = ${email}, role = ${role}, updated_at = NOW()
        WHERE id = ${id}
        RETURNING id, client_id, name, email, role, created_at, updated_at
      `
    }

    if (result.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("Error updating user:", error)
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 })
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
    // Don't allow deleting yourself
    if (session.userId === id) {
      return NextResponse.json({ error: "Cannot delete yourself" }, { status: 400 })
    }

    const result = await sql`
      DELETE FROM users WHERE id = ${id} RETURNING id
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting user:", error)
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 })
  }
}
