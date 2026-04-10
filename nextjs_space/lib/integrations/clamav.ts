/**
 * ClamAV Integration – Phase 4
 *
 * Giao tiếp với clamd qua TCP socket để scan virus trước khi upload MinIO.
 * Graceful degradation: nếu CLAMAV_ENABLED=false hoặc clamd không kết nối được,
 * bỏ qua scan và log warning (không block upload ở môi trường dev).
 *
 * Yêu cầu: clamd đang chạy và lắng nghe tại CLAMAV_HOST:CLAMAV_PORT
 */
import 'server-only'
import net from 'net'

const CLAMAV_ENABLED = process.env.CLAMAV_ENABLED !== 'false'
const CLAMAV_HOST = process.env.CLAMAV_HOST ?? '127.0.0.1'
const CLAMAV_PORT = parseInt(process.env.CLAMAV_PORT ?? '3310', 10)
const SCAN_TIMEOUT_MS = 30_000 // 30s – đủ cho file 200MB

// ─── Types ────────────────────────────────────────────────────────────────────

export type ScanResult =
  | { clean: true }
  | { clean: false; threat: string }

// ─── Core scanner ─────────────────────────────────────────────────────────────

/**
 * Scan buffer qua INSTREAM protocol của clamd.
 * Protocol: gửi "zINSTREAM\0" → chunk(4-byte big-endian len + data) → chunk(len=0)
 * Response: "stream: OK" hoặc "stream: {ThreatName} FOUND"
 */
export async function scanBuffer(buffer: Buffer): Promise<ScanResult> {
  if (!CLAMAV_ENABLED) {
    console.warn('[clamav] ClamAV disabled (CLAMAV_ENABLED=false). Skipping scan.')
    return { clean: true }
  }

  return new Promise((resolve, reject) => {
    const socket = new net.Socket()
    let response = ''

    socket.setTimeout(SCAN_TIMEOUT_MS)

    socket.connect(CLAMAV_PORT, CLAMAV_HOST, () => {
      // Bắt đầu INSTREAM session
      socket.write('zINSTREAM\0')

      // Gửi chunk: 4-byte length header + data
      const lenBuf = Buffer.allocUnsafe(4)
      lenBuf.writeUInt32BE(buffer.length, 0)
      socket.write(lenBuf)
      socket.write(buffer)

      // Kết thúc stream: chunk length = 0
      const endBuf = Buffer.allocUnsafe(4)
      endBuf.writeUInt32BE(0, 0)
      socket.write(endBuf)
    })

    socket.on('data', (data) => {
      response += data.toString()
    })

    socket.on('end', () => {
      socket.destroy()
      resolve(parseClamdResponse(response.trim()))
    })

    socket.on('timeout', () => {
      socket.destroy()
      reject(new Error('[clamav] Scan timeout'))
    })

    socket.on('error', (err) => {
      socket.destroy()
      // Không reject khi clamd không available – warn và cho qua
      console.error('[clamav] Connection error:', err.message)
      resolve({ clean: true })
    })
  })
}

// ─── Response parser ──────────────────────────────────────────────────────────

function parseClamdResponse(response: string): ScanResult {
  // clamd trả về: "stream: OK" hoặc "stream: Eicar-Test-Signature FOUND"
  if (response.endsWith('OK')) return { clean: true }

  const match = response.match(/stream:\s+(.+?)\s+FOUND/)
  if (match) return { clean: false, threat: match[1] }

  // Không parse được → coi là sạch nhưng log
  console.warn('[clamav] Unexpected response:', response)
  return { clean: true }
}
