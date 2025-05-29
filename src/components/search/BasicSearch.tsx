
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SearchFilters } from './types';

interface BasicSearchProps {
  filters: SearchFilters;
  onFiltersChange: (newFilters: Partial<SearchFilters>) => void;
}

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

export const BasicSearch = ({ filters, onFiltersChange }: BasicSearchProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Input
        placeholder="Rechercher par nom, titre..."
        value={filters.searchQuery}
        onChange={(e) => onFiltersChange({ searchQuery: e.target.value })}
        className="w-full"
      />
      
      <Select
        value={filters.specialty}
        onValueChange={(value) => onFiltersChange({ specialty: value })}
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
        onChange={(e) => onFiltersChange({ location: e.target.value })}
      />
    </div>
  );
};
