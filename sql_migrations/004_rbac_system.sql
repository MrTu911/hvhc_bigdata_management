
-- ============================================
-- Migration 004: Role-Based Access Control System
-- Date: 2025-10-13
-- Description: Implement comprehensive RBAC system with roles, permissions, and overrides
-- ============================================

-- ============================================
-- STEP 1: Update UserRole Enum
-- ============================================

-- Drop old role values if they exist (will be migrated)
-- Add new role values
ALTER TYPE "UserRole" RENAME TO "UserRole_old";

CREATE TYPE "UserRole" AS ENUM (
  'QUAN_TRI_HE_THONG',
  'CHI_HUY_HOC_VIEN',
  'CHI_HUY_KHOA_PHONG',
  'CHU_NHIEM_BO_MON',
  'GIANG_VIEN',
  'NGHIEN_CUU_VIEN',
  'HOC_VIEN_SINH_VIEN',
  'KY_THUAT_VIEN'
);

-- Migrate existing users to new roles
UPDATE users SET role = CASE
  WHEN role::text = 'ADMIN' THEN 'QUAN_TRI_HE_THONG'::text
  WHEN role::text = 'GIANG_VIEN' THEN 'GIANG_VIEN'::text
  WHEN role::text = 'HOC_VIEN' THEN 'HOC_VIEN_SINH_VIEN'::text
  WHEN role::text = 'NGHIEN_CUU_VIEN' THEN 'NGHIEN_CUU_VIEN'::text
  ELSE 'HOC_VIEN_SINH_VIEN'::text
END::text;

-- Update column type
ALTER TABLE users ALTER COLUMN role TYPE "UserRole" USING role::text::"UserRole";
ALTER TABLE users ALTER COLUMN role SET DEFAULT 'HOC_VIEN_SINH_VIEN'::"UserRole";

-- Drop old enum
DROP TYPE "UserRole_old";

-- ============================================
-- STEP 2: Create Permission Enums
-- ============================================

CREATE TYPE "PermissionModule" AS ENUM (
  'DASHBOARD',
  'USER_MANAGEMENT',
  'DATA_LAKE',
  'ML_TRAINING',
  'RESEARCH',
  'ANALYTICS',
  'REPORTS',
  'SYSTEM_CONFIG',
  'AUDIT_LOGS',
  'FILES',
  'DATASETS',
  'TRAINING',
  'GOVERNANCE'
);

CREATE TYPE "PermissionAction" AS ENUM (
  'VIEW',
  'CREATE',
  'EDIT',
  'DELETE',
  'EXPORT',
  'APPROVE',
  'MANAGE',
  'EXECUTE'
);

CREATE TYPE "PermissionScope" AS ENUM (
  'ALL',
  'DEPARTMENT',
  'OWN'
);

-- ============================================
-- STEP 3: Create Permission Tables
-- ============================================

CREATE TABLE IF NOT EXISTS "permissions" (
  "id" TEXT PRIMARY KEY,
  "code" TEXT UNIQUE NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "module" "PermissionModule" NOT NULL,
  "action" "PermissionAction" NOT NULL,
  "scope" "PermissionScope" NOT NULL DEFAULT 'OWN',
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "permissions_module_idx" ON "permissions"("module");
CREATE INDEX "permissions_code_idx" ON "permissions"("code");

CREATE TABLE IF NOT EXISTS "role_permissions" (
  "id" TEXT PRIMARY KEY,
  "role" "UserRole" NOT NULL,
  "permissionId" TEXT NOT NULL,
  "conditions" JSONB,
  "grantedBy" TEXT,
  "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "role_permissions_permissionId_fkey" 
    FOREIGN KEY ("permissionId") REFERENCES "permissions"("id") ON DELETE CASCADE,
  CONSTRAINT "role_permissions_role_permissionId_unique" UNIQUE("role", "permissionId")
);

CREATE INDEX "role_permissions_role_idx" ON "role_permissions"("role");
CREATE INDEX "role_permissions_permissionId_idx" ON "role_permissions"("permissionId");

CREATE TABLE IF NOT EXISTS "user_permission_overrides" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "permissionId" TEXT NOT NULL,
  "isGranted" BOOLEAN NOT NULL DEFAULT true,
  "conditions" JSONB,
  "reason" TEXT,
  "grantedBy" TEXT,
  "expiresAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "user_permission_overrides_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE,
  CONSTRAINT "user_permission_overrides_permissionId_fkey" 
    FOREIGN KEY ("permissionId") REFERENCES "permissions"("id") ON DELETE CASCADE,
  CONSTRAINT "user_permission_overrides_userId_permissionId_unique" 
    UNIQUE("userId", "permissionId")
);

