/**
 * GĐ2.9: Reusable API Fetch Hook với Error Handling
 * - Toast thông báo lỗi
 * - Fallback state khi lỗi
 * - Retry logic
 */

import { useState, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

interface UseApiFetchOptions<T> {
  url: string;
  initialData?: T;
  immediate?: boolean; // Fetch on mount
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  retries?: number;
  retryDelay?: number;
}

interface UseApiFetchReturn<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  reset: () => void;
}

export function useApiFetch<T>(options: UseApiFetchOptions<T>): UseApiFetchReturn<T> {
  const { url, initialData, immediate = true, onSuccess, onError, retries = 0, retryDelay = 1000 } = options;
  const { toast } = useToast();

  const [data, setData] = useState<T | null>(initialData ?? null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async (attempt = 0) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(url);

      if (!response.ok) {
        // Handle specific HTTP errors
        if (response.status === 401) {
          toast({
            title: 'Phiên đăng nhập hết hạn',
            description: 'Vui lòng đăng nhập lại',
            variant: 'destructive',
          });
          throw new Error('Unauthorized - Phiên đăng nhập hết hạn');
        }

        if (response.status === 403) {
          toast({
            title: 'Không có quyền truy cập',
            description: 'Bạn không có quyền thực hiện thao tác này',
            variant: 'destructive',
          });
          throw new Error('Forbidden - Không có quyền truy cập');
        }

        if (response.status === 404) {
          throw new Error('Không tìm thấy dữ liệu');
        }

        if (response.status >= 500) {
          toast({
            title: 'Lỗi hệ thống',
            description: 'Vui lòng thử lại sau',
            variant: 'destructive',
          });
          throw new Error('Server Error - Lỗi hệ thống');
        }

        throw new Error(`HTTP Error: ${response.status}`);
      }

      const result = await response.json();
      
      // Handle API-level errors
      if (result.success === false || result.error) {
        throw new Error(result.error || 'API Error');
      }

      setData(result.data || result);
      onSuccess?.(result.data || result);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      
      // Retry logic
      if (attempt < retries) {
        setTimeout(() => fetchData(attempt + 1), retryDelay);
        return;
      }

      setError(error);
      onError?.(error);
    } finally {
      setLoading(false);
    }
  }, [url, retries, retryDelay, toast, onSuccess, onError]);

  const reset = useCallback(() => {
    setData(initialData ?? null);
    setError(null);
    setLoading(false);
  }, [initialData]);

  useEffect(() => {
    if (immediate) {
      fetchData();
    }
  }, [immediate, fetchData]);

  return {
    data,
    loading,
    error,
    refetch: () => fetchData(),
    reset,
  };
}

/**
 * POST/PUT/DELETE API calls with error handling
 */
interface UseMutationOptions<T, V> {
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

interface UseMutationReturn<T, V> {
  mutate: (url: string, data: V, method?: 'POST' | 'PUT' | 'DELETE' | 'PATCH') => Promise<T | null>;
  loading: boolean;
  error: Error | null;
}

export function useApiMutation<T = unknown, V = unknown>(
  options?: UseMutationOptions<T, V>
): UseMutationReturn<T, V> {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(async (
    url: string,
    data: V,
    method: 'POST' | 'PUT' | 'DELETE' | 'PATCH' = 'POST'
  ): Promise<T | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        if (response.status === 401) {
          toast({
            title: 'Phiên đăng nhập hết hạn',
            description: 'Vui lòng đăng nhập lại',
            variant: 'destructive',
          });
          throw new Error('Unauthorized');
        }

        if (response.status === 403) {
          toast({
            title: 'Không có quyền',
            description: 'Bạn không có quyền thực hiện thao tác này',
            variant: 'destructive',
          });
          throw new Error('Forbidden');
        }

        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP Error: ${response.status}`);
      }

      const result = await response.json();

      if (result.success === false || result.error) {
        throw new Error(result.error || 'API Error');
      }

      toast({
        title: 'Thành công',
        description: result.message || 'Thao tác hoàn tất',
      });

      options?.onSuccess?.(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      
      // Only show toast if not already shown above
      if (!error.message.includes('Unauthorized') && !error.message.includes('Forbidden')) {
        toast({
          title: 'Lỗi',
          description: error.message,
          variant: 'destructive',
        });
      }

      options?.onError?.(error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast, options]);

  return { mutate, loading, error };
}

/**
 * Error boundary fallback component
 */
export function ApiErrorFallback({ 
  error, 
  onRetry,
  message = 'Đã xảy ra lỗi khi tải dữ liệu'
}: { 
  error: Error | null; 
  onRetry?: () => void;
  message?: string;
}) {
  if (!error) return null;

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-muted/50 rounded-lg">
      <div className="text-destructive mb-2">
        <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <p className="text-muted-foreground mb-4">{message}</p>
      <p className="text-sm text-muted-foreground mb-4">{error.message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Thử lại
        </button>
      )}
    </div>
  );
}

/**
 * Loading skeleton for lists
 */
export function ListLoadingSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center space-x-4 animate-pulse">
          <div className="h-10 w-10 rounded-full bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-muted rounded w-3/4" />
            <div className="h-3 bg-muted rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Empty state component
 */
export function EmptyState({ 
  icon,
  title = 'Không có dữ liệu',
  description,
  action,
}: {
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      {icon && <div className="mb-4 text-muted-foreground">{icon}</div>}
      <h3 className="text-lg font-medium mb-2">{title}</h3>
      {description && <p className="text-muted-foreground mb-4">{description}</p>}
      {action}
    </div>
  );
}
