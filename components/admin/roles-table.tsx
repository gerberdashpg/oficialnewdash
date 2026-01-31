"use client"

import React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { useToast } from "@/hooks/use-toast"
import { Plus, Pencil, Trash2, Shield, Loader2, Eye, EyeOff, Check, X } from "lucide-react"

interface Permission {
  id: string
  code: string
  name: string
  description?: string
  category: string
}

interface Role {
  id: string
  name: string
  description: string | null
  color: string
  is_system_role: boolean
  permissions: Permission[]
  created_at: string
  updated_at?: string
}

interface GroupedPermissions {
  [category: string]: Permission[]
}

const PRESET_COLORS = [
  { name: "Cinza", value: "#6B7280" },
  { name: "Vermelho", value: "#EF4444" },
  { name: "Laranja", value: "#F97316" },
  { name: "Amarelo", value: "#EAB308" },
  { name: "Verde", value: "#22C55E" },
  { name: "Azul", value: "#3B82F6" },
  { name: "Indigo", value: "#6366F1" },
  { name: "Roxo", value: "#A855F7" },
  { name: "Rosa", value: "#EC4899" },
  { name: "Ciano", value: "#06B6D4" },
]

const CATEGORY_LABELS: Record<string, string> = {
  clientes: "Clientes",
  usuarios: "Usuarios",
  acessos: "Acessos",
  avisos: "Avisos",
  mapa: "Mapa da Operacao",
  relatorios: "Relatorios Semanais",
  botoes: "Botoes",
  icones: "Icones",
  configuracoes: "Configuracoes",
  roles: "Roles",
}

