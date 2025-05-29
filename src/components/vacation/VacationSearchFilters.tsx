
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter } from 'lucide-react';
import { SPECIALITIES } from '@/utils/specialities';

interface SearchFilters {
  speciality: string;
  location: string;
  minRate: string;
  maxRate: string;
  startDate: string;
  endDate: string;
}

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
    onFiltersChange({ ...filters, [key]: value });
  };

  return (
    <Card className="mb-8">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center">
            <Search className="w-5 h-5 mr-2" />
            Recherche et filtres
          </CardTitle>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-4 h-4 mr-2" />
            {showFilters ? 'Masquer' : 'Afficher'} les filtres
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <div className="space-y-2">
              <Label htmlFor="speciality">Spécialité</Label>
              <Select 
                value={filters.speciality} 
                onValueChange={(value) => updateFilter('speciality', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Toutes les spécialités" />
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
              <Label htmlFor="location">Lieu</Label>
              <Input
                id="location"
                placeholder="Ville, région..."
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
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">Date de fin</Label>
              <Input
                id="endDate"
                type="date"
                value={filters.endDate}
                onChange={(e) => updateFilter('endDate', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="minRate">Tarif min (€/h)</Label>
              <Input
                id="minRate"
                type="number"
                placeholder="0"
                value={filters.minRate}
                onChange={(e) => updateFilter('minRate', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxRate">Tarif max (€/h)</Label>
              <Input
                id="maxRate"
                type="number"
                placeholder="200"
                value={filters.maxRate}
                onChange={(e) => updateFilter('maxRate', e.target.value)}
              />
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <Button onClick={onSearch} disabled={searchLoading}>
            {searchLoading ? 'Recherche...' : 'Rechercher'}
          </Button>
          <Button variant="outline" onClick={onClearFilters}>
            Réinitialiser
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