CREATE INDEX "user_permission_overrides_userId_idx" ON "user_permission_overrides"("userId");
CREATE INDEX "user_permission_overrides_permissionId_idx" ON "user_permission_overrides"("permissionId");
CREATE INDEX "user_permission_overrides_expiresAt_idx" ON "user_permission_overrides"("expiresAt");

-- ============================================
-- STEP 4: Seed Permissions
-- ============================================

-- Helper function to generate CUID-like IDs
CREATE OR REPLACE FUNCTION generate_cuid() RETURNS TEXT AS $$
DECLARE
  timestamp_part TEXT;
  random_part TEXT;
BEGIN
  timestamp_part := LPAD(TO_HEX(EXTRACT(EPOCH FROM NOW())::BIGINT), 8, '0');
  random_part := LPAD(TO_HEX((RANDOM() * 4294967295)::BIGINT), 8, '0');
  RETURN 'c' || timestamp_part || random_part;
END;
$$ LANGUAGE plpgsql;

-- Dashboard Permissions
INSERT INTO permissions (id, code, name, description, module, action, scope, sortOrder)
VALUES
  (generate_cuid(), 'dashboard:view:all', 'Xem Dashboard Toàn hệ thống', 'Xem tổng quan toàn bộ hệ thống', 'DASHBOARD', 'VIEW', 'ALL', 1),
  (generate_cuid(), 'dashboard:view:department', 'Xem Dashboard Đơn vị', 'Xem tổng quan của đơn vị', 'DASHBOARD', 'VIEW', 'DEPARTMENT', 2),
  (generate_cuid(), 'dashboard:view:own', 'Xem Dashboard Cá nhân', 'Xem dashboard cá nhân', 'DASHBOARD', 'VIEW', 'OWN', 3);

-- User Management Permissions
INSERT INTO permissions (id, code, name, description, module, action, scope, sortOrder)
VALUES
  (generate_cuid(), 'users:manage:all', 'Quản lý Tất cả Người dùng', 'Tạo, sửa, xóa tất cả người dùng', 'USER_MANAGEMENT', 'MANAGE', 'ALL', 10),
  (generate_cuid(), 'users:view:all', 'Xem Tất cả Người dùng', 'Xem danh sách tất cả người dùng', 'USER_MANAGEMENT', 'VIEW', 'ALL', 11),
  (generate_cuid(), 'users:view:department', 'Xem Người dùng Đơn vị', 'Xem người dùng trong đơn vị', 'USER_MANAGEMENT', 'VIEW', 'DEPARTMENT', 12),
  (generate_cuid(), 'users:edit:department', 'Sửa Người dùng Đơn vị', 'Chỉnh sửa người dùng trong đơn vị', 'USER_MANAGEMENT', 'EDIT', 'DEPARTMENT', 13),
  (generate_cuid(), 'users:view:own', 'Xem Hồ sơ Cá nhân', 'Xem thông tin cá nhân', 'USER_MANAGEMENT', 'VIEW', 'OWN', 14);

-- Data Lake Permissions
INSERT INTO permissions (id, code, name, description, module, action, scope, sortOrder)
VALUES
  (generate_cuid(), 'data_lake:manage:all', 'Quản lý Toàn bộ Data Lake', 'Quản lý tất cả dữ liệu trong Data Lake', 'DATA_LAKE', 'MANAGE', 'ALL', 20),
  (generate_cuid(), 'data_lake:view:all', 'Xem Toàn bộ Data Lake', 'Xem tất cả dữ liệu', 'DATA_LAKE', 'VIEW', 'ALL', 21),
  (generate_cuid(), 'data_lake:view:department', 'Xem Data Lake Đơn vị', 'Xem dữ liệu của đơn vị', 'DATA_LAKE', 'VIEW', 'DEPARTMENT', 22),
  (generate_cuid(), 'data_lake:create:own', 'Tạo Dữ liệu', 'Upload dữ liệu mới', 'DATA_LAKE', 'CREATE', 'OWN', 23),
  (generate_cuid(), 'data_lake:edit:own', 'Sửa Dữ liệu Cá nhân', 'Chỉnh sửa dữ liệu của mình', 'DATA_LAKE', 'EDIT', 'OWN', 24),
  (generate_cuid(), 'data_lake:delete:own', 'Xóa Dữ liệu Cá nhân', 'Xóa dữ liệu của mình', 'DATA_LAKE', 'DELETE', 'OWN', 25),
  (generate_cuid(), 'data_lake:export:all', 'Export Toàn bộ Dữ liệu', 'Export tất cả dữ liệu', 'DATA_LAKE', 'EXPORT', 'ALL', 26);

