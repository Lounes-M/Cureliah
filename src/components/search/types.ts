
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

export interface SearchFiltersProps {
  onFiltersChange: (filters: SearchFilters) => void;
  initialFilters?: Partial<SearchFilters>;
}
