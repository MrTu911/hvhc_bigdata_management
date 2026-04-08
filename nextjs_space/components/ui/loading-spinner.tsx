/**
 * Loading Spinner Component
 * Các kiểu loading khác nhau
 */

import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  text?: string;
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-8 w-8',
  lg: 'h-12 w-12'
};

export function LoadingSpinner({ size = 'md', className, text }: LoadingSpinnerProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-2', className)}>
      <Loader2 className={cn('animate-spin text-primary', sizeClasses[size])} />
      {text && <p className="text-sm text-muted-foreground">{text}</p>}
    </div>
  );
}

export function PageLoading() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <LoadingSpinner size="lg" text="Đang tải..." />
    </div>
  );
}

export function InlineLoading({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Loader2 className="h-4 w-4 animate-spin" />
      <span className="text-sm text-muted-foreground">Đang tải...</span>
    </div>
  );
}

export default LoadingSpinner;
