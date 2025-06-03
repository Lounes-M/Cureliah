import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { DatePicker } from '@/components/ui/date-picker';
import { useToast } from '@/hooks/use-toast';
import { SearchFilters, searchVacations, getSpecialities, getLocations } from '@/services/searchService';
import { VacationCard } from '@/components/vacation/VacationCard';
import { Loader2 } from 'lucide-react';

export const AdvancedSearch = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [specialities, setSpecialities] = useState<string[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [filters, setFilters] = useState<SearchFilters>({
    availability: 'upcoming'
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [specialitiesData, locationsData] = await Promise.all([
        getSpecialities(),
        getLocations()
      ]);
      setSpecialities(specialitiesData);
      setLocations(locationsData);
    } catch (error) {
      console.error('Error fetching initial data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load search options',
        variant: 'destructive',
      });
    }
  };

  const handleSearch = async () => {
    try {
      setLoading(true);
      const searchResults = await searchVacations(filters);
      setResults(searchResults.vacations);
    } catch (error) {
      console.error('Error searching:', error);
      toast({
        title: 'Error',
        description: 'Failed to perform search',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const removeFilter = (key: keyof SearchFilters) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[key];
      return newFilters;
    });
  };

  return (
    <div className="container mx-auto py-8">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Advanced Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Speciality</label>
              <Select
                value={filters.speciality}
                onValueChange={(value) => handleFilterChange('speciality', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select speciality" />
                </SelectTrigger>
                <SelectContent>
                  {specialities.map((speciality) => (
                    <SelectItem key={speciality} value={speciality}>
                      {speciality}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Location</label>
              <Select
                value={filters.location}
                onValueChange={(value) => handleFilterChange('location', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((location) => (
                    <SelectItem key={location} value={location}>
                      {location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Availability</label>
              <Select
                value={filters.availability}
                onValueChange={(value) => handleFilterChange('availability', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select availability" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="immediate">Immediate</SelectItem>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Date Range</label>
              <div className="flex gap-2">
                <DatePicker
                  value={filters.startDate}
                  onChange={(date) => handleFilterChange('startDate', date)}
                  placeholder="Start date"
                />
                <DatePicker
                  value={filters.endDate}
                  onChange={(date) => handleFilterChange('endDate', date)}
                  placeholder="End date"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Hourly Rate Range</label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Min rate"
                  value={filters.minRate}
                  onChange={(e) => handleFilterChange('minRate', Number(e.target.value))}
                />
                <Input
                  type="number"
                  placeholder="Max rate"
                  value={filters.maxRate}
                  onChange={(e) => handleFilterChange('maxRate', Number(e.target.value))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Minimum Rating</label>
              <Slider
                value={[filters.rating || 0]}
                onValueChange={(value) => handleFilterChange('rating', value[0])}
                min={0}
                max={5}
                step={0.5}
              />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {Object.entries(filters).map(([key, value]) => {
              if (!value) return null;
              return (
                <Badge key={key} variant="secondary" className="flex items-center gap-1">
                  {key}: {value}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => removeFilter(key as keyof SearchFilters)}
                  />
                </Badge>
              );
            })}
          </div>

          <Button
            className="mt-4 w-full"
            onClick={handleSearch}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Searching...
              </>
            ) : (
              'Search'
            )}
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {results.map((vacation) => (
          <VacationCard key={vacation.id} vacation={vacation} />
        ))}
      </div>
    </div>
  );
}; 