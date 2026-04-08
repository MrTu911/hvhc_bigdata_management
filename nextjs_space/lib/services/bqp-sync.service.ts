/**
 * BQP Sync Service — abstraction point for future BQP (Bộ Quốc phòng) integration.
 *
 * Phase 1 (current): stub / local-only.  All methods return mock responses so
 * the rest of the codebase can code against a stable interface without waiting
 * for BQP connectivity.
 *
 * When real BQP API credentials and spec are available:
 *   1. Implement the concrete methods below (replace throw / stub returns).
 *   2. Add the real HTTP client (e.g. axios or native fetch with mTLS certs).
 *   3. Store BQP_API_URL, BQP_API_KEY in .env and expose via utils/config.ts.
 *   4. Remove the STUB_MODE guard.
 *
 * Do NOT add real outbound network calls here until BQP integration is approved.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BqpProjectPayload {
  projectCode:  string
  title:        string
  field:        string
  budgetYear:   number | null
  status:       string
  principalInvestigatorName: string | null
}

export interface BqpSyncResult {
  success:   boolean
  bqpRefId?: string   // External reference ID returned by BQP (future)
  message:   string
  syncedAt:  Date
}

export interface BqpPublicationPayload {
  title:          string
  publishedYear:  number
  type:           string
  journalOrVenue: string | null
  authorNames:    string[]
}

// ─── Service ──────────────────────────────────────────────────────────────────

const STUB_MODE = true  // flip to false when real BQP API is ready

class BqpSyncService {
  /**
   * Push a single research project record to BQP system.
   * Currently a no-op stub that logs locally.
   */
  async syncProject(payload: BqpProjectPayload): Promise<BqpSyncResult> {
    if (STUB_MODE) {
      console.info('[bqp-sync] STUB syncProject', payload.projectCode)
      return {
        success:  true,
        message:  'Stub: BQP sync not yet connected. Record queued locally.',
        syncedAt: new Date(),
      }
    }

    // TODO: replace with real BQP HTTP call
    throw new Error('BQP real sync not implemented')
  }

  /**
   * Push a publication record to BQP.
   */
  async syncPublication(payload: BqpPublicationPayload): Promise<BqpSyncResult> {
    if (STUB_MODE) {
      console.info('[bqp-sync] STUB syncPublication', payload.title.slice(0, 40))
      return {
        success:  true,
        message:  'Stub: BQP sync not yet connected.',
        syncedAt: new Date(),
      }
    }

    throw new Error('BQP real sync not implemented')
  }

  /**
   * Batch-push multiple projects (e.g. nightly job).
   * Returns per-item results.
   */
  async syncProjects(payloads: BqpProjectPayload[]): Promise<BqpSyncResult[]> {
    return Promise.all(payloads.map((p) => this.syncProject(p)))
  }

  /**
   * Health-check whether the BQP endpoint is reachable.
   */
  async ping(): Promise<{ reachable: boolean; latencyMs?: number }> {
    if (STUB_MODE) {
      return { reachable: false }
    }

    // TODO: HEAD /ping against BQP_API_URL
    throw new Error('BQP real ping not implemented')
  }
}

export const bqpSyncService = new BqpSyncService()
