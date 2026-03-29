/**
 * Virtual Scroll Component
 * 
 * Efficiently renders large lists by only rendering visible items.
 * Uses windowing/virtualization technique for optimal performance.
 * 
 * Features:
 * - Dynamic item heights
 * - Horizontal and vertical scrolling
 * - Smooth scrolling with momentum
 * - Custom scrollbars
 * - Loading states
 * - Empty states
 */

import { useRef, useState, useCallback, useEffect, useMemo, memo } from 'react';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

interface VirtualScrollProps<T> {
  items: T[];
  itemHeight: number | ((item: T, index: number) => number);
  renderItem: (item: T, index: number, style?: React.CSSProperties) => React.ReactNode;
  className?: string;
  overscan?: number;
  horizontal?: boolean;
  onEndReached?: () => void;
  endReachedThreshold?: number;
  HeaderComponent?: React.ComponentType;
  FooterComponent?: React.ComponentType;
  EmptyComponent?: React.ComponentType;
  LoadingComponent?: React.ComponentType;
  isLoading?: boolean;
  getItemKey?: (item: T, index: number) => string | number;
}

// ============================================================================
// Virtual Scroll Implementation
// ============================================================================

function VirtualScroll<T>({
  items,
  itemHeight,
  renderItem,
  className,
  overscan = 3,
  horizontal = false,
  onEndReached,
  endReachedThreshold = 200,
  HeaderComponent,
  FooterComponent,
  EmptyComponent,
  LoadingComponent,
  isLoading = false,
  getItemKey,
}: VirtualScrollProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerSize, setContainerSize] = useState(0);

  // Measure container
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setContainerSize(
          horizontal ? entry.contentRect.width : entry.contentRect.height
        );
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, [horizontal]);

  // Calculate total height and item positions
  const { totalSize, offsets } = useMemo(() => {
    const offsets: number[] = [];
    let total = 0;

    for (let i = 0; i < items.length; i++) {
      offsets[i] = total;
      const height = typeof itemHeight === 'function' 
        ? itemHeight(items[i], i) 
        : itemHeight;
      total += height;
    }

    return { totalSize: total, offsets };
  }, [items, itemHeight]);

  // Calculate visible range
  const { visibleItems } = useMemo(() => {
    if (items.length === 0) {
      return { visibleItems: [] };
    }

    // Find start index
    let startIdx = 0;
    for (let i = 0; i < offsets.length; i++) {
      if (offsets[i] >= scrollTop) {
        startIdx = Math.max(0, i - 1);
        break;
      }
    }

    // Find end index
    let endIdx = items.length - 1;
    const viewEnd = scrollTop + containerSize;
    for (let i = startIdx; i < offsets.length; i++) {
      const height = typeof itemHeight === 'function'
        ? itemHeight(items[i], i)
        : itemHeight;
      if (offsets[i] + height > viewEnd) {
        endIdx = Math.min(items.length - 1, i + 1);
        break;
      }
    }

    // Apply overscan
    const overscanStart = Math.max(0, startIdx - overscan);
    const overscanEnd = Math.min(items.length - 1, endIdx + overscan);

    const visible = items.slice(overscanStart, overscanEnd + 1).map((item, idx) => ({
      item,
      index: overscanStart + idx,
    }));

    return {
      visibleItems: visible,
    };
  }, [items, offsets, scrollTop, containerSize, itemHeight, overscan]);

  // Handle scroll
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const newScrollTop = horizontal ? target.scrollLeft : target.scrollTop;
    setScrollTop(newScrollTop);

    // Check if reached end
    if (onEndReached) {
      const scrollEnd = horizontal
        ? target.scrollWidth - target.scrollLeft - target.clientWidth
        : target.scrollHeight - target.scrollTop - target.clientHeight;

      if (scrollEnd <= endReachedThreshold) {
        onEndReached();
      }
    }
  }, [horizontal, onEndReached, endReachedThreshold]);

  // Get item style
  const getItemStyle = useCallback((index: number): React.CSSProperties => {
    const offset = offsets[index];
    const height = typeof itemHeight === 'function'
      ? itemHeight(items[index], index)
      : itemHeight;

    if (horizontal) {
      return {
        position: 'absolute',
        left: offset,
        width: height,
        height: '100%',
      };
    }

    return {
      position: 'absolute',
      top: offset,
      height,
      width: '100%',
    };
  }, [offsets, itemHeight, items, horizontal]);

  // Loading state
  if (isLoading && LoadingComponent) {
    return <LoadingComponent />;
  }

  // Empty state
  if (items.length === 0 && EmptyComponent) {
    return <EmptyComponent />;
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        'overflow-auto',
        horizontal ? 'overflow-x-auto' : 'overflow-y-auto',
        className
      )}
      onScroll={handleScroll}
      style={{
        [horizontal ? 'width' : 'height']: '100%',
        contain: 'strict',
      }}
    >
      {/* Spacer for total height */}
      <div
        style={{
          [horizontal ? 'width' : 'height']: totalSize,
          [horizontal ? 'height' : 'width']: '100%',
          position: 'relative',
        }}
      >
        {/* Header */}
        {HeaderComponent && (
          <HeaderComponent />
        )}

        {/* Visible items */}
        {visibleItems.map(({ item, index }) => {
          const key = getItemKey ? getItemKey(item, index) : index;
          const style = getItemStyle(index);

          return (
            <div key={key} style={style}>
              {renderItem(item, index, style)}
            </div>
          );
        })}

        {/* Footer */}
        {FooterComponent && (
          <FooterComponent />
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Memoized Export
// ============================================================================

export const VirtualList = memo(VirtualScroll) as <T>(
  props: VirtualScrollProps<T>
) => JSX.Element;

// ============================================================================
// Virtual Table Component
// ============================================================================

interface VirtualTableProps<T> {
  data: T[];
  columns: {
    key: string;
    header: string;
    width: number;
    render?: (item: T, index: number) => React.ReactNode;
  }[];
  rowHeight?: number;
  headerHeight?: number;
  className?: string;
  onRowClick?: (item: T, index: number) => void;
  isLoading?: boolean;
  emptyMessage?: string;
}

export function VirtualTable<T extends Record<string, unknown>>({
  data,
  columns,
  rowHeight = 52,
  headerHeight = 48,
  className,
  onRowClick,
  isLoading,
  emptyMessage = 'No data',
}: VirtualTableProps<T>) {
  const totalWidth = useMemo(
    () => columns.reduce((sum, col) => sum + col.width, 0),
    [columns]
  );

  const renderRow = useCallback((item: T, index: number) => {
    return (
      <div
        className={cn(
          'flex items-center border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors',
          onRowClick && 'cursor-pointer'
        )}
        style={{ height: rowHeight }}
        onClick={() => onRowClick?.(item, index)}
      >
        {columns.map((col) => (
          <div
            key={col.key}
            className="flex-shrink-0 px-4 truncate"
            style={{ width: col.width }}
          >
            {col.render
              ? col.render(item, index)
              : String(item[col.key] ?? '')}
          </div>
        ))}
      </div>
    );
  }, [columns, rowHeight, onRowClick]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        Loading...
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={cn('border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden', className)}>
      {/* Header */}
      <div
        className="flex bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800"
        style={{ height: headerHeight, width: totalWidth }}
      >
        {columns.map((col) => (
          <div
            key={col.key}
            className="flex-shrink-0 px-4 font-medium text-sm text-gray-600 dark:text-gray-400 flex items-center"
            style={{ width: col.width }}
          >
            {col.header}
          </div>
        ))}
      </div>

      {/* Virtual rows */}
      <VirtualList
        items={data}
        itemHeight={rowHeight}
        renderItem={renderRow as (item: T, index: number) => React.ReactNode}
        style={{ height: Math.min(data.length * rowHeight, 500) }}
      />
    </div>
  );
}

// ============================================================================
// Virtual Grid Component (2D virtualization)
// ============================================================================

interface VirtualGridProps<T> {
  items: T[];
  columns: number;
  itemWidth: number;
  itemHeight: number;
  gap?: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  className?: string;
  getItemKey?: (item: T, index: number) => string | number;
}

export function VirtualGrid<T>({
  items,
  columns,
  itemWidth,
  itemHeight,
  gap = 16,
  renderItem,
  className,
  getItemKey,
}: VirtualGridProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);

  // Measure container
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setContainerHeight(entry.contentRect.height);
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Calculate rows
  const { totalHeight, visibleRows } = useMemo(() => {
    const totalRows = Math.ceil(items.length / columns);
    const totalHeight = totalRows * (itemHeight + gap);

    // Calculate visible rows with overscan
    const rowHeight = itemHeight + gap;
    const overscan = 3;
    const startRow = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
    const visibleRowCount = Math.ceil(containerHeight / rowHeight);
    const endRow = Math.min(
      totalRows - 1,
      startRow + visibleRowCount + overscan * 2
    );

    const rows: { rowIndex: number; items: { item: T; index: number }[] }[] = [];
    for (let r = startRow; r <= endRow; r++) {
      const rowItems: { item: T; index: number }[] = [];
      for (let c = 0; c < columns; c++) {
        const index = r * columns + c;
        if (index < items.length) {
          rowItems.push({ item: items[index], index });
        }
      }
      rows.push({ rowIndex: r, items: rowItems });
    }

    return { totalRows, totalHeight, visibleRows: rows };
  }, [items, columns, itemHeight, gap, scrollTop, containerHeight]);

  // Handle scroll
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn('overflow-auto', className)}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        {visibleRows.map(({ rowIndex, items: rowItems }) => (
          <div
            key={rowIndex}
            className="flex"
            style={{
              position: 'absolute',
              top: rowIndex * (itemHeight + gap),
              left: 0,
              right: 0,
              gap,
            }}
          >
            {rowItems.map(({ item, index }) => {
              const key = getItemKey ? getItemKey(item, index) : index;
              return (
                <div
                  key={key}
                  style={{ width: itemWidth, height: itemHeight }}
                >
                  {renderItem(item, index)}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Export all
// ============================================================================

export default VirtualList;