-- ML Training Permissions
INSERT INTO permissions (id, code, name, description, module, action, scope, sortOrder)
VALUES
  (generate_cuid(), 'ml_training:manage:all', 'Quản lý Toàn bộ ML Training', 'Quản lý tất cả training jobs', 'ML_TRAINING', 'MANAGE', 'ALL', 30),
  (generate_cuid(), 'ml_training:view:all', 'Xem Tất cả Training Jobs', 'Xem tất cả training jobs', 'ML_TRAINING', 'VIEW', 'ALL', 31),
  (generate_cuid(), 'ml_training:create:own', 'Tạo Training Job', 'Tạo training job mới', 'ML_TRAINING', 'CREATE', 'OWN', 32),
  (generate_cuid(), 'ml_training:execute:own', 'Thực thi Training', 'Chạy training jobs', 'ML_TRAINING', 'EXECUTE', 'OWN', 33),
  (generate_cuid(), 'ml_training:view:own', 'Xem Training Cá nhân', 'Xem training jobs của mình', 'ML_TRAINING', 'VIEW', 'OWN', 34);

-- Research Permissions
INSERT INTO permissions (id, code, name, description, module, action, scope, sortOrder)
VALUES
  (generate_cuid(), 'research:manage:all', 'Quản lý Toàn bộ Nghiên cứu', 'Quản lý tất cả nghiên cứu', 'RESEARCH', 'MANAGE', 'ALL', 40),
  (generate_cuid(), 'research:view:all', 'Xem Tất cả Nghiên cứu', 'Xem tất cả nghiên cứu', 'RESEARCH', 'VIEW', 'ALL', 41),
  (generate_cuid(), 'research:view:department', 'Xem Nghiên cứu Đơn vị', 'Xem nghiên cứu của đơn vị', 'RESEARCH', 'VIEW', 'DEPARTMENT', 42),
  (generate_cuid(), 'research:create:own', 'Tạo Nghiên cứu', 'Tạo nghiên cứu mới', 'RESEARCH', 'CREATE', 'OWN', 43),
  (generate_cuid(), 'research:edit:own', 'Sửa Nghiên cứu', 'Chỉnh sửa nghiên cứu của mình', 'RESEARCH', 'EDIT', 'OWN', 44);

-- Analytics Permissions
INSERT INTO permissions (id, code, name, description, module, action, scope, sortOrder)
VALUES
  (generate_cuid(), 'analytics:view:all', 'Xem Toàn bộ Analytics', 'Xem tất cả phân tích', 'ANALYTICS', 'VIEW', 'ALL', 50),
  (generate_cuid(), 'analytics:view:department', 'Xem Analytics Đơn vị', 'Xem phân tích của đơn vị', 'ANALYTICS', 'VIEW', 'DEPARTMENT', 51),
  (generate_cuid(), 'analytics:view:own', 'Xem Analytics Cá nhân', 'Xem phân tích cá nhân', 'ANALYTICS', 'VIEW', 'OWN', 52),
  (generate_cuid(), 'analytics:export:all', 'Export Toàn bộ Analytics', 'Export tất cả phân tích', 'ANALYTICS', 'EXPORT', 'ALL', 53);

-- Reports Permissions
INSERT INTO permissions (id, code, name, description, module, action, scope, sortOrder)
VALUES
  (generate_cuid(), 'reports:manage:all', 'Quản lý Toàn bộ Báo cáo', 'Quản lý tất cả báo cáo', 'REPORTS', 'MANAGE', 'ALL', 60),
  (generate_cuid(), 'reports:view:all', 'Xem Tất cả Báo cáo', 'Xem tất cả báo cáo', 'REPORTS', 'VIEW', 'ALL', 61),
  (generate_cuid(), 'reports:view:department', 'Xem Báo cáo Đơn vị', 'Xem báo cáo của đơn vị', 'REPORTS', 'VIEW', 'DEPARTMENT', 62),
  (generate_cuid(), 'reports:create:own', 'Tạo Báo cáo', 'Tạo báo cáo mới', 'REPORTS', 'CREATE', 'OWN', 63),
  (generate_cuid(), 'reports:export:all', 'Export Báo cáo', 'Export báo cáo', 'REPORTS', 'EXPORT', 'ALL', 64);

