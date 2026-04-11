/**
 * IP Guard — SECRET-level access control
 *
 * Thiết kế §7.1: Dữ liệu mức MẬT chỉ được phục vụ từ IP nội bộ.
 *
 * Env var: SCIENCE_SECRET_IP_WHITELIST
 *   Danh sách IP/CIDR ngăn cách bởi dấu phẩy.
 *   Hỗ trợ: exact IPv4, IPv6 exact, IPv4 CIDR (e.g. 192.168.1.0/24).
 *   Mặc định: 127.0.0.1,::1 (chỉ localhost — buộc cấu hình rõ ở production).
 *
 * Ví dụ .env:
 *   SCIENCE_SECRET_IP_WHITELIST=127.0.0.1,::1,10.10.0.0/16,192.168.1.0/24
 */

import { NextRequest, NextResponse } from 'next/server'

// ─── Internal types ───────────────────────────────────────────────────────────

type ExactEntry = { kind: 'exact'; ip: string }
type CidrEntry  = { kind: 'cidr';  network: number; mask: number }
type IpEntry    = ExactEntry | CidrEntry

// ─── IPv4 helpers ─────────────────────────────────────────────────────────────

function ipv4ToInt(ip: string): number | null {
  const parts = ip.split('.')
  if (parts.length !== 4) return null

  let result = 0
  for (const part of parts) {
    const n = parseInt(part, 10)
    if (isNaN(n) || n < 0 || n > 255) return null
    result = (result << 8) | n
  }
  return result >>> 0
}

function parseCidrEntry(cidr: string): IpEntry | null {
  const slashIdx = cidr.indexOf('/')
  if (slashIdx === -1) return { kind: 'exact', ip: cidr }

  const ipStr    = cidr.slice(0, slashIdx)
  const prefixStr = cidr.slice(slashIdx + 1)
  const prefix   = parseInt(prefixStr, 10)

  if (isNaN(prefix) || prefix < 0 || prefix > 32) return null

  const ipInt = ipv4ToInt(ipStr)
  if (ipInt === null) return null

  // prefix=0 → all IPs match (wildcard); prefix=32 → exact host
  const mask    = prefix === 0 ? 0 : ((0xffffffff << (32 - prefix)) >>> 0)
  const network = (ipInt & mask) >>> 0

  return { kind: 'cidr', network, mask }
}

// ─── Whitelist — parsed once at startup ──────────────────────────────────────

let _whitelist: IpEntry[] | null = null

function getWhitelist(): IpEntry[] {
  if (_whitelist) return _whitelist

  const raw = process.env.SCIENCE_SECRET_IP_WHITELIST ?? '127.0.0.1,::1'

  _whitelist = raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((entry) => parseCidrEntry(entry))
    .filter((e): e is IpEntry => e !== null)

  return _whitelist
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Kiểm tra IP có nằm trong whitelist nội bộ không.
 * Hỗ trợ IPv4 exact, IPv4 CIDR, IPv6 exact match.
 */
export function isInternalIp(ip: string): boolean {
  const whitelist = getWhitelist()

  for (const entry of whitelist) {
    if (entry.kind === 'exact') {
      if (entry.ip === ip) return true
      continue
    }

    // CIDR — IPv4 only
    const ipInt = ipv4ToInt(ip)
    if (ipInt === null) continue
    if ((ipInt & entry.mask) >>> 0 === entry.network) return true
  }

  return false
}

/**
 * Trích IP thực của client từ request headers.
 * Ưu tiên X-Real-IP (set bởi nginx), sau đó X-Forwarded-For đầu tiên.
 * Trả '0.0.0.0' nếu không xác định được.
 */
export function extractClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-real-ip') ??
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    '0.0.0.0'
  )
}

export type IpGuardAllowed  = { allowed: true;  clientIp: string }
export type IpGuardDenied   = { allowed: false; clientIp: string; response: NextResponse }
export type IpGuardResult   = IpGuardAllowed | IpGuardDenied

/**
 * Chặn request không đến từ IP nội bộ.
 * Dùng cho route mà 100% response là dữ liệu SECRET.
 *
 * @example
 * const ipCheck = requireInternalIp(req)
 * if (!ipCheck.allowed) return ipCheck.response
 */
export function requireInternalIp(req: NextRequest): IpGuardResult {
  const clientIp = extractClientIp(req)

  if (!isInternalIp(clientIp)) {
    return {
      allowed: false,
      clientIp,
      response: NextResponse.json(
        {
          success: false,
          data:    null,
          error:   'Dữ liệu MẬT chỉ được truy cập từ mạng nội bộ',
        },
        { status: 403 },
      ),
    }
  }

  return { allowed: true, clientIp }
}

/**
 * Lọc danh sách sensitivity levels dựa trên IP.
 * Nếu caller là external IP, loại bỏ 'SECRET' ra khỏi danh sách cho phép.
 * Dùng cho route trả mixed sensitivity (search, project list, ...).
 *
 * @example
 * const allowed = filterSensitivitiesByIp(['NORMAL', 'CONFIDENTIAL', 'SECRET'], clientIp)
 * // external IP → ['NORMAL', 'CONFIDENTIAL']
 * // internal IP → ['NORMAL', 'CONFIDENTIAL', 'SECRET']
 */
export function filterSensitivitiesByIp(
  allowedByClearance: string[],
  clientIp: string,
): string[] {
  if (isInternalIp(clientIp)) return allowedByClearance

  // External IP: downgrade — loại bỏ SECRET thay vì block toàn bộ request.
  // Lý do: user có thể search CONFIDENTIAL/NORMAL từ ngoài; chỉ SECRET mới cần LAN.
  return allowedByClearance.filter((s) => s !== 'SECRET')
}
