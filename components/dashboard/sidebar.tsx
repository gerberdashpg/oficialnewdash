"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

const PG_LOGO = "https://i.imgur.com/9SXBWnB.png"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  LayoutDashboard,
  Key,
  Bell,
  FolderOpen,
  LogOut,
  Users,
  Building2,
  Settings,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Map,
  User,
  MousePointer2,
  ImageIcon,
  FileText,
  Shield,
} from "lucide-react"
import { useSidebar } from "./sidebar-context"

interface SidebarProps {
  user: {
    name: string
    email: string
    role: "ADMIN" | "CLIENTE"
    avatar_url?: string
    client?: {
      name: string
      slug: string
      plan: string
    }
  }
  slug?: string
  hasWeeklyReports?: boolean
}

const getClientNavItems = (slug: string) => [
  { href: `/dashboards/${slug}`, label: "Dashboard", icon: LayoutDashboard },
  { href: `/dashboards/${slug}/mapa`, label: "Mapa da Operação", icon: Map },
  { href: `/dashboards/${slug}/leitura-semanal`, label: "Leitura Semanal", icon: FileText },
  { href: `/dashboards/${slug}/acessos`, label: "Acessos", icon: Key },
  { href: `/dashboards/${slug}/avisos`, label: "Avisos", icon: Bell },
  { href: `/dashboards/${slug}/materiais`, label: "Materiais", icon: FolderOpen },
  { href: `/dashboards/${slug}/perfil`, label: "Perfil", icon: User },
]

const adminNavItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/clientes", label: "Clientes", icon: Building2 },
  { href: "/admin/usuarios", label: "Usuários", icon: Users },
  { href: "/admin/roles", label: "Roles", icon: Shield },
  { href: "/admin/mapa", label: "Mapa da Operação", icon: Map },
  { href: "/admin/relatorios-semanais", label: "Relatórios Semanais", icon: FileText },
  { href: "/admin/acessos", label: "Acessos", icon: Key },
  { href: "/admin/avisos", label: "Avisos", icon: Bell },
  { href: "/admin/botoes", label: "Botões", icon: MousePointer2 },
  { href: "/admin/icones", label: "Ícones", icon: ImageIcon },
  { href: "/admin/configuracoes", label: "Configurações", icon: Settings },
]

