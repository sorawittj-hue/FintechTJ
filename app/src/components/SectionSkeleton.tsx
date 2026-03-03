import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

interface SectionSkeletonProps {
  type?: 'dashboard' | 'overview' | 'list' | 'grid' | 'chart' | 'settings' | 'default';
  rows?: number;
  columns?: number;
}

/**
 * Section Skeleton Component
 * Provides loading placeholders that match the layout of actual sections
 * Improves perceived performance with content-aware skeletons
 */
export function SectionSkeleton({ 
  type = 'default', 
  rows = 3, 
  columns = 3 
}: SectionSkeletonProps) {
  switch (type) {
    case 'dashboard':
      return <DashboardSkeleton />;
    case 'overview':
      return <OverviewSkeleton />;
    case 'list':
      return <ListSkeleton rows={rows} />;
    case 'grid':
      return <GridSkeleton rows={rows} columns={columns} />;
    case 'chart':
      return <ChartSkeleton />;
    case 'settings':
      return <SettingsSkeleton />;
    default:
      return <DefaultSkeleton />;
  }
}

/**
 * Dashboard Skeleton - Stat cards + chart area
 */
function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Stat Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="border-dashed">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-32" />
                </div>
                <Skeleton className="h-12 w-12 rounded-full" />
              </div>
              <Skeleton className="h-3 w-20 mt-4" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-dashed">
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[300px] w-full rounded-lg" />
          </CardContent>
        </Card>
        <Card className="border-dashed">
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <Skeleton className="h-6 w-16" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-dashed">
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[200px] w-full rounded-lg" />
          </CardContent>
        </Card>
        <Card className="border-dashed">
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/**
 * Overview Skeleton - For portfolio/overview sections
 */
function OverviewSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="border-dashed">
            <CardContent className="p-6">
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-10 w-40" />
              <Skeleton className="h-3 w-24 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content */}
      <Card className="border-dashed">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-56 mt-2" />
            </div>
            <Skeleton className="h-10 w-32" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-6 w-24" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * List Skeleton - For list-based sections
 */
function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-4 animate-pulse">
      <Card className="border-dashed">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[...Array(rows)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-3 border rounded-lg">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-8 w-20" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Grid Skeleton - For grid-based sections
 */
function GridSkeleton({ rows = 2, columns = 3 }: { rows?: number; columns?: number }) {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>
      <div 
        className="grid gap-4"
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      >
        {[...Array(rows * columns)].map((_, i) => (
          <Card key={i} className="border-dashed">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
              <Skeleton className="h-20 w-full rounded-lg" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

/**
 * Chart Skeleton - For chart-heavy sections
 */
function ChartSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-32" />
      </div>
      <Card className="border-dashed">
        <CardContent className="p-6">
          <Skeleton className="h-[400px] w-full rounded-lg" />
        </CardContent>
      </Card>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="border-dashed">
            <CardContent className="p-4">
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-6 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

/**
 * Settings Skeleton - For settings sections
 */
function SettingsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sidebar */}
        <Card className="border-dashed lg:col-span-1">
          <CardContent className="p-4 space-y-2">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </CardContent>
        </Card>
        {/* Content */}
        <Card className="border-dashed lg:col-span-2">
          <CardHeader>
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent className="space-y-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-3 w-48" />
              </div>
            ))}
            <Skeleton className="h-10 w-32" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/**
 * Default Skeleton - Generic loading state
 */
function DefaultSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <Skeleton className="h-8 w-64" />
      <Card className="border-dashed">
        <CardContent className="p-8 space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-[90%]" />
          <Skeleton className="h-4 w-[80%]" />
          <Skeleton className="h-32 w-full rounded-lg" />
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Full Page Loading Skeleton
 * For initial app load
 */
export function FullPageSkeleton() {
  return (
    <div className="min-h-screen bg-background animate-pulse">
      {/* Header */}
      <div className="h-16 border-b flex items-center px-4 gap-4">
        <Skeleton className="h-8 w-32" />
        <div className="flex-1" />
        <Skeleton className="h-10 w-10 rounded-full" />
      </div>
      
      {/* Sidebar + Content */}
      <div className="flex">
        <div className="w-20 border-r min-h-[calc(100vh-4rem)] p-4 space-y-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-10 w-full rounded-lg" />
          ))}
        </div>
        <div className="flex-1 p-8">
          <SectionSkeleton type="dashboard" />
        </div>
      </div>
    </div>
  );
}

export default SectionSkeleton;
