import { redirect } from 'next/navigation';

// Audit fully exists (AuditLog model + /api/audit + admin/audit-logs page).
// Rebuilding it would create a parallel source of truth — instead route through
// to the existing, battle-tested audit log viewer.
export default function BigDataAuditRedirect() {
  redirect('/dashboard/admin/audit-logs');
}
