import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X } from 'lucide-react';

interface FilterState {
  location: string;
  speciality: string;
  startDate: string;
  endDate: string;
  minRate: string;
  maxRate: string;
}

interface VacationFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onReset: () => void;
}

const SPECIALITIES = [
  { value: 'general_medicine', label: 'Médecine générale' },
  { value: 'cardiology', label: 'Cardiologie' },
  { value: 'dermatology', label: 'Dermatologie' },
  { value: 'pediatrics', label: 'Pédiatrie' },
  { value: 'psychiatry', label: 'Psychiatrie' },
  { value: 'surgery', label: 'Chirurgie' },
  { value: 'emergency', label: 'Urgences' },
  { value: 'radiology', label: 'Radiologie' },
  { value: 'anesthesiology', label: 'Anesthésiologie' },
  { value: 'gynecology', label: 'Gynécologie' }
];

const VacationFilters = ({ filters, onFiltersChange, onReset }: VacationFiltersProps) => {
  const updateFilter = (key: keyof FilterState, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== '');

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">Filtres de recherche</CardTitle>
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={onReset}
              className="flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Effacer
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Localisation */}
          <div className="space-y-2">
            <Label htmlFor="location">Localisation</Label>
            <Input
              id="location"
              placeholder="Ville, département..."
              value={filters.location}
              onChange={(e) => updateFilter('location', e.target.value)}
            />
          </div>

          {/* Spécialité */}
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
                <SelectItem value="all">Toutes les spécialités</SelectItem>
                {SPECIALITIES.map((spec) => (
                  <SelectItem key={spec.value} value={spec.value}>
                    {spec.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date de début */}
          <div className="space-y-2">
            <Label htmlFor="startDate">Date de début (à partir de)</Label>
            <Input
              id="startDate"
              type="date"
              value={filters.startDate}
              onChange={(e) => updateFilter('startDate', e.target.value)}
            />
          </div>

          {/* Date de fin */}
          <div className="space-y-2">
            <Label htmlFor="endDate">Date de fin (jusqu'au)</Label>
            <Input
              id="endDate"
              type="date"
              value={filters.endDate}
              onChange={(e) => updateFilter('endDate', e.target.value)}
            />
          </div>

          {/* Tarif minimum */}
          <div className="space-y-2">
            <span style={{background:'#fffbe6',color:'#ad8b00',padding:'4px 8px',borderRadius:'4px',fontWeight:'bold'}}>Le tarif de la vacation est fixé par l'établissement ou la plateforme. Vous ne pouvez pas le modifier.</span>
            <Input
              id="minRate"
              type="number"
              placeholder="Ex: 50"
              value={filters.minRate}
              onChange={(e) => updateFilter('minRate', e.target.value)}
            />
          </div>

          {/* Tarif maximum */}
          <div className="space-y-2">
            <span style={{background:'#fffbe6',color:'#ad8b00',padding:'4px 8px',borderRadius:'4px',fontWeight:'bold'}}>Le tarif de la vacation est fixé par l'établissement ou la plateforme. Vous ne pouvez pas le modifier.</span>
            <Input
              id="maxRate"
              type="number"
              placeholder="Ex: 150"
              value={filters.maxRate}
              onChange={(e) => updateFilter('maxRate', e.target.value)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default VacationFilters;
