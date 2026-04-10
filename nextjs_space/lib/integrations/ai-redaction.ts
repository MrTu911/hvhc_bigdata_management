/**
 * AI Redaction Middleware – CSDL-KHQL Phase 8
 *
 * Strips sensitive fields from any object/array before it is sent to an LLM.
 * Must be called on every AI context payload — no exceptions.
 *
 * Rules:
 *   1. Remove top-level keys listed in SENSITIVE_FIELDS.
 *   2. If the record's `sensitivity` field is 'SECRET', redact the entire record
 *      (replace with a placeholder so the AI knows a record exists but cannot see it).
 *   3. Recursively redact nested objects and arrays.
 *
 * The list covers military-specific fields not present in standard Prisma schema
 * but potentially injected by future extensions or direct DB queries.
 */

export const SENSITIVE_FIELDS = [
  'sensitivity',
  'rank',
  'militaryPosition',
  'militaryRank',
  'budgetFinancialDetail',
  'councilVoteDetail',
  'secretFilePath',
  'vote',            // ScientificCouncilMember.vote — ballot secrecy
  'embedding',       // pgvector binary — never useful to LLM and leaks memory
  'fileKey',         // MinIO internal path
  'checksum',
] as const

type AnyObject = Record<string, unknown>

const SENSITIVE_SET = new Set<string>(SENSITIVE_FIELDS)

/** Sentinel returned when an entire SECRET record is redacted */
const SECRET_SENTINEL = { _redacted: true, reason: 'Classification: SECRET — not available to AI' }

/**
 * Recursively redact sensitive fields from an object.
 * Returns a new object; does not mutate the input.
 */
export function redact<T>(value: T): T {
  if (value === null || value === undefined) return value
  if (Array.isArray(value)) return value.map(redact) as T
  if (typeof value !== 'object') return value

  const obj = value as AnyObject

  // If the entire record is SECRET, replace with sentinel
  if (obj['sensitivity'] === 'SECRET') {
    return SECRET_SENTINEL as unknown as T
  }

  const result: AnyObject = {}
  for (const [k, v] of Object.entries(obj)) {
    if (SENSITIVE_SET.has(k)) continue          // drop sensitive key
    result[k] = redact(v)                       // recurse into nested objects
  }
  return result as T
}

/**
 * Redact an array of DB records before building an AI prompt context.
 * Returns the redacted array and the count of fully-redacted (SECRET) records.
 */
export function redactContextItems<T extends AnyObject>(items: T[]): {
  items: T[]
  redactedCount: number
} {
  let redactedCount = 0
  const result = items.map((item) => {
    if (item['sensitivity'] === 'SECRET') {
      redactedCount++
      return SECRET_SENTINEL as unknown as T
    }
    return redact(item)
  })
  return { items: result, redactedCount }
}
