
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { SearchFilters } from './types';

interface AdvancedFiltersProps {
  filters: SearchFilters;
  onFiltersChange: (newFilters: Partial<SearchFilters>) => void;
}

const statusOptions = [
  { value: 'all', label: 'Tous les statuts' },
  { value: 'available', label: 'Disponible' },
  { value: 'booked', label: 'Réservé' },
  { value: 'completed', label: 'Terminé' }
];

export const AdvancedFilters = ({ filters, onFiltersChange }: AdvancedFiltersProps) => {
  return (
    <div className="space-y-6 pt-4 border-t">
      {/* Date Range */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Période de disponibilité</label>
          <div className="flex space-x-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.dateRange.from ? (
                    format(filters.dateRange.from, 'dd/MM/yyyy', { locale: fr })
                  ) : (
                    'Date de début'
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={filters.dateRange.from || undefined}
                  onSelect={(date) => 
                    onFiltersChange({ 
                      dateRange: { ...filters.dateRange, from: date || null } 
                    })
                  }
                />
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.dateRange.to ? (
                    format(filters.dateRange.to, 'dd/MM/yyyy', { locale: fr })
                  ) : (
                    'Date de fin'
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={filters.dateRange.to || undefined}
                  onSelect={(date) => 
                    onFiltersChange({ 
                      dateRange: { ...filters.dateRange, to: date || null } 
                    })
                  }
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Statut</label>
          <Select
            value={filters.availabilityStatus || 'all'}
            onValueChange={(value) => onFiltersChange({ availabilityStatus: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Price Range */}
      <div>
        <label className="text-sm font-medium mb-2 block">
          Tarif horaire: {filters.priceRange[0]}€ - {filters.priceRange[1]}€
        </label>
        <Slider
          value={filters.priceRange}
          onValueChange={(value) => onFiltersChange({ priceRange: value as [number, number] })}
          max={200}
          min={0}
          step={5}
          className="w-full"
        />
      </div>

      {/* Experience and Rating */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium mb-2 block">
            Expérience minimum: {filters.experienceYears} an(s)
          </label>
          <Slider
            value={[filters.experienceYears]}
            onValueChange={(value) => onFiltersChange({ experienceYears: value[0] })}
            max={30}
            min={0}
            step={1}
            className="w-full"
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">
            Note minimum: {filters.rating}/5
          </label>
          <Slider
            value={[filters.rating]}
            onValueChange={(value) => onFiltersChange({ rating: value[0] })}
            max={5}
            min={0}
            step={0.5}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
};
