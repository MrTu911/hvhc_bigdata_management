import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Parse error message từ API response.
 * Hỗ trợ các format: { error }, { message }, { error, details }, string, unknown.
 */
export async function extractApiError(res: Response, fallback = 'Lỗi không xác định'): Promise<string> {
  try {
    const data = await res.json();
    const msg = data?.error || data?.message || data?.detail || fallback;
    const status = res.status;
    // Với 5xx thêm "Lỗi hệ thống" prefix để phân biệt với lỗi nghiệp vụ
    if (status >= 500) return `Lỗi hệ thống (${status}): ${msg}`;
    return msg;
  } catch {
    return `${fallback} (HTTP ${res.status})`;
  }
}

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainingSeconds = seconds % 60

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
}