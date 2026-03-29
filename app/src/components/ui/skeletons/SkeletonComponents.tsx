/**
 * Unified Skeleton Components
 * 
 * Provides consistent loading states across the application:
 * - Skeleton primitive
 * - Dashboard skeleton
 * - Table/List skeleton
 * - Card skeleton
 * - Chart skeleton
 * - Form skeleton
 */

import { memo } from 'react';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

type SkeletonVariant = 'default' | 'pulse' | 'shimmer' | 'wave';

interface SkeletonProps {
  className?: string;
  variant?: SkeletonVariant;
}

// ============================================================================
// Base Skeleton Primitives
// ============================================================================

const variantClasses: Record<SkeletonVariant, string> = {
  default: 'animate-pulse',
  pulse: 'animate-pulse',
  shimmer: 'animate-shimmer bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 bg-[length:200%_100%]',
  wave: 'animate-wave',
};

export const Skeleton = memo(function Skeleton({
  className,
  variant = 'default',
}: SkeletonProps) {
  return (
    <div
      className={cn(
        'bg-gray-200 dark:bg-gray-700 rounded-md',
        variantClasses[variant],
        className
      )}
    />
  );
});

export const SkeletonText = memo(function SkeletonText({
  lines = 3,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            'h-4',
            i === lines - 1 ? 'w-3/4' : 'w-full'
          )}
        />
      ))}
    </div>
  );
});

export const SkeletonCircle = memo(function SkeletonCircle({
  size = 40,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <Skeleton
      className={cn('rounded-full', className)}
      style={{ width: size, height: size }}
    />
  );
});

// ============================================================================
// Dashboard Skeletons
// ============================================================================

export const DashboardSkeleton = memo(function DashboardSkeleton() {
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-32 rounded-lg" />
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <Skeleton className="h-4 w-20" />
              <SkeletonCircle size={32} />
            </div>
            <Skeleton className="h-8 w-28 mb-2" />
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Area */}
        <div className="lg:col-span-2 p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
          <Skeleton className="h-6 w-40 mb-4" />
          <Skeleton className="h-64 w-full" />
        </div>

        {/* Side Panel */}
        <div className="p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
          <Skeleton className="h-6 w-32 mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <SkeletonCircle size={36} />
                <div className="flex-1">
                  <Skeleton className="h-4 w-24 mb-1" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <Skeleton className="h-4 w-12" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});

// ============================================================================
// Table/List Skeletons
// ============================================================================

export const TableSkeleton = memo(function TableSkeleton({
  rows = 5,
  columns = 4,
}: {
  rows?: number;
  columns?: number;
}) {
  return (
    <div className="w-full">
      {/* Header */}
      <div className="grid gap-4 p-4 border-b border-gray-100 dark:border-gray-800"
        style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
      >
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-20" />
        ))}
      </div>

      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className="grid gap-4 p-4 border-b border-gray-50 dark:border-gray-800/50"
          style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} className="h-4" style={{ width: `${60 + Math.random() * 30}%` }} />
          ))}
        </div>
      ))}
    </div>
  );
});

export const ListSkeleton = memo(function ListSkeleton({
  items = 5,
}: {
  items?: number;
}) {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
          <SkeletonCircle size={40} />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-8 w-20 rounded-lg" />
        </div>
      ))}
    </div>
  );
});

// ============================================================================
// Card Skeletons
// ============================================================================

export const CardSkeleton = memo(function CardSkeleton({
  hasImage = true,
  hasActions = true,
}: {
  hasImage?: boolean;
  hasActions?: boolean;
}) {
  return (
    <div className="p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
      {hasImage && <Skeleton className="h-40 w-full rounded-lg mb-4" />}
      <Skeleton className="h-6 w-3/4 mb-2" />
      <SkeletonText lines={2} />
      {hasActions && (
        <div className="flex gap-2 mt-4">
          <Skeleton className="h-9 w-24 rounded-lg" />
          <Skeleton className="h-9 w-24 rounded-lg" />
        </div>
      )}
    </div>
  );
});

export const StatsCardSkeleton = memo(function StatsCardSkeleton() {
  return (
    <div className="p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
      <div className="flex items-center justify-between mb-3">
        <Skeleton className="h-4 w-24" />
        <SkeletonCircle size={32} />
      </div>
      <Skeleton className="h-8 w-28 mb-2" />
      <div className="flex items-center gap-2">
        <Skeleton className="h-3 w-12" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  );
});

// ============================================================================
// Chart Skeletons
// ============================================================================

export const ChartSkeleton = memo(function ChartSkeleton({
  type = 'line',
}: {
  type?: 'line' | 'bar' | 'pie';
}) {
  if (type === 'pie') {
    return (
      <div className="flex items-center justify-center p-4">
        <SkeletonCircle size={200} />
      </div>
    );
  }

  if (type === 'bar') {
    return (
      <div className="flex items-end gap-2 h-48 p-4">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton
            key={i}
            className="flex-1 rounded-t-md"
            style={{ height: `${30 + (i * 10)}%` }}
          />
        ))}
      </div>
    );
  }

  // Line chart skeleton
  return (
    <div className="relative h-48 p-4">
      {/* Grid lines */}
      <div className="absolute inset-4 flex flex-col justify-between">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="border-b border-gray-100 dark:border-gray-800" />
        ))}
      </div>
      {/* Fake line */}
      <Skeleton className="absolute inset-4 h-full w-full clip-path-wave" />
    </div>
  );
});

// ============================================================================
// Form Skeletons
// ============================================================================

export const FormSkeleton = memo(function FormSkeleton({
  fields = 4,
}: {
  fields?: number;
}) {
  return (
    <div className="space-y-6">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      ))}
      <div className="flex gap-3 pt-4">
        <Skeleton className="h-10 w-28 rounded-lg" />
        <Skeleton className="h-10 w-28 rounded-lg" />
      </div>
    </div>
  );
});

// ============================================================================
// Page-level Skeletons
// ============================================================================

export const PageSkeleton = memo(function PageSkeleton({
  type = 'dashboard',
}: {
  type?: 'dashboard' | 'detail' | 'settings' | 'list';
}) {
  switch (type) {
    case 'dashboard':
      return <DashboardSkeleton />;
    case 'detail':
      return (
        <div className="p-6 space-y-6">
          <div className="flex items-center gap-4">
            <SkeletonCircle size={60} />
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-64 rounded-xl" />
            <Skeleton className="h-64 rounded-xl" />
          </div>
        </div>
      );
    case 'settings':
      return (
        <div className="p-6 max-w-2xl mx-auto space-y-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-4">
              <Skeleton className="h-6 w-40" />
              <FormSkeleton fields={3} />
            </div>
          ))}
        </div>
      );
    case 'list':
      return (
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-10 w-32 rounded-lg" />
          </div>
          <ListSkeleton items={8} />
        </div>
      );
    default:
      return <DashboardSkeleton />;
  }
});

// ============================================================================
// Shimmer animation CSS (add to global CSS)
// ============================================================================

/*
Add to your global CSS:
@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.animate-shimmer {
  animation: shimmer 1.5s infinite;
}

@keyframes wave {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}

.animate-wave {
  animation: wave 1.5s ease-in-out infinite;
}
*/
