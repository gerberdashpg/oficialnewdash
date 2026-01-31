-- Create roles table with permissions
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  color VARCHAR(7) NOT NULL DEFAULT '#6B7280', -- Hex color for the role badge
  is_system BOOLEAN DEFAULT FALSE, -- System roles cannot be deleted (ADMIN, CLIENTE)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create permissions table (defines all available permissions)
CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(100) NOT NULL UNIQUE, -- e.g., 'clients.view', 'clients.edit'
  name VARCHAR(255) NOT NULL, -- Human readable name
  description TEXT,
  category VARCHAR(100) NOT NULL, -- Group permissions by category
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create role_permissions junction table
CREATE TABLE IF NOT EXISTS role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(role_id, permission_id)
);

-- Add role_id to users table (nullable for backward compatibility)
ALTER TABLE users ADD COLUMN IF NOT EXISTS role_id UUID REFERENCES roles(id) ON DELETE SET NULL;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON role_permissions(permission_id);
CREATE INDEX IF NOT EXISTS idx_users_role_id ON users(role_id);
CREATE INDEX IF NOT EXISTS idx_permissions_category ON permissions(category);

-- Insert default system roles
INSERT INTO roles (name, description, color, is_system) VALUES
  ('Administrador', 'Acesso total ao sistema', '#A855F7', TRUE),
  ('Cliente', 'Acesso ao dashboard do cliente', '#3B82F6', TRUE)
ON CONFLICT (name) DO NOTHING;

-- Insert all available permissions
INSERT INTO permissions (code, name, description, category) VALUES
  -- Clientes
  ('clients.view', 'Ver Clientes', 'Pode visualizar a lista de clientes', 'Clientes'),
  ('clients.view_details', 'Ver Detalhes do Cliente', 'Pode ver informacoes detalhadas de clientes', 'Clientes'),
  ('clients.create', 'Criar Clientes', 'Pode criar novos clientes', 'Clientes'),
  ('clients.edit', 'Editar Clientes', 'Pode editar informacoes de clientes', 'Clientes'),
  ('clients.delete', 'Excluir Clientes', 'Pode excluir clientes', 'Clientes'),
  
  -- Usuarios
  ('users.view', 'Ver Usuarios', 'Pode visualizar a lista de usuarios', 'Usuarios'),
  ('users.create', 'Criar Usuarios', 'Pode criar novos usuarios', 'Usuarios'),
  ('users.edit', 'Editar Usuarios', 'Pode editar informacoes de usuarios', 'Usuarios'),
  ('users.delete', 'Excluir Usuarios', 'Pode excluir usuarios', 'Usuarios'),
  
  -- Roles
  ('roles.view', 'Ver Roles', 'Pode visualizar roles', 'Roles'),
  ('roles.create', 'Criar Roles', 'Pode criar novas roles', 'Roles'),
  ('roles.edit', 'Editar Roles', 'Pode editar roles', 'Roles'),
  ('roles.delete', 'Excluir Roles', 'Pode excluir roles', 'Roles'),
  ('roles.assign', 'Atribuir Roles', 'Pode atribuir roles a usuarios', 'Roles'),
  
  -- Acessos
  ('accesses.view', 'Ver Acessos', 'Pode visualizar acessos', 'Acessos'),
  ('accesses.create', 'Criar Acessos', 'Pode criar novos acessos', 'Acessos'),
  ('accesses.edit', 'Editar Acessos', 'Pode editar acessos', 'Acessos'),
  ('accesses.delete', 'Excluir Acessos', 'Pode excluir acessos', 'Acessos'),
  
  -- Avisos
  ('notices.view', 'Ver Avisos', 'Pode visualizar avisos', 'Avisos'),
  ('notices.create', 'Criar Avisos', 'Pode criar novos avisos', 'Avisos'),
  ('notices.edit', 'Editar Avisos', 'Pode editar avisos', 'Avisos'),
  ('notices.delete', 'Excluir Avisos', 'Pode excluir avisos', 'Avisos'),
  
  -- Mapa da Operacao
  ('operation_map.view', 'Ver Mapa da Operacao', 'Pode visualizar o mapa da operacao', 'Mapa da Operacao'),
  ('operation_map.edit', 'Editar Mapa da Operacao', 'Pode editar etapas do mapa', 'Mapa da Operacao'),
  
  -- Relatorios Semanais
  ('weekly_reports.view', 'Ver Relatorios Semanais', 'Pode visualizar relatorios semanais', 'Relatorios Semanais'),
  ('weekly_reports.create', 'Criar Relatorios Semanais', 'Pode criar relatorios semanais', 'Relatorios Semanais'),
  ('weekly_reports.edit', 'Editar Relatorios Semanais', 'Pode editar relatorios semanais', 'Relatorios Semanais'),
  ('weekly_reports.delete', 'Excluir Relatorios Semanais', 'Pode excluir relatorios semanais', 'Relatorios Semanais'),
  
  -- Configuracoes
  ('settings.view', 'Ver Configuracoes', 'Pode visualizar configuracoes', 'Configuracoes'),
  ('settings.edit', 'Editar Configuracoes', 'Pode editar configuracoes do sistema', 'Configuracoes'),
  
  -- Botoes
  ('buttons.view', 'Ver Botoes', 'Pode visualizar configuracao de botoes', 'Botoes'),
  ('buttons.edit', 'Editar Botoes', 'Pode editar configuracao de botoes', 'Botoes'),
  
  -- Icones
  ('icons.view', 'Ver Icones', 'Pode visualizar icones', 'Icones'),
  ('icons.manage', 'Gerenciar Icones', 'Pode fazer upload e gerenciar icones', 'Icones'),
  
  -- Dashboard
  ('dashboard.view', 'Ver Dashboard Admin', 'Pode visualizar o dashboard administrativo', 'Dashboard'),
  ('dashboard.analytics', 'Ver Analytics', 'Pode visualizar estatisticas e metricas', 'Dashboard')
ON CONFLICT (code) DO NOTHING;

-- Give Admin role all permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'Administrador'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Give Cliente role basic view permissions for their own data
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'Cliente' 
  AND p.code IN ('accesses.view', 'notices.view', 'operation_map.view', 'weekly_reports.view')
ON CONFLICT (role_id, permission_id) DO NOTHING;
