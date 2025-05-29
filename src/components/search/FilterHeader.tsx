
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, X } from 'lucide-react';
import { SearchFilters } from './types';

interface FilterHeaderProps {
  activeFiltersCount: number;
  showAdvanced: boolean;
  onToggleAdvanced: () => void;
  onClearFilters: () => void;
}

export const FilterHeader = ({ 
  activeFiltersCount, 
  showAdvanced, 
  onToggleAdvanced, 
  onClearFilters 
}: FilterHeaderProps) => {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <Search className="w-5 h-5" />
        <span>Recherche et filtres</span>
        {activeFiltersCount > 0 && (
          <Badge variant="secondary">{activeFiltersCount} filtre(s) actif(s)</Badge>
        )}
      </div>
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onToggleAdvanced}
        >
          <Filter className="w-4 h-4 mr-2" />
          Filtres avancés
        </Button>
        {activeFiltersCount > 0 && (
          <Button variant="outline" size="sm" onClick={onClearFilters}>
            <X className="w-4 h-4 mr-2" />
            Effacer
          </Button>
        )}
      </div>
    </div>
  );
};
