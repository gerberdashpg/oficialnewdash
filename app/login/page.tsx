"use client"

import React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"

const PG_LOGO = "https://i.imgur.com/9SXBWnB.png"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Lock, Mail } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Erro ao fazer login")
        setLoading(false)
        return
      }

      router.refresh()
      
      // Small delay to ensure cookies are set
      await new Promise(resolve => setTimeout(resolve, 100))
      
      if (data.user.role === "ADMIN" || data.user.role === "Administrador") {
        window.location.href = "/admin"
      } else if (data.user.client_slug) {
        window.location.href = `/dashboards/${data.user.client_slug}`
      } else {
        window.location.href = "/dashboard"
      }
    } catch {
      setError("Erro de conexão. Tente novamente.")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#07070A] p-4">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div 
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px]" 
          style={{ background: 'radial-gradient(ellipse at center, rgba(168,85,247,0.15), transparent 70%)' }} 
        />
        <div 
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px]" 
          style={{ background: 'radial-gradient(ellipse at center, rgba(124,58,237,0.1), transparent 70%)' }} 
        />
      </div>
      
      <Card className="w-full max-w-md relative z-10 border-[rgba(255,255,255,0.06)] bg-[#101018] backdrop-blur-xl shadow-[0_0_0_1px_rgba(168,85,247,0.08),0_25px_80px_rgba(0,0,0,0.7)] rounded-3xl">
        <CardHeader className="text-center space-y-4 pb-2">
          <Image 
            src={PG_LOGO || "/placeholder.svg"} 
            alt="Pro Growth" 
            width={64} 
            height={64} 
            className="mx-auto rounded-2xl shadow-lg shadow-[rgba(168,85,247,0.4)]"
          />
          <div>
            <CardTitle className="text-2xl font-bold text-[#F5F5F7] tracking-tight">PG Dash</CardTitle>
            <CardDescription className="text-[rgba(245,245,247,0.52)] mt-1">
              Entre com suas credenciais para acessar
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive" className="bg-[rgba(239,68,68,0.1)] border-[rgba(239,68,68,0.3)] text-[#EF4444]">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[rgba(245,245,247,0.72)]">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgba(245,245,247,0.32)]" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pl-10 bg-[#141424] border-[rgba(255,255,255,0.06)] text-[#F5F5F7] placeholder:text-[rgba(245,245,247,0.32)] focus:border-[#A855F7] focus:ring-2 focus:ring-[rgba(168,85,247,0.15)] rounded-xl h-11"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-[rgba(245,245,247,0.72)]">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgba(245,245,247,0.32)]" />
                <Input
                  id="password"
                  type="password"
                  placeholder="********"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pl-10 bg-[#141424] border-[rgba(255,255,255,0.06)] text-[#F5F5F7] placeholder:text-[rgba(245,245,247,0.32)] focus:border-[#A855F7] focus:ring-2 focus:ring-[rgba(168,85,247,0.15)] rounded-xl h-11"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#A855F7] to-[#7C3AED] hover:from-[#9333EA] hover:to-[#6D28D9] text-white font-semibold h-12 rounded-xl shadow-lg shadow-[rgba(168,85,247,0.3)] transition-all duration-200 active:scale-[0.98]"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Entrando...
                </>
              ) : (
                "Entrar"
              )}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-[rgba(255,255,255,0.06)]">
            <p className="text-xs text-[rgba(245,245,247,0.42)] text-center">
              Plataforma segura com criptografia de ponta a ponta
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
