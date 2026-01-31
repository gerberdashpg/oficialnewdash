import { getSession } from "@/lib/auth"
import { sql } from "@/lib/db"
import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"

export async function GET() {
  const session = await getSession()
  if (!session || (session.role !== "ADMIN" && session.role !== "Administrador")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const users = await sql`
      SELECT id, client_id, name, email, role, avatar_url, created_at
      FROM users
      ORDER BY created_at DESC
    `
    return NextResponse.json({ users })
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const session = await getSession()
  if (!session || (session.role !== "ADMIN" && session.role !== "Administrador")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const { client_id, name, email, password, role } = body

  if (!name || !email || !password) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  // If role is not admin, client_id might be needed
  const isAdminRole = role === "ADMIN" || role === "Administrador"

  try {
    // Check if email already exists
    const existing = await sql`SELECT id FROM users WHERE email = ${email}`
    if (existing.length > 0) {
      return NextResponse.json({ error: "Email already exists" }, { status: 400 })
    }

    const password_hash = await bcrypt.hash(password, 10)
    const userRole = role || "Cliente"
    const userClientId = isAdminRole ? null : (client_id || null)
    
    const result = await sql`
      INSERT INTO users (client_id, name, email, password_hash, role)
      VALUES (${userClientId}, ${name}, ${email}, ${password_hash}, ${userRole})
      RETURNING id, client_id, name, email, role, created_at
    `

    return NextResponse.json({ user: result[0] }, { status: 201 })
  } catch (error) {
    console.error("Error creating user:", error)
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
  }
}
