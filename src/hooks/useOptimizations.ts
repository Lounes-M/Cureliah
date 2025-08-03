import { useCallback, useEffect, useRef, useState, useMemo } from 'react';

interface UseInfiniteScrollOptions {
  hasNextPage: boolean;
  fetchNextPage: () => void;
  isLoading: boolean;
  threshold?: number;
}

export const useInfiniteScroll = ({
  hasNextPage,
  fetchNextPage,
  isLoading,
  threshold = 100
}: UseInfiniteScrollOptions) => {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const handleIntersection = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry.isIntersecting && hasNextPage && !isLoading) {
        fetchNextPage();
      }
    },
    [hasNextPage, fetchNextPage, isLoading]
  );

  useEffect(() => {
    const element = loadMoreRef.current;
    if (!element) return;

    observerRef.current = new IntersectionObserver(handleIntersection, {
      threshold: 0.1,
      rootMargin: `${threshold}px`,
    });

    observerRef.current.observe(element);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [handleIntersection, threshold]);

  return loadMoreRef;
};

interface UseVirtualizedListOptions {
  itemHeight: number;
  containerHeight: number;
  items: any[];
  overscan?: number;
}

export const useVirtualizedList = ({
  itemHeight,
  containerHeight,
  items,
  overscan = 5
}: UseVirtualizedListOptions) => {
  const scrollElementRef = useRef<HTMLDivElement | null>(null);
  const scrollTop = useRef(0);

  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const totalHeight = items.length * itemHeight;

  const getVisibleRange = useCallback(() => {
    const start = Math.floor(scrollTop.current / itemHeight);
    const end = Math.min(start + visibleCount + overscan, items.length);
    
    return {
      start: Math.max(0, start - overscan),
      end,
    };
  }, [itemHeight, visibleCount, overscan, items.length]);

  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    scrollTop.current = event.currentTarget.scrollTop;
  }, []);

  return {
    scrollElementRef,
    handleScroll,
    getVisibleRange,
    totalHeight,
  };
};

export const useDebounce = <T>(value: T, delay: number): T => {
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
};

export const useOptimizedImages = () => {
  const loadImage = useCallback((src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }, []);

  const preloadImages = useCallback(async (urls: string[]) => {
    const promises = urls.map(url => loadImage(url).catch(() => null));
    return Promise.allSettled(promises);
  }, [loadImage]);

  return { loadImage, preloadImages };
};

export const useMemoizedCallback = <T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList
): T => {
  return useCallback(callback, deps);
};

export const useMemoizedValue = <T>(
  factory: () => T,
  deps: React.DependencyList
): T => {
  return useMemo(factory, deps);
};
