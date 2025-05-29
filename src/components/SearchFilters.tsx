
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FilterHeader } from './search/FilterHeader';
import { BasicSearch } from './search/BasicSearch';
import { AdvancedFilters } from './search/AdvancedFilters';
import { SearchFilters as SearchFiltersType, SearchFiltersProps } from './search/types';

const SearchFilters = ({ onFiltersChange, initialFilters }: SearchFiltersProps) => {
  const [filters, setFilters] = useState<SearchFiltersType>({
    searchQuery: '',
    specialty: 'all',
    location: '',
    dateRange: { from: null, to: null },
    priceRange: [0, 200],
    experienceYears: 0,
    rating: 0,
    availabilityStatus: 'all',
    ...initialFilters
  });

  const [showAdvanced, setShowAdvanced] = useState(false);

  const updateFilters = (newFilters: Partial<SearchFiltersType>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    
    // Always call the callback function to notify parent component
    if (onFiltersChange) {
      onFiltersChange(updatedFilters);
    }
  };

  const clearFilters = () => {
    const clearedFilters: SearchFiltersType = {
      searchQuery: '',
      specialty: 'all',
      location: '',
      dateRange: { from: null, to: null },
      priceRange: [0, 200],
      experienceYears: 0,
      rating: 0,
      availabilityStatus: 'all'
    };
    setFilters(clearedFilters);
    
    if (onFiltersChange) {
      onFiltersChange(clearedFilters);
    }
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.searchQuery && filters.searchQuery.trim()) count++;
    if (filters.specialty && filters.specialty !== 'all') count++;
    if (filters.location && filters.location.trim()) count++;
    if (filters.dateRange.from || filters.dateRange.to) count++;
    if (filters.priceRange[0] > 0 || filters.priceRange[1] < 200) count++;
    if (filters.experienceYears > 0) count++;
    if (filters.rating > 0) count++;
    if (filters.availabilityStatus && filters.availabilityStatus !== 'all') count++;
    return count;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>
          <FilterHeader
            activeFiltersCount={getActiveFiltersCount()}
            showAdvanced={showAdvanced}
            onToggleAdvanced={() => setShowAdvanced(!showAdvanced)}
            onClearFilters={clearFilters}
          />
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        <BasicSearch filters={filters} onFiltersChange={updateFilters} />
        
        {showAdvanced && (
          <AdvancedFilters filters={filters} onFiltersChange={updateFilters} />
        )}
      </CardContent>
    </Card>
  );
};

export default SearchFilters;
export type { SearchFilters as SearchFiltersType, SearchFiltersProps };
