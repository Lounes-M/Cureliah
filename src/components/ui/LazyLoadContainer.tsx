import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Loader2, ChevronDown, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface LazyLoadContainerProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  loadMore: () => Promise<void>;
  hasMore: boolean;
  loading: boolean;
  error?: string | null;
  pageSize?: number;
  className?: string;
  emptyState?: React.ReactNode;
  loadingComponent?: React.ReactNode;
  errorComponent?: React.ReactNode;
  onRetry?: () => void;
}

export function LazyLoadContainer<T>({
  items,
  renderItem,
  loadMore,
  hasMore,
  loading,
  error,
  pageSize = 10,
  className = "",
  emptyState,
  loadingComponent,
  errorComponent,
  onRetry
}: LazyLoadContainerProps<T>) {
  const [visibleItems, setVisibleItems] = useState<T[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const loaderRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialiser les éléments visibles
  useEffect(() => {
    const itemsToShow = items.slice(0, currentPage * pageSize);
    setVisibleItems(itemsToShow);
  }, [items, currentPage, pageSize]);

  // Intersection Observer pour le scroll infini
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && hasMore && !loading && !loadingMore) {
          handleLoadMore();
        }
      },
      {
        rootMargin: '100px',
        threshold: 0.1
      }
    );

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore]);

  const handleLoadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;

    try {
      setLoadingMore(true);
      
      // Si on a déjà assez d'éléments localement, juste augmenter la page
      if (items.length > currentPage * pageSize) {
        setCurrentPage(prev => prev + 1);
      } else {
        // Sinon charger plus de données
        await loadMore();
      }
    } catch (error) {
      // TODO: Replace with logger.error('Error loading more items:', error);
    } finally {
      setLoadingMore(false);
    }
  }, [loadMore, hasMore, loadingMore, items.length, currentPage, pageSize]);

  const handleManualLoad = () => {
    handleLoadMore();
  };

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    }
  };

  // Composant de loading par défaut
  const defaultLoadingComponent = (
    <div className="flex items-center justify-center py-8">
      <div className="flex items-center gap-3 bg-white rounded-xl p-4 shadow-sm border">
        <Loader2 className="w-5 h-5 animate-spin text-medical-blue" />
        <span className="text-gray-700 font-medium">Chargement...</span>
      </div>
    </div>
  );

  // Composant d'erreur par défaut
  const defaultErrorComponent = (
    <Card className="border-red-200 bg-red-50">
      <CardContent className="p-6 text-center">
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <RefreshCw className="w-6 h-6 text-red-600" />
        </div>
        <h3 className="font-semibold text-red-800 mb-2">Erreur de chargement</h3>
        <p className="text-red-600 text-sm mb-4">{error}</p>
        <Button 
          variant="outline" 
          onClick={handleRetry}
          className="border-red-300 text-red-700 hover:bg-red-50"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Réessayer
        </Button>
      </CardContent>
    </Card>
  );

  // État vide par défaut
  const defaultEmptyState = (
    <Card className="border-gray-200 bg-gray-50">
      <CardContent className="p-12 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
        </div>
        <h3 className="font-semibold text-gray-700 mb-2">Aucun résultat</h3>
        <p className="text-gray-500 text-sm">
          Aucun élément ne correspond à vos critères de recherche.
        </p>
      </CardContent>
    </Card>
  );

  // Affichage des erreurs
  if (error && items.length === 0) {
    return (
      <div className={className}>
        {errorComponent || defaultErrorComponent}
      </div>
    );
  }

  // Affichage du loading initial
  if (loading && items.length === 0) {
    return (
      <div className={className}>
        {loadingComponent || defaultLoadingComponent}
      </div>
    );
  }

  // État vide
  if (!loading && items.length === 0) {
    return (
      <div className={className}>
        {emptyState || defaultEmptyState}
      </div>
    );
  }

  return (
    <div ref={containerRef} className={className}>
      {/* Rendu des éléments visibles */}
      <div className="space-y-4">
        {visibleItems.map((item, index) => (
          <div key={index}>
            {renderItem(item, index)}
          </div>
        ))}
      </div>

      {/* Indicateur de chargement pour plus d'éléments */}
      {(hasMore || loadingMore) && (
        <div ref={loaderRef} className="mt-8">
          {loadingMore ? (
            <div className="flex items-center justify-center py-6">
              <div className="flex items-center gap-3 bg-white rounded-xl p-4 shadow-sm border">
                <Loader2 className="w-5 h-5 animate-spin text-medical-blue" />
                <span className="text-gray-700 font-medium">Chargement d'autres résultats...</span>
              </div>
            </div>
          ) : (
            <div className="flex justify-center py-6">
              <Button
                variant="outline"
                onClick={handleManualLoad}
                className="bg-white hover:bg-gray-50 border-gray-200 shadow-sm"
              >
                <ChevronDown className="w-4 h-4 mr-2" />
                Charger plus de résultats
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Indicateur de fin */}
      {!hasMore && items.length > 0 && (
        <div className="text-center py-6">
          <div className="inline-flex items-center gap-2 text-sm text-gray-500 bg-gray-100 rounded-full px-4 py-2">
            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
            Tous les résultats ont été chargés
          </div>
        </div>
      )}
    </div>
  );
}

// Hook pour gérer la pagination et le lazy loading
export function useLazyLoading<T>(
  fetchFunction: (page: number, pageSize: number) => Promise<{ data: T[]; hasMore: boolean }>,
  pageSize: number = 10
) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const loadInitial = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setCurrentPage(1);
      
      const result = await fetchFunction(1, pageSize);
      setItems(result.data);
      setHasMore(result.hasMore);
      setCurrentPage(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [fetchFunction, pageSize]);

  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore) return;

    try {
      setLoadingMore(true);
      setError(null);
      
      const nextPage = currentPage + 1;
      const result = await fetchFunction(nextPage, pageSize);
      
      setItems(prev => [...prev, ...result.data]);
      setHasMore(result.hasMore);
      setCurrentPage(nextPage);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement');
    } finally {
      setLoadingMore(false);
    }
  }, [fetchFunction, pageSize, currentPage, hasMore, loadingMore]);

  const refresh = useCallback(() => {
    loadInitial();
  }, [loadInitial]);

  // Charger les données initiales
  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  return {
    items,
    loading,
    loadingMore,
    error,
    hasMore,
    loadMore,
    refresh,
    currentPage
  };
}

// Composant skeleton pour améliorer l'UX pendant le chargement
export const SkeletonCard: React.FC<{ className?: string }> = ({ className = "" }) => (
  <Card className={`animate-pulse ${className}`}>
    <CardContent className="p-6">
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
        <div className="flex-1 space-y-2">
          <div className="h-5 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
        <div className="w-20 h-8 bg-gray-200 rounded"></div>
      </div>
      <div className="mt-4 space-y-2">
        <div className="h-3 bg-gray-200 rounded"></div>
        <div className="h-3 bg-gray-200 rounded w-4/5"></div>
      </div>
    </CardContent>
  </Card>
);

// Composant pour charger plusieurs skeletons
export const SkeletonGrid: React.FC<{ count?: number; className?: string }> = ({ 
  count = 3, 
  className = "" 
}) => (
  <div className={`space-y-4 ${className}`}>
    {Array.from({ length: count }).map((_, index) => (
      <SkeletonCard key={index} />
    ))}
  </div>
);
