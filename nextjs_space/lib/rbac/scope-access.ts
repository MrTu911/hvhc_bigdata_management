/**
 * Record-level scope enforcement for detail / update / delete routes.
 *
 * Function-code checks (requireFunction) only answer "can this user use this
 * feature". They do NOT answer "can this user touch THIS specific record".
 * List endpoints already narrow results via getAccessibleUnitIds, but by-id
 * endpoints historically skipped that check — letting a UNIT-scoped user read
 * or mutate records outside their unit by guessing IDs (IDOR / scope-bypass).
 *
 * This helper wraps checkScopeAsync so each by-id route can enforce the same
 * ACADEMY / DEPARTMENT / UNIT / SELF boundaries the list routes enforce.
 */

import { NextResponse } from 'next/server';
import { FunctionScope } from '@prisma/client';
import { checkScopeAsync } from './scope';
import type { AuthUser, AuthResult } from './types';

export interface ScopeResourceContext {
  /** Unit the record belongs to (drives UNIT / DEPARTMENT checks). */
  resourceUnitId?: string | null;
  /** Owner user id of the record (drives SELF checks). */
  resourceOwnerId?: string | null;
}

export interface ScopeAccessResult {
  allowed: boolean;
  reason?: string;
}

/**
 * Returns whether `user` (with the given scope) may access a record described
 * by `ctx`. ACADEMY always passes; DEPARTMENT resolves the unit subtree;
 * UNIT requires same unit; SELF requires ownership. Fail-closed on errors.
 */
export async function canAccessResource(
  user: AuthUser,
  scope: FunctionScope,
  ctx: ScopeResourceContext,
): Promise<ScopeAccessResult> {
  return checkScopeAsync(scope, user, {
    resourceUnitId: ctx.resourceUnitId ?? undefined,
    resourceOwnerId: ctx.resourceOwnerId ?? undefined,
  });
}

/**
 * Route guard: returns a 403 NextResponse when the record is out of scope,
 * or `null` when access is allowed (caller continues).
 *
 *   const denied = await enforceScopeAccess(user, authResult, { resourceUnitId });
 *   if (denied) return denied;
 */
export async function enforceScopeAccess(
  user: AuthUser,
  authResult: AuthResult | undefined,
  ctx: ScopeResourceContext,
): Promise<NextResponse | null> {
  // Mirror getScopeFromAuthResult (middleware) without importing it — keeps this
  // helper dependency-light and avoids a circular import with the RBAC middleware.
  const scope: FunctionScope = authResult?.scope ?? 'SELF';
  const result = await canAccessResource(user, scope, ctx);
  if (!result.allowed) {
    return NextResponse.json(
      { success: false, error: result.reason || 'Ngoài phạm vi quyền truy cập' },
      { status: 403 },
    );
  }
  return null;
}
