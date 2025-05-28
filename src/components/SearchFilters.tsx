
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, Search, Filter, X } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export interface SearchFiltersProps {
  onFiltersChange: (filters: SearchFilters) => void;
  initialFilters?: Partial<SearchFilters>;
}

export interface SearchFilters {
  searchQuery: string;
  specialty: string;
  location: string;
  dateRange: {
    from: Date | null;
    to: Date | null;
  };
  priceRange: [number, number];
  experienceYears: number;
  rating: number;
  availabilityStatus: string;
}

const SearchFilters = ({ onFiltersChange, initialFilters }: SearchFiltersProps) => {
  const [filters, setFilters] = useState<SearchFilters>({
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

  const specialties = [
    { value: 'all', label: 'Toutes les spécialités' },
    { value: 'cardiology', label: 'Cardiologie' },
    { value: 'neurology', label: 'Neurologie' },
    { value: 'orthopedics', label: 'Orthopédie' },
    { value: 'pediatrics', label: 'Pédiatrie' },
    { value: 'psychiatry', label: 'Psychiatrie' },
    { value: 'radiology', label: 'Radiologie' },
    { value: 'surgery', label: 'Chirurgie' },
    { value: 'general_medicine', label: 'Médecine générale' },
    { value: 'dermatology', label: 'Dermatologie' },
    { value: 'gynecology', label: 'Gynécologie' }
  ];

  const statusOptions = [
    { value: 'all', label: 'Tous les statuts' },
    { value: 'available', label: 'Disponible' },
    { value: 'booked', label: 'Réservé' },
    { value: 'completed', label: 'Terminé' }
  ];

  const updateFilters = (newFilters: Partial<SearchFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    onFiltersChange(updatedFilters);
  };

  const clearFilters = () => {
    const clearedFilters: SearchFilters = {
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
    onFiltersChange(clearedFilters);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.searchQuery) count++;
    if (filters.specialty !== 'all') count++;
    if (filters.location) count++;
    if (filters.dateRange.from || filters.dateRange.to) count++;
    if (filters.priceRange[0] > 0 || filters.priceRange[1] < 200) count++;
    if (filters.experienceYears > 0) count++;
    if (filters.rating > 0) count++;
    if (filters.availabilityStatus !== 'all') count++;
    return count;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Search className="w-5 h-5" />
            <span>Recherche et filtres</span>
            {getActiveFiltersCount() > 0 && (
              <Badge variant="secondary">{getActiveFiltersCount()} filtre(s) actif(s)</Badge>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filtres avancés
            </Button>
            {getActiveFiltersCount() > 0 && (
              <Button variant="outline" size="sm" onClick={clearFilters}>
                <X className="w-4 h-4 mr-2" />
                Effacer
              </Button>
            )}
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Basic Search */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            placeholder="Rechercher par nom, titre..."
            value={filters.searchQuery}
            onChange={(e) => updateFilters({ searchQuery: e.target.value })}
            className="w-full"
          />
          
          <Select
            value={filters.specialty}
            onValueChange={(value) => updateFilters({ specialty: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Spécialité" />
            </SelectTrigger>
            <SelectContent>
              {specialties.map((specialty) => (
                <SelectItem key={specialty.value} value={specialty.value}>
                  {specialty.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            placeholder="Localisation"
            value={filters.location}
            onChange={(e) => updateFilters({ location: e.target.value })}
          />
        </div>

        {/* Advanced Filters */}
        {showAdvanced && (
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
                          updateFilters({ 
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
                          updateFilters({ 
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
                  value={filters.availabilityStatus}
                  onValueChange={(value) => updateFilters({ availabilityStatus: value })}
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
                onValueChange={(value) => updateFilters({ priceRange: value as [number, number] })}
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
                  onValueChange={(value) => updateFilters({ experienceYears: value[0] })}
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
                  onValueChange={(value) => updateFilters({ rating: value[0] })}
                  max={5}
                  min={0}
                  step={0.5}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SearchFilters;
