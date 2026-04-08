/**
 * Shared types for M19 MDM services.
 */

/**
 * Discriminated union returned by all MDM admin service methods.
 * Routes call the service and check `result.success` before responding.
 */
export type AdminResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; status: number }