-- System Config Permissions
INSERT INTO permissions (id, code, name, description, module, action, scope, sortOrder)
VALUES
  (generate_cuid(), 'system_config:manage:all', 'Quản lý Cấu hình Hệ thống', 'Quản lý cấu hình hệ thống', 'SYSTEM_CONFIG', 'MANAGE', 'ALL', 70),
  (generate_cuid(), 'system_config:view:all', 'Xem Cấu hình Hệ thống', 'Xem cấu hình hệ thống', 'SYSTEM_CONFIG', 'VIEW', 'ALL', 71);

-- Audit Logs Permissions
INSERT INTO permissions (id, code, name, description, module, action, scope, sortOrder)
VALUES
  (generate_cuid(), 'audit_logs:view:all', 'Xem Toàn bộ Audit Logs', 'Xem tất cả audit logs', 'AUDIT_LOGS', 'VIEW', 'ALL', 80),
  (generate_cuid(), 'audit_logs:view:department', 'Xem Audit Logs Đơn vị', 'Xem audit logs của đơn vị', 'AUDIT_LOGS', 'VIEW', 'DEPARTMENT', 81),
  (generate_cuid(), 'audit_logs:export:all', 'Export Audit Logs', 'Export audit logs', 'AUDIT_LOGS', 'EXPORT', 'ALL', 82);

-- Files Permissions
INSERT INTO permissions (id, code, name, description, module, action, scope, sortOrder)
VALUES
  (generate_cuid(), 'files:manage:all', 'Quản lý Toàn bộ Files', 'Quản lý tất cả files', 'FILES', 'MANAGE', 'ALL', 90),
  (generate_cuid(), 'files:view:all', 'Xem Tất cả Files', 'Xem tất cả files', 'FILES', 'VIEW', 'ALL', 91),
  (generate_cuid(), 'files:view:department', 'Xem Files Đơn vị', 'Xem files của đơn vị', 'FILES', 'VIEW', 'DEPARTMENT', 92),
  (generate_cuid(), 'files:create:own', 'Upload Files', 'Upload files mới', 'FILES', 'CREATE', 'OWN', 93),
  (generate_cuid(), 'files:delete:own', 'Xóa Files Cá nhân', 'Xóa files của mình', 'FILES', 'DELETE', 'OWN', 94);

-- Datasets Permissions
INSERT INTO permissions (id, code, name, description, module, action, scope, sortOrder)
VALUES
  (generate_cuid(), 'datasets:manage:all', 'Quản lý Toàn bộ Datasets', 'Quản lý tất cả datasets', 'DATASETS', 'MANAGE', 'ALL', 100),
  (generate_cuid(), 'datasets:view:all', 'Xem Tất cả Datasets', 'Xem tất cả datasets', 'DATASETS', 'VIEW', 'ALL', 101),
  (generate_cuid(), 'datasets:view:department', 'Xem Datasets Đơn vị', 'Xem datasets của đơn vị', 'DATASETS', 'VIEW', 'DEPARTMENT', 102),
  (generate_cuid(), 'datasets:create:own', 'Tạo Dataset', 'Tạo dataset mới', 'DATASETS', 'CREATE', 'OWN', 103);

-- ============================================
-- STEP 5: Assign Permissions to Roles
-- ============================================

-- QUAN_TRI_HE_THONG (System Administrator) - Full Access
INSERT INTO role_permissions (id, role, "permissionId", "grantedBy", "grantedAt")
SELECT 
  generate_cuid(),
  'QUAN_TRI_HE_THONG'::"UserRole",
  id,
  'SYSTEM',
  NOW()
FROM permissions;

-- CHI_HUY_HOC_VIEN (Academy Commander)
INSERT INTO role_permissions (id, role, "permissionId", "grantedBy", "grantedAt")
SELECT 
  generate_cuid(),
  'CHI_HUY_HOC_VIEN'::"UserRole",
  id,
  'SYSTEM',
  NOW()
FROM permissions
WHERE code IN (
  'dashboard:view:all',
  'users:view:all',
  'data_lake:view:all',
  'ml_training:view:all',
  'research:view:all',
  'analytics:view:all',
  'analytics:export:all',
  'reports:view:all',
  'reports:export:all',
  'audit_logs:view:all',
  'audit_logs:export:all',
  'files:view:all',
  'datasets:view:all'
);

-- CHI_HUY_KHOA_PHONG (Department Commander)
INSERT INTO role_permissions (id, role, "permissionId", "grantedBy", "grantedAt")
SELECT 
  generate_cuid(),
  'CHI_HUY_KHOA_PHONG'::"UserRole",
  id,
  'SYSTEM',
  NOW()
FROM permissions
WHERE code IN (
  'dashboard:view:department',
  'users:view:department',
  'users:edit:department',
  'data_lake:view:department',
  'ml_training:view:all',
  'research:view:department',
  'analytics:view:department',
  'reports:view:department',
  'reports:create:own',
  'audit_logs:view:department',
  'files:view:department',
  'datasets:view:department'
);

