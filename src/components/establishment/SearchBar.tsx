
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Filter } from 'lucide-react';

interface SearchBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  showFilters: boolean;
  onToggleFilters: () => void;
}

export const SearchBar = ({ 
  searchTerm, 
  onSearchChange, 
  showFilters, 
  onToggleFilters 
}: SearchBarProps) => {
  return (
    <div className="mb-6">
      <div className="flex gap-4 items-center">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Rechercher par titre, localisation, spécialité ou médecin..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          variant="outline"
          onClick={onToggleFilters}
          className="flex items-center gap-2"
        >
          <Filter className="w-4 h-4" />
          Filtres
        </Button>
      </div>
    </div>
  );
};
