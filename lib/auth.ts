import { cookies } from "next/headers"
import { sql, type User, type Client } from "./db"
import bcrypt from "bcryptjs"

const SESSION_COOKIE = "pg_dash_session"

export interface SessionUser {
  id: string
  name: string
  email: string
  role: "ADMIN" | "CLIENTE"
  client_id: string | null
  avatar_url?: string
  client?: {
    id: string
    name: string
    slug: string
    plan: string
    status: string
    drive_link: string | null
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export async function createSession(userId: string): Promise<string> {
  const sessionId = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

  try {
    await sql`
      INSERT INTO sessions (id, user_id, expires_at)
      VALUES (${sessionId}, ${userId}, ${expiresAt.toISOString()})
    `
  } catch {
    // Sessions table might not exist, use simple cookie-based auth
  }

  const cookieStore = await cookies()
  const cookieValue = `${userId}:${sessionId}`
  
  cookieStore.set(SESSION_COOKIE, cookieValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  })

  return sessionId
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get(SESSION_COOKIE)

  if (!sessionCookie?.value) {
    return null
  }

  const [userId] = sessionCookie.value.split(":")

  if (!userId) {
    return null
  }

  try {
    const result = await sql`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.role,
        u.client_id,
        u.avatar_url,
        c.id as client_id_ref,
        c.name as client_name,
        c.slug as client_slug,
        c.plan as client_plan,
        c.status as client_status,
        c.drive_link as client_drive_link
      FROM users u
      LEFT JOIN clients c ON u.client_id = c.id
      WHERE u.id = ${userId}
    `

    if (result.length === 0) {
      return null
    }

    const user = result[0]

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      client_id: user.client_id,
      avatar_url: user.avatar_url,
      client: user.client_id
        ? {
            id: user.client_id_ref,
            name: user.client_name,
            slug: user.client_slug,
            plan: user.client_plan,
            status: user.client_status,
            drive_link: user.client_drive_link,
          }
        : undefined,
    }
  } catch (error) {
    console.error("Error getting session:", error)
    return null
  }
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE)
}

export async function authenticateUser(email: string, password: string): Promise<(User & { client_slug?: string }) | null> {
  try {
    const result = await sql`
      SELECT u.*, c.slug as client_slug 
      FROM users u 
      LEFT JOIN clients c ON u.client_id = c.id
      WHERE u.email = ${email}
    `

    if (result.length === 0) {
      return null
    }

    const user = result[0] as User & { client_slug?: string }

    // Verify password with bcrypt
    let isValid = false
    
    try {
      isValid = await bcrypt.compare(password, user.password_hash)
    } catch {
      // Fallback for plain text passwords (testing only)
      isValid = password === user.password_hash
    }

    // Fallback for plain text passwords stored in database (testing only)
    if (!isValid && password === user.password_hash) {
      isValid = true
    }

    if (!isValid) {
      return null
    }

    return user
  } catch (error) {
    console.error("Error authenticating user:", error)
    return null
  }
}
