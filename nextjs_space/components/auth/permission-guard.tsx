
/**
 * Permission Guard Component
 * Conditionally renders children based on user permissions
 */

'use client';

import React from 'react';
import { useHasPermission, useHasRole } from '@/hooks/use-permissions';
import { UserRoleType } from '@/lib/rbac-client';

interface PermissionGuardProps {
  children: React.ReactNode;
  permission?: string;
  roles?: UserRoleType[];
  fallback?: React.ReactNode;
  requireAll?: boolean; // If true, requires all conditions. If false, requires any.
}

export function PermissionGuard({
  children,
  permission,
  roles,
  fallback = null,
  requireAll = true,
}: PermissionGuardProps) {
  const { hasPermission: hasRequiredPermission, loading: permissionLoading } =
    useHasPermission(permission || '');
  const { hasRole, userRole } = useHasRole(roles || []);

  // Wait for permission check to complete
  if (permission && permissionLoading) {
    return <>{fallback}</>;
  }

  // Check permissions
  const permissionCheck = permission ? hasRequiredPermission : true;
  const roleCheck = roles && roles.length > 0 ? hasRole : true;

  // Apply logic based on requireAll
  const isAllowed = requireAll
    ? permissionCheck && roleCheck
    : permissionCheck || roleCheck;

  return isAllowed ? <>{children}</> : <>{fallback}</>;
}

/**
 * Show content only if user has permission
 */
export function ShowIfHasPermission({
  permission,
  children,
  fallback = null,
}: {
  permission: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  return (
    <PermissionGuard permission={permission} fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}

/**
 * Show content only if user has role
 */
export function ShowIfHasRole({
  roles,
  children,
  fallback = null,
}: {
  roles: UserRoleType[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  return (
    <PermissionGuard roles={roles} fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}

/**
 * Hide content if user doesn't have permission
 */
export function HideIfNoPermission({
  permission,
  children,
}: {
  permission: string;
  children: React.ReactNode;
}) {
  const { hasPermission, loading } = useHasPermission(permission);

  if (loading || !hasPermission) {
    return null;
  }

  return <>{children}</>;
}
