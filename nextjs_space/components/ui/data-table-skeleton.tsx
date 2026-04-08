/**
 * Data Table Skeleton
 * Loading state cho bảng dữ liệu
 */

import { Skeleton } from './skeleton';
import { cn } from '@/lib/utils';

interface DataTableSkeletonProps {
  columns?: number;
  rows?: number;
  className?: string;
}

export function DataTableSkeleton({
  columns = 5,
  rows = 5,
  className
}: DataTableSkeletonProps) {
  return (
    <div className={cn('w-full', className)}>
      {/* Header */}
      <div className="flex items-center border-b py-3 px-4 gap-4">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={`header-${i}`} className="h-4 flex-1" />
        ))}
      </div>
      
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={`row-${rowIndex}`} className="flex items-center border-b py-4 px-4 gap-4">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton 
              key={`cell-${rowIndex}-${colIndex}`} 
              className="h-4 flex-1" 
              style={{ width: `${Math.random() * 40 + 60}%` }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export default DataTableSkeleton;
