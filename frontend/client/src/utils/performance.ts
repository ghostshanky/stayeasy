import React, { memo, useMemo, useCallback, useRef, useEffect, useState } from 'react';

// Performance monitoring interface
export interface PerformanceMetrics {
  renderTime: number;
  componentMountTime: number;
  memoryUsage?: number;
  interactionTime?: number;
}

// Performance hook for monitoring component performance
export function usePerformance(componentName: string) {
  const mountTime = useRef<number>(0);
  const renderTimes = useRef<number[]>([]);
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);

  mountTime.current = performance.now();

  const measureRender = useCallback(() => {
    const renderEndTime = performance.now();
    const renderTime = renderEndTime - mountTime.current;
    renderTimes.current.push(renderTime);

    // Keep only last 10 render times
    if (renderTimes.current.length > 10) {
      renderTimes.current = renderTimes.current.slice(-10);
    }

    const avgRenderTime = renderTimes.current.reduce((a, b) => a + b, 0) / renderTimes.current.length;

    const componentMetrics: PerformanceMetrics = {
      renderTime: renderTime,
      componentMountTime: mountTime.current,
      memoryUsage: (performance as any).memory?.usedJSHeapSize,
    };

    setMetrics(componentMetrics);

    // Log performance metrics in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔍 [Performance] ${componentName}:`, {
        currentRender: `${renderTime.toFixed(2)}ms`,
        averageRender: `${avgRenderTime.toFixed(2)}ms`,
        memoryUsage: componentMetrics.memoryUsage ? `${(componentMetrics.memoryUsage / 1024 / 1024).toFixed(2)}MB` : 'N/A',
      });
    }
  }, [componentName]);

  return { metrics, measureRender };
}

// Debounce utility
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Debounce state hook
export function useDebouncedState<T>(initialValue: T, delay: number): [T, T, React.Dispatch<React.SetStateAction<T>>] {
  const [value, setValue] = useState<T>(initialValue);
  const [debouncedValue, setDebouncedValue] = useState<T>(initialValue);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return [debouncedValue, value, setValue];
}

// Throttle utility
export function useThrottle<T>(value: T, limit: number): T {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const lastRan = useRef<number>(0);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (lastRan.current === null || Date.now() - lastRan.current >= limit) {
        setThrottledValue(value);
        lastRan.current = Date.now();
      }
    }, limit - (Date.now() - lastRan.current));

    return () => {
      clearTimeout(handler);
    };
  }, [value, limit]);

  return throttledValue;
}

// Intersection Observer for lazy loading
export function useIntersectionObserver(
  elementRef: React.RefObject<Element>,
  options: IntersectionObserverInit = {}
): {
  isIntersecting: boolean;
  entry: IntersectionObserverEntry | null;
} {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
      setEntry(entry);
    }, options);

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [elementRef, options]);

  return { isIntersecting, entry };
}

// Virtual scroll hook
export function useVirtualScroll<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number,
  overscan: number = 5
) {
  const [scrollTop, setScrollTop] = useState(0);

  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );

  const visibleItems = items.slice(startIndex, endIndex + 1);
  const totalHeight = items.length * itemHeight;
  const offsetY = startIndex * itemHeight;

  return {
    visibleItems,
    totalHeight,
    offsetY,
    startIndex,
    endIndex,
    setScrollTop,
  };
}

// Performance-optimized list component
export function VirtualList<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  overscan = 5,
}: {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  overscan?: number;
}) {
  const { visibleItems, totalHeight, offsetY, setScrollTop } = useVirtualScroll(
    items,
    itemHeight,
    containerHeight,
    overscan
  );

  return React.createElement('div', {
    style: { height: containerHeight, overflow: 'auto' },
    onScroll: (e: React.UIEvent<HTMLDivElement>) => setScrollTop(e.currentTarget.scrollTop)
  },
    React.createElement('div', { style: { height: totalHeight, position: 'relative' } },
      React.createElement('div', { style: { position: 'absolute', top: offsetY, width: '100%' } },
        visibleItems.map((item, index) => 
          React.createElement('div', {
            key: index,
            style: {
              height: itemHeight,
              position: 'absolute',
              top: index * itemHeight,
              width: '100%',
            }
          },
            renderItem(item, index)
          )
        )
      )
    )
  );
}

// Memoized component with performance tracking
export function withPerformanceTracking<T extends React.ComponentType<any>>(
  Component: T,
  componentName: string
): T {
  const MemoizedComponent = memo(Component);
  
  const TrackedComponent = (props: Parameters<T>[0]) => {
    const { measureRender } = usePerformance(componentName);
    
    return useMemo(() => {
      return React.createElement(MemoizedComponent, { ...props, measureRender });
    }, [props, measureRender]);
  };

  return TrackedComponent as T;
}

