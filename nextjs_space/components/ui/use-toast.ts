'use client';

/**
 * Re-export từ @/hooks/use-toast để toàn hệ thống dùng CHUNG một toast store.
 *
 * Trước đây file này là bản sao y hệt hooks/use-toast.ts → tạo ra hai in-memory
 * store tách biệt: component <Toaster/> (đọc hooks/use-toast) không hiển thị
 * toast do các trang dispatch qua components/ui/use-toast. Gộp về một nguồn để
 * mọi toast (dù import từ đường dẫn nào) đều hiển thị qua một <Toaster/> duy nhất.
 */
export { useToast, toast } from '@/hooks/use-toast';