-- CHU_NHIEM_BO_MON (Subject Head)
INSERT INTO role_permissions (id, role, "permissionId", "grantedBy", "grantedAt")
SELECT 
  generate_cuid(),
  'CHU_NHIEM_BO_MON'::"UserRole",
  id,
  'SYSTEM',
  NOW()
FROM permissions
WHERE code IN (
  'dashboard:view:department',
  'users:view:department',
  'data_lake:view:department',
  'data_lake:create:own',
  'ml_training:view:own',
  'ml_training:create:own',
  'research:view:department',
  'research:create:own',
  'research:edit:own',
  'analytics:view:department',
  'reports:view:department',
  'reports:create:own',
  'files:view:department',
  'files:create:own',
  'datasets:view:department',
  'datasets:create:own'
);

-- GIANG_VIEN (Lecturer)
INSERT INTO role_permissions (id, role, "permissionId", "grantedBy", "grantedAt")
SELECT 
  generate_cuid(),
  'GIANG_VIEN'::"UserRole",
  id,
  'SYSTEM',
  NOW()
FROM permissions
WHERE code IN (
  'dashboard:view:own',
  'users:view:own',
  'data_lake:view:department',
  'data_lake:create:own',
  'data_lake:edit:own',
  'ml_training:view:own',
  'ml_training:create:own',
  'ml_training:execute:own',
  'research:view:department',
  'research:create:own',
  'research:edit:own',
  'analytics:view:own',
  'reports:view:department',
  'reports:create:own',
  'files:view:department',
  'files:create:own',
  'files:delete:own',
  'datasets:view:department',
  'datasets:create:own'
);

-- NGHIEN_CUU_VIEN (Researcher)
INSERT INTO role_permissions (id, role, "permissionId", "grantedBy", "grantedAt")
SELECT 
  generate_cuid(),
  'NGHIEN_CUU_VIEN'::"UserRole",
  id,
  'SYSTEM',
  NOW()
FROM permissions
WHERE code IN (
  'dashboard:view:own',
  'users:view:own',
  'data_lake:view:department',
  'data_lake:create:own',
  'data_lake:edit:own',
  'ml_training:view:own',
  'ml_training:create:own',
  'ml_training:execute:own',
  'research:view:all',
  'research:create:own',
  'research:edit:own',
  'analytics:view:all',
  'reports:create:own',
  'files:view:all',
  'files:create:own',
  'files:delete:own',
  'datasets:view:all',
  'datasets:create:own'
);

-- HOC_VIEN_SINH_VIEN (Student)
INSERT INTO role_permissions (id, role, "permissionId", "grantedBy", "grantedAt")
SELECT 
  generate_cuid(),
  'HOC_VIEN_SINH_VIEN'::"UserRole",
  id,
  'SYSTEM',
  NOW()
FROM permissions
WHERE code IN (
  'dashboard:view:own',
  'users:view:own',
  'data_lake:view:department',
  'analytics:view:own',
  'files:view:department',
  'datasets:view:department'
);

-- KY_THUAT_VIEN (Technical Staff)
INSERT INTO role_permissions (id, role, "permissionId", "grantedBy", "grantedAt")
SELECT 
  generate_cuid(),
  'KY_THUAT_VIEN'::"UserRole",
  id,
  'SYSTEM',
  NOW()
FROM permissions
WHERE code IN (
  'dashboard:view:all',
  'users:view:all',
  'data_lake:view:all',
  'ml_training:view:all',
  'analytics:view:all',
  'reports:view:all',
  'system_config:manage:all',
  'system_config:view:all',
  'audit_logs:view:all',
  'audit_logs:export:all',
  'files:manage:all',
  'datasets:manage:all'
);

-- ============================================
-- STEP 6: Create Indexes for Performance
-- ============================================

-- Already created above, but ensure they exist
CREATE INDEX IF NOT EXISTS "users_role_idx" ON "users"("role");
CREATE INDEX IF NOT EXISTS "role_permissions_role_idx" ON "role_permissions"("role");

-- ============================================
-- STEP 7: Clean up
-- ============================================

-- Drop helper function (optional - can keep for future use)
-- DROP FUNCTION IF EXISTS generate_cuid();

-- ============================================
-- Migration Complete
-- ============================================

COMMENT ON TABLE permissions IS 'Stores all available permissions in the system';
COMMENT ON TABLE role_permissions IS 'Maps permissions to roles';
COMMENT ON TABLE user_permission_overrides IS 'Stores user-specific permission overrides';