export function DashboardSidebar({ user, slug, hasWeeklyReports }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { collapsed, setCollapsed, isMobileOpen, setMobileOpen } = useSidebar()

  const clientSlug = slug || user.client?.slug || ""
  const allClientNavItems = getClientNavItems(clientSlug)
  
  // Filter out "Leitura Semanal" if client has no weekly reports
  const clientNavItems = user.role === "CLIENTE" && !hasWeeklyReports
    ? allClientNavItems.filter(item => !item.href.includes('/leitura-semanal'))
    : allClientNavItems
    
  const navItems = user.role === "ADMIN" ? adminNavItems : clientNavItems

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/login")
  }

  const isActive = (href: string) => {
    if (user.role === "ADMIN") {
      return pathname === href || (href !== "/admin" && pathname.startsWith(href))
    }
    // For client routes, exact match or starts with (but not just the base dashboard)
    const basePath = `/dashboards/${clientSlug}`
    if (href === basePath) {
      return pathname === basePath
    }
    return pathname.startsWith(href)
  }

  return (
    <TooltipProvider delayDuration={0}>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-30 lg:hidden text-[rgba(245,245,247,0.72)] hover:text-[#F5F5F7] hover:bg-[#141424]"
      >
        <Menu className="h-6 w-6" />
      </Button>

      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-screen bg-[#0B0B10] border-r border-[rgba(255,255,255,0.06)] transition-all duration-300",
          // Mobile: full width when open, hidden when closed
          isMobileOpen ? "translate-x-0 w-72" : "-translate-x-full w-72",
          // Desktop: respect collapsed state
          "lg:translate-x-0",
          collapsed ? "lg:w-20" : "lg:w-64"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-[rgba(255,255,255,0.06)]">
            {(!collapsed || isMobileOpen) && (
              <div className="flex items-center gap-3">
                <Image 
                  src={PG_LOGO || "/placeholder.svg"} 
                  alt="Pro Growth" 
                  width={40} 
                  height={40} 
                  className="rounded-xl shadow-lg shadow-[rgba(168,85,247,0.3)]"
                />
                <div>
                  <h1 className="font-bold text-[#F5F5F7] text-sm tracking-tight">
                    PG Dash
                  </h1>
                  {user.client && (
                    <p className="text-xs text-[rgba(245,245,247,0.52)]">{user.client.name}</p>
                  )}
                </div>
              </div>
            )}
            {collapsed && !isMobileOpen && (
              <Image 
                src={PG_LOGO || "/placeholder.svg"} 
                alt="Pro Growth" 
                width={40} 
                height={40} 
                className="rounded-xl shadow-lg shadow-[rgba(168,85,247,0.3)] mx-auto"
              />
            )}
            {/* Close button for mobile */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileOpen(false)}
              className="lg:hidden text-[rgba(245,245,247,0.52)] hover:text-[#F5F5F7] hover:bg-[#141424]"
            >
              <X className="h-4 w-4" />
            </Button>
            {/* Collapse button for desktop */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCollapsed(!collapsed)}
              className="hidden lg:flex text-[rgba(245,245,247,0.52)] hover:text-[#F5F5F7] hover:bg-[#141424] transition-all duration-200"
            >
              {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 py-4">
            <nav className="px-3 space-y-1">
              {navItems.map((item) => {
                const active = isActive(item.href)
                
                const navLink = (
                  <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}>
                    <div
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200",
                        active
                          ? "bg-gradient-to-r from-[rgba(168,85,247,0.15)] to-[rgba(124,58,237,0.08)] text-[#A855F7] border border-[rgba(168,85,247,0.3)] shadow-[0_0_20px_rgba(168,85,247,0.15)]"
                          : "text-[rgba(245,245,247,0.52)] hover:text-[#F5F5F7] hover:bg-[#141424]"
                      )}
                    >
                      <item.icon className={cn("h-5 w-5 shrink-0", collapsed && !isMobileOpen && "mx-auto")} />
                      {(!collapsed || isMobileOpen) && <span className="font-medium text-sm">{item.label}</span>}
                    </div>
                  </Link>
                )

                if (collapsed && !isMobileOpen) {
                  return (
                    <Tooltip key={item.href}>
                      <TooltipTrigger asChild>
                        {navLink}
                      </TooltipTrigger>
                      <TooltipContent side="right" className="bg-[#101018] border-[rgba(255,255,255,0.06)] text-[#F5F5F7]">
                        {item.label}
                      </TooltipContent>
                    </Tooltip>
                  )
                }

                return navLink
              })}
            </nav>
          </ScrollArea>

          {/* User section */}
          <div className="p-4 border-t border-[rgba(255,255,255,0.06)]">
            <div className={cn("flex items-center gap-3", collapsed && !isMobileOpen && "justify-center")}>
              <Avatar className="h-10 w-10 border-2 border-[rgba(168,85,247,0.3)]">
                {user.avatar_url ? (
                  <Image
                    src={user.avatar_url || "/placeholder.svg"}
                    alt={user.name}
                    width={40}
                    height={40}
                    className="object-cover"
                  />
                ) : (
                  <AvatarFallback className="bg-gradient-to-br from-[#A855F7] to-[#7C3AED] text-white font-semibold">
                    {user.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                )}
              </Avatar>
              {(!collapsed || isMobileOpen) && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#F5F5F7] truncate">{user.name}</p>
                  <p className="text-xs text-[rgba(245,245,247,0.52)] truncate">{user.email}</p>
                </div>
              )}
            </div>
            <Button
              variant="ghost"
              onClick={handleLogout}
              className={cn(
                "mt-3 text-[rgba(245,245,247,0.52)] hover:text-[#EF4444] hover:bg-[rgba(239,68,68,0.1)] transition-all duration-200",
                collapsed && !isMobileOpen ? "w-full justify-center" : "w-full justify-start"
              )}
            >
              <LogOut className="h-4 w-4" />
              {(!collapsed || isMobileOpen) && <span className="ml-2">Sair</span>}
            </Button>
          </div>
        </div>
      </aside>
    </TooltipProvider>
  )
}