export function RolesTable() {
  const [roles, setRoles] = useState<Role[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [groupedPermissions, setGroupedPermissions] = useState<GroupedPermissions>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const { toast } = useToast()

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    color: "#6B7280",
    permissions: [] as string[],
  })

  useEffect(() => {
    fetchRoles()
    fetchPermissions()
  }, [])

  async function fetchRoles() {
    try {
      const res = await fetch("/api/admin/roles")
      const data = await res.json()
      if (data.roles) {
        setRoles(data.roles)
      } else if (data.error) {
        toast({
          title: "Erro",
          description: data.error,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching roles:", error)
      toast({
        title: "Erro",
        description: "Falha ao carregar roles",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  async function fetchPermissions() {
    try {
      const res = await fetch("/api/admin/permissions")
      const data = await res.json()
      if (data.permissions) {
        setPermissions(data.permissions)
        setGroupedPermissions(data.grouped)
      }
    } catch (error) {
      console.error("Error fetching permissions:", error)
    }
  }

  function openCreateDialog() {
    setEditingRole(null)
    setFormData({
      name: "",
      description: "",
      color: "#6B7280",
      permissions: [],
    })
    setIsDialogOpen(true)
  }

  function openEditDialog(role: Role) {
    setEditingRole(role)
    setFormData({
      name: role.name,
      description: role.description || "",
      color: role.color,
      permissions: role.permissions.map((p) => p.id),
    })
    setIsDialogOpen(true)
  }

  function togglePermission(permissionId: string) {
    setFormData((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permissionId)
        ? prev.permissions.filter((id) => id !== permissionId)
        : [...prev.permissions, permissionId],
    }))
  }

  function toggleAllCategoryPermissions(category: string, checked: boolean) {
    const categoryPermissions = groupedPermissions[category] || []
    const categoryPermissionIds = categoryPermissions.map((p) => p.id)

    setFormData((prev) => ({
      ...prev,
      permissions: checked
        ? [...new Set([...prev.permissions, ...categoryPermissionIds])]
        : prev.permissions.filter((id) => !categoryPermissionIds.includes(id)),
    }))
  }

  function isCategoryFullySelected(category: string): boolean {
    const categoryPermissions = groupedPermissions[category] || []
    return categoryPermissions.every((p) => formData.permissions.includes(p.id))
  }

  function isCategoryPartiallySelected(category: string): boolean {
    const categoryPermissions = groupedPermissions[category] || []
    const selectedCount = categoryPermissions.filter((p) =>
      formData.permissions.includes(p.id)
    ).length
    return selectedCount > 0 && selectedCount < categoryPermissions.length
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    try {
      const url = editingRole
        ? `/api/admin/roles/${editingRole.id}`
        : "/api/admin/roles"
      const method = editingRole ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Erro ao salvar role")
      }

      toast({
        title: "Sucesso",
        description: editingRole ? "Role atualizada com sucesso" : "Role criada com sucesso",
      })

      setIsDialogOpen(false)
      fetchRoles()
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Falha ao salvar role",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(roleId: string) {
    try {
      const res = await fetch(`/api/admin/roles/${roleId}`, {
        method: "DELETE",
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Erro ao excluir role")
      }

      toast({
        title: "Sucesso",
        description: "Role excluida com sucesso",
      })

      fetchRoles()
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Falha ao excluir role",
        variant: "destructive",
      })
    }
  }

  function getPermissionIcon(code: string) {
    if (code.includes("view")) return <Eye className="h-4 w-4" />
    if (code.includes("create") || code.includes("edit") || code.includes("delete"))
      return <Pencil className="h-4 w-4" />
    return <Shield className="h-4 w-4" />
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-[#A855F7]" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#F5F5F7]">Roles</h2>
          <p className="text-[rgba(245,245,247,0.52)]">
            Gerencie as roles e permissoes do sistema
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={openCreateDialog}
              className="bg-gradient-to-r from-[#A855F7] to-[#7C3AED] hover:from-[#9333EA] hover:to-[#6D28D9] text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova Role
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#101018] border-[rgba(255,255,255,0.06)] text-[#F5F5F7] max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>
                {editingRole ? "Editar Role" : "Criar Nova Role"}
              </DialogTitle>
              <DialogDescription className="text-[rgba(245,245,247,0.52)]">
                {editingRole
                  ? "Atualize as informacoes e permissoes da role"
                  : "Configure as informacoes e permissoes da nova role"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="space-y-6 flex-1 overflow-y-auto pr-2">
                {/* Basic Info */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome da Role *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, name: e.target.value }))
                      }
                      placeholder="Ex: Gerente, Editor, Visualizador"
                      className="bg-[#07070A] border-[rgba(255,255,255,0.06)] text-[#F5F5F7]"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Cor</Label>
                    <div className="flex flex-wrap gap-2">
                      {PRESET_COLORS.map((color) => (
                        <button
                          key={color.value}
                          type="button"
                          onClick={() =>
                            setFormData((prev) => ({ ...prev, color: color.value }))
                          }
                          className={`w-8 h-8 rounded-full border-2 transition-all ${
                            formData.color === color.value
                              ? "border-white scale-110"
                              : "border-transparent hover:scale-105"
                          }`}
                          style={{ backgroundColor: color.value }}
                          title={color.name}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descricao</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, description: e.target.value }))
                    }
                    placeholder="Descreva o proposito desta role..."
                    className="bg-[#07070A] border-[rgba(255,255,255,0.06)] text-[#F5F5F7] resize-none"
                    rows={2}
                  />
                </div>

                {/* Permissions */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base">Permissoes</Label>
                    <span className="text-sm text-[rgba(245,245,247,0.52)]">
                      {formData.permissions.length} selecionadas
                    </span>
                  </div>

                  <Accordion type="multiple" className="space-y-2">
                    {Object.entries(groupedPermissions).map(([category, perms]) => (
                      <AccordionItem
                        key={category}
                        value={category}
                        className="border border-[rgba(255,255,255,0.06)] rounded-lg overflow-hidden bg-[#07070A]"
                      >
                        <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-[rgba(255,255,255,0.02)]">
                          <div className="flex items-center gap-3">
                            <Checkbox
                              checked={isCategoryFullySelected(category)}
                              onCheckedChange={(checked) => {
                                toggleAllCategoryPermissions(category, checked as boolean)
                              }}
                              onClick={(e) => e.stopPropagation()}
                              className={
                                isCategoryPartiallySelected(category)
                                  ? "data-[state=checked]:bg-[#A855F7]/50"
                                  : ""
                              }
                            />
                            <span className="font-medium">
                              {CATEGORY_LABELS[category] || category}
                            </span>
                            <Badge
                              variant="secondary"
                              className="bg-[rgba(168,85,247,0.1)] text-[#A855F7] border-none"
                            >
                              {perms.filter((p) => formData.permissions.includes(p.id)).length}/
                              {perms.length}
                            </Badge>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-4">
                          <div className="grid gap-3 pt-2">
                            {perms.map((permission) => (
                              <label
                                key={permission.id}
                                className="flex items-center gap-3 p-3 rounded-lg border border-[rgba(255,255,255,0.04)] bg-[#0B0B10] hover:bg-[rgba(255,255,255,0.02)] cursor-pointer transition-colors"
                              >
                                <Checkbox
                                  checked={formData.permissions.includes(permission.id)}
                                  onCheckedChange={() => togglePermission(permission.id)}
                                />
                                <div className="flex items-center gap-2 text-[rgba(245,245,247,0.52)]">
                                  {getPermissionIcon(permission.code)}
                                </div>
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-[#F5F5F7]">
                                    {permission.name}
                                  </p>
                                  {permission.description && (
                                    <p className="text-xs text-[rgba(245,245,247,0.52)]">
                                      {permission.description}
                                    </p>
                                  )}
                                </div>
                                {formData.permissions.includes(permission.id) && (
                                  <Check className="h-4 w-4 text-[#22C55E]" />
                                )}
                              </label>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              </div>

              <DialogFooter className="pt-4 border-t border-[rgba(255,255,255,0.06)] mt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  className="border-[rgba(255,255,255,0.06)] text-[#F5F5F7] hover:bg-[rgba(255,255,255,0.02)]"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="bg-gradient-to-r from-[#A855F7] to-[#7C3AED] hover:from-[#9333EA] hover:to-[#6D28D9] text-white"
                >
                  {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {editingRole ? "Salvar Alteracoes" : "Criar Role"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Roles Table */}
      <div className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#0B0B10] overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-[rgba(255,255,255,0.06)] hover:bg-transparent">
              <TableHead className="text-[rgba(245,245,247,0.52)]">Role</TableHead>
              <TableHead className="text-[rgba(245,245,247,0.52)]">Descricao</TableHead>
              <TableHead className="text-[rgba(245,245,247,0.52)]">Permissoes</TableHead>
              <TableHead className="text-[rgba(245,245,247,0.52)]">Tipo</TableHead>
              <TableHead className="text-right text-[rgba(245,245,247,0.52)]">
                Acoes
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {roles.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-8 text-[rgba(245,245,247,0.52)]"
                >
                  Nenhuma role encontrada
                </TableCell>
              </TableRow>
            ) : (
              roles.map((role) => (
                <TableRow
                  key={role.id}
                  className="border-[rgba(255,255,255,0.06)] hover:bg-[rgba(255,255,255,0.02)]"
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: role.color }}
                      />
                      <span className="font-medium text-[#F5F5F7]">{role.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-[rgba(245,245,247,0.72)] max-w-[200px] truncate">
                    {role.description || "-"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className="bg-[rgba(168,85,247,0.1)] text-[#A855F7] border-none"
                    >
                      {role.permissions.length} permissoes
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {role.is_system_role ? (
                      <Badge className="bg-[rgba(59,130,246,0.1)] text-[#3B82F6] border-none">
                        Sistema
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="border-[rgba(255,255,255,0.1)] text-[rgba(245,245,247,0.72)]"
                      >
                        Personalizada
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(role)}
                        className="text-[rgba(245,245,247,0.52)] hover:text-[#F5F5F7] hover:bg-[rgba(255,255,255,0.04)]"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      {!role.is_system_role && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-[rgba(245,245,247,0.52)] hover:text-[#EF4444] hover:bg-[rgba(239,68,68,0.1)]"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-[#101018] border-[rgba(255,255,255,0.06)]">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-[#F5F5F7]">
                                Excluir Role
                              </AlertDialogTitle>
                              <AlertDialogDescription className="text-[rgba(245,245,247,0.52)]">
                                Tem certeza que deseja excluir a role &quot;{role.name}&quot;?
                                Esta acao nao pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="border-[rgba(255,255,255,0.06)] text-[#F5F5F7] hover:bg-[rgba(255,255,255,0.02)]">
                                Cancelar
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(role.id)}
                                className="bg-[#EF4444] hover:bg-[#DC2626] text-white"
                              >
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