// Optimized image component with lazy loading
export function OptimizedImage({
  src,
  alt,
  placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2ZmZiIvPgogIDxyZWN0IHg9IjAiIHk9IjAiIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjZmZmIi8+CiAgPHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPuWbvueJh+WbvueJhTwvdGV4dD4KPC9zdmc+',
  className = '',
  onLoad,
  onError,
  ...props
}: {
  src: string;
  alt: string;
  placeholder?: string;
  className?: string;
  onLoad?: () => void;
  onError?: () => void;
  [key: string]: any;
}) {
  const [imageSrc, setImageSrc] = useState(placeholder);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  const { isIntersecting } = useIntersectionObserver(imgRef, {
    threshold: 0.1,
  });

  useEffect(() => {
    if (isIntersecting && !isLoaded && !hasError) {
      const img = new Image();
      img.onload = () => {
        setImageSrc(src);
        setIsLoaded(true);
        onLoad?.();
      };
      img.onerror = () => {
        setHasError(true);
        onError?.();
      };
      img.src = src;
    }
  }, [isIntersecting, src, isLoaded, hasError, onLoad, onError]);

  return React.createElement('img', {
    ref: imgRef,
    src: imageSrc,
    alt: alt,
    className: `transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-70'} ${className}`,
    ...props
  });
}

// Performance-optimized search hook
export function useOptimizedSearch<T>(
  items: T[],
  searchFn: (item: T, query: string) => boolean,
  debounceMs: number = 300
) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [results, setResults] = useState<T[]>(items);
  const [isSearching, setIsSearching] = useState(false);

  // Debounce the search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [query, debounceMs]);

  // Perform search when debounced query changes
  useEffect(() => {
    if (!debouncedQuery) {
      setResults(items);
      return;
    }

    setIsSearching(true);

    // Use requestAnimationFrame for non-blocking search
    const performSearch = () => {
      const filteredItems = items.filter(item => searchFn(item, debouncedQuery));
      setResults(filteredItems);
      setIsSearching(false);
    };

    const animationFrame = requestAnimationFrame(performSearch);

    return () => {
      cancelAnimationFrame(animationFrame);
    };
  }, [debouncedQuery, items, searchFn]);

  return {
    query,
    setQuery,
    results,
    isSearching,
  };
}

// Performance metrics collector
export class PerformanceCollector {
  private static instance: PerformanceCollector;
  private metrics: Map<string, PerformanceMetrics[]> = new Map();

  static getInstance(): PerformanceCollector {
    if (!PerformanceCollector.instance) {
      PerformanceCollector.instance = new PerformanceCollector();
    }
    return PerformanceCollector.instance;
  }

  recordMetric(componentName: string, metric: PerformanceMetrics): void {
    if (!this.metrics.has(componentName)) {
      this.metrics.set(componentName, []);
    }

    const componentMetrics = this.metrics.get(componentName)!;
    componentMetrics.push(metric);

    // Keep only last 100 metrics per component
    if (componentMetrics.length > 100) {
      componentMetrics.shift();
    }

    // Log performance warnings in development
    if (process.env.NODE_ENV === 'development') {
      if (metric.renderTime > 100) {
        console.warn(`⚠️ [Performance] ${componentName} slow render: ${metric.renderTime.toFixed(2)}ms`);
      }
    }
  }

  getMetrics(componentName?: string): PerformanceMetrics[] | Map<string, PerformanceMetrics[]> {
    if (componentName) {
      return this.metrics.get(componentName) || [];
    }
    return this.metrics;
  }

  getAverageMetrics(componentName: string): Partial<PerformanceMetrics> {
    const componentMetrics = this.metrics.get(componentName) || [];
    if (componentMetrics.length === 0) {
      return {};
    }

    const avgRenderTime = componentMetrics.reduce((sum, m) => sum + m.renderTime, 0) / componentMetrics.length;
    const avgMemoryUsage = componentMetrics.reduce((sum, m) => sum + (m.memoryUsage || 0), 0) / componentMetrics.length;

    return {
      renderTime: avgRenderTime,
      memoryUsage: avgMemoryUsage,
    };
  }

  clearMetrics(componentName?: string): void {
    if (componentName) {
      this.metrics.delete(componentName);
    } else {
      this.metrics.clear();
    }
  }
}

// Global performance collector instance
export const performanceCollector = PerformanceCollector.getInstance();

// Hook for collecting performance metrics
export function usePerformanceCollector(componentName: string) {
  const { metrics, measureRender } = usePerformance(componentName);

  useEffect(() => {
    if (metrics) {
      performanceCollector.recordMetric(componentName, metrics);
    }
  }, [metrics, componentName]);

  return { metrics, measureRender };
}

// Export all utilities and hooks
export {
  useDebounce,
  useDebouncedState,
  useThrottle,
  useIntersectionObserver,
  useVirtualScroll,
  useOptimizedSearch,
  usePerformanceCollector,
};

// Export components
export {
  VirtualList,
  OptimizedImage,
};

// Export types
export type {
  PerformanceMetrics,
};