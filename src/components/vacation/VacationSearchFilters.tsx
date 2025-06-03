import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { SearchFilters } from '@/hooks/useVacationSearch';
import { SPECIALITIES } from '@/utils/specialities';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SlidersHorizontal, X } from 'lucide-react';

interface VacationSearchFiltersProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  onSearch: () => void;
  onClearFilters: () => void;
  searchLoading: boolean;
}

export const VacationSearchFilters = ({
  filters,
  onFiltersChange,
  onSearch,
  onClearFilters,
  searchLoading
}: VacationSearchFiltersProps) => {
  const [showFilters, setShowFilters] = useState(false);

  const updateFilter = (key: keyof SearchFilters, value: string) => {
    // Validation des valeurs numériques
    if (key === 'minRate' || key === 'maxRate') {
      const numValue = parseFloat(value);
      if (isNaN(numValue) || numValue < 0) return;
    }

    // Validation des dates
    if (key === 'startDate' || key === 'endDate') {
      if (value && !isValidDate(value)) return;
    }

    // Mettre à jour le filtre
    const newFilters = {
      ...filters,
      [key]: value
    };
    onFiltersChange(newFilters);
  };

  const isValidDate = (dateString: string) => {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
  };

  const handleClearFilters = () => {
    onClearFilters();
    setShowFilters(false);
  };

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2"
        >
          <SlidersHorizontal className="w-4 h-4" />
          {showFilters ? 'Masquer les filtres' : 'Afficher les filtres'}
        </Button>
        {showFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            className="flex items-center gap-2"
          >
            <X className="w-4 h-4" />
            Réinitialiser
          </Button>
        )}
      </div>

      {showFilters && (
        <Card className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="speciality">Spécialité</Label>
              <Select
                value={filters.speciality}
                onValueChange={(value) => updateFilter('speciality', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une spécialité" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Toutes les spécialités</SelectItem>
                  {Object.entries(SPECIALITIES).map(([key, speciality]) => (
                    <SelectItem key={key} value={key}>
                      {speciality.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Localisation</Label>
              <Input
                id="location"
                placeholder="Ville, département..."
                value={filters.location}
                onChange={(e) => updateFilter('location', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="startDate">Date de début</Label>
              <Input
                id="startDate"
                type="date"
                value={filters.startDate}
                onChange={(e) => updateFilter('startDate', e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">Date de fin</Label>
              <Input
                id="endDate"
                type="date"
                value={filters.endDate}
                onChange={(e) => updateFilter('endDate', e.target.value)}
                min={filters.startDate || new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="minRate">Taux horaire minimum (€)</Label>
              <Input
                id="minRate"
                type="number"
                min="0"
                step="0.01"
                value={filters.minRate}
                onChange={(e) => updateFilter('minRate', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxRate">Taux horaire maximum (€)</Label>
              <Input
                id="maxRate"
                type="number"
                min={filters.minRate || "0"}
                step="0.01"
                value={filters.maxRate}
                onChange={(e) => updateFilter('maxRate', e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <Button
              onClick={onSearch}
              disabled={searchLoading}
              className="w-full md:w-auto"
            >
              {searchLoading ? 'Recherche en cours...' : 'Rechercher'}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};
