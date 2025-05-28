
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { DatePickerWithRange } from '@/components/ui/date-picker';
import { Filter, X } from 'lucide-react';
import { SPECIALITIES } from '@/utils/specialities';
import type { DateRange } from "react-day-picker";

interface FilterState {
  speciality: string;
  location: string;
  hourlyRateMin: number;
  hourlyRateMax: number;
  dateRange: DateRange | undefined;
  experienceYears: number;
}

interface AdvancedFiltersProps {
  onFiltersChange: (filters: FilterState) => void;
  onClearFilters: () => void;
}

const AdvancedFilters = ({ onFiltersChange, onClearFilters }: AdvancedFiltersProps) => {
  const [filters, setFilters] = useState<FilterState>({
    speciality: '',
    location: '',
    hourlyRateMin: 0,
    hourlyRateMax: 200,
    dateRange: undefined,
    experienceYears: 0
  });

  const [isExpanded, setIsExpanded] = useState(false);

  const updateFilter = (key: keyof FilterState, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const clearAllFilters = () => {
    const resetFilters: FilterState = {
      speciality: '',
      location: '',
      hourlyRateMin: 0,
      hourlyRateMax: 200,
      dateRange: undefined,
      experienceYears: 0
    };
    setFilters(resetFilters);
    onClearFilters();
  };

  const hasActiveFilters = () => {
    return filters.speciality || 
           filters.location || 
           filters.hourlyRateMin > 0 || 
           filters.hourlyRateMax < 200 ||
           filters.dateRange ||
           filters.experienceYears > 0;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center text-lg">
            <Filter className="w-5 h-5 mr-2" />
            Filtres Avancés
          </CardTitle>
          <div className="flex items-center space-x-2">
            {hasActiveFilters() && (
              <Button variant="outline" size="sm" onClick={clearAllFilters}>
                <X className="w-4 h-4 mr-1" />
                Effacer
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? 'Réduire' : 'Développer'}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="space-y-6">
          {/* Spécialité */}
          <div className="space-y-2">
            <Label>Spécialité</Label>
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

          {/* Localisation */}
          <div className="space-y-2">
            <Label>Localisation</Label>
            <Input
              placeholder="Ville, région..."
              value={filters.location}
              onChange={(e) => updateFilter('location', e.target.value)}
            />
          </div>

          {/* Tarif horaire */}
          <div className="space-y-4">
            <Label>Tarif horaire (€/h)</Label>
            <div className="px-3">
              <Slider
                value={[filters.hourlyRateMin, filters.hourlyRateMax]}
                onValueChange={([min, max]) => {
                  updateFilter('hourlyRateMin', min);
                  updateFilter('hourlyRateMax', max);
                }}
                max={200}
                min={0}
                step={5}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-gray-500 mt-1">
                <span>{filters.hourlyRateMin}€</span>
                <span>{filters.hourlyRateMax}€</span>
              </div>
            </div>
          </div>

          {/* Plage de dates */}
          <div className="space-y-2">
            <Label>Période disponible</Label>
            <DatePickerWithRange
              date={filters.dateRange}
              onDateChange={(date) => updateFilter('dateRange', date)}
            />
          </div>

          {/* Années d'expérience */}
          <div className="space-y-4">
            <Label>Années d'expérience minimum</Label>
            <div className="px-3">
              <Slider
                value={[filters.experienceYears]}
                onValueChange={([value]) => updateFilter('experienceYears', value)}
                max={30}
                min={0}
                step={1}
                className="w-full"
              />
              <div className="text-sm text-gray-500 mt-1">
                {filters.experienceYears} an(s) minimum
              </div>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default AdvancedFilters;
