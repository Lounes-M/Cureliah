import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter } from 'lucide-react';
import { Speciality, VacationStatus } from '@/types/database';
import { SPECIALITIES } from '@/utils/specialities';
import DateSelector from './DateSelector';

interface AdvancedSearchProps {
  onSearch: (filters: SearchFilters) => void;
}

export interface SearchFilters {
  query: string;
  speciality?: string;
  status?: VacationStatus;
  startDate?: string;
  endDate?: string;
  minRate?: number;
  maxRate?: number;
  location?: string;
}

const AdvancedSearch = ({ onSearch }: AdvancedSearchProps) => {
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
  });

  const handleChange = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('=== FORM SUBMIT TRIGGERED ===');
    console.log('Filtres avant envoi:', filters);
    
    // Nettoyage des filtres vides
    const cleanedFilters = Object.entries(filters).reduce((acc, [key, value]) => {
      if (value !== undefined && value !== '' && value !== 'all') {
        acc[key] = value;
      }
      return acc;
    }, {} as SearchFilters);
    
    console.log('Filtres nettoyés:', cleanedFilters);
    onSearch(cleanedFilters);
  };

  const handleReset = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('=== RESET BUTTON CLICKED ===');
    const resetFilters = {
      query: '',
      speciality: 'all',
      status: undefined,
      startDate: undefined,
      endDate: undefined,
      minRate: undefined,
      maxRate: undefined,
      location: undefined
    };
    console.log('Filtres réinitialisés:', resetFilters);
    setFilters(resetFilters);
    onSearch(resetFilters);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Search className="w-5 h-5 mr-2" />
          Recherche avancée
        </CardTitle>
        <CardDescription>
          Filtrez vos vacations selon vos critères
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="query">Recherche</Label>
              <Input
                id="query"
                placeholder="Rechercher par titre, description..."
                value={filters.query}
                onChange={(e) => {
                  console.log('Changement query:', e.target.value);
                  handleChange('query', e.target.value);
                }}
              />
            </div>

            <div className="space-y-2">
              <Label>Spécialité</Label>
              <Select
                value={filters.speciality}
                onValueChange={(value) => {
                  console.log('Changement spécialité:', value);
                  handleChange('speciality', value);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Toutes les spécialités" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les spécialités</SelectItem>
                  {Object.entries(SPECIALITIES).map(([key, speciality]) => (
                    <SelectItem key={key} value={key}>
                      {speciality.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Statut</Label>
              <Select
                value={filters.status}
                onValueChange={(value) => {
                  console.log('Changement statut:', value);
                  handleChange('status', value);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tous les statuts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="available">Disponible</SelectItem>
                  <SelectItem value="booked">Réservé</SelectItem>
                  <SelectItem value="completed">Terminé</SelectItem>
                  <SelectItem value="cancelled">Annulé</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Lieu</Label>
              <Input
                placeholder="Ville, département..."
                value={filters.location || ''}
                onChange={(e) => {
                  console.log('Changement lieu:', e.target.value);
                  handleChange('location', e.target.value);
                }}
              />
            </div>

            <div className="space-y-2">
              <Label>Date de début</Label>
              <DateSelector
                value={filters.startDate || ''}
                onChange={(value) => {
                  console.log('Changement date début:', value);
                  handleChange('startDate', value);
                }}
              />
            </div>

            <div className="space-y-2">
              <Label>Date de fin</Label>
              <DateSelector
                value={filters.endDate || ''}
                onChange={(value) => {
                  console.log('Changement date fin:', value);
                  handleChange('endDate', value);
                }}
              />
            </div>

            <div className="space-y-2">
              <Label>Tarif minimum (€/h)</Label>
              <Input
                type="number"
                placeholder="0"
                value={filters.minRate || ''}
                onChange={(e) => {
                  console.log('Changement tarif min:', e.target.value);
                  handleChange('minRate', parseFloat(e.target.value));
                }}
              />
            </div>

            <div className="space-y-2">
              <Label>Tarif maximum (€/h)</Label>
              <Input
                type="number"
                placeholder="1000"
                value={filters.maxRate || ''}
                onChange={(e) => {
                  console.log('Changement tarif max:', e.target.value);
                  handleChange('maxRate', parseFloat(e.target.value));
                }}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
            >
              Réinitialiser
            </Button>
            <Button 
              type="submit"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filtrer
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default AdvancedSearch; 