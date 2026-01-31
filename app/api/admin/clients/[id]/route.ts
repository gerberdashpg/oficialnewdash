import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { sql } from "@/lib/db"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await getSession()

  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const result = await sql`SELECT * FROM clients WHERE id = ${id}`
    
    if (result.length === 0) {
      return NextResponse.json({ error: "Cliente nao encontrado" }, { status: 404 })
    }

    return NextResponse.json({ client: result[0] })
  } catch (error) {
    console.error("Error fetching client:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await getSession()

  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { name, slug, plan, status, drive_link, notes } = await request.json()

    if (!name || !slug) {
      return NextResponse.json(
        { error: "Nome e slug sao obrigatorios" },
        { status: 400 }
      )
    }

    // Check if slug already exists for another client
    const existingSlug = await sql`SELECT id FROM clients WHERE slug = ${slug} AND id <> ${id}`
    if (existingSlug.length > 0) {
      return NextResponse.json(
        { error: "Ja existe outro cliente com esse slug" },
        { status: 400 }
      )
    }

    const result = await sql`
      UPDATE clients 
      SET name = ${name}, 
          slug = ${slug}, 
          plan = ${plan}, 
          status = ${status}, 
          drive_link = ${drive_link || null}, 
          notes = ${notes || null},
          updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Cliente nao encontrado" }, { status: 404 })
    }

    return NextResponse.json({ client: result[0] })
  } catch (error) {
    console.error("Error updating client:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await getSession()

  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Delete related data first (cascade)
    await sql`DELETE FROM notices WHERE client_id = ${id}`
    await sql`DELETE FROM accesses WHERE client_id = ${id}`
    await sql`DELETE FROM sessions WHERE user_id IN (SELECT id FROM users WHERE client_id = ${id})`
    await sql`DELETE FROM users WHERE client_id = ${id}`
    
    // Delete the client
    const result = await sql`DELETE FROM clients WHERE id = ${id} RETURNING id`

    if (result.length === 0) {
      return NextResponse.json({ error: "Cliente nao encontrado" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting client:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
