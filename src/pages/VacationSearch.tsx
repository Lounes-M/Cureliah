import { useEffect } from 'react';
import Header from '@/components/Header';
import { VacationSearchFilters } from '@/components/vacation/VacationSearchFilters';
import { VacationCardList } from '@/components/vacation/VacationCardList';
import { SearchResultsHeader } from '@/components/vacation/SearchResultsHeader';
import useVacationSearch from '@/hooks/useVacationSearch';

const VacationSearch = () => {
  const {
    vacations,
    loading,
    searchLoading,
    filters,
    setFilters,
    handleSearch,
    handleBookVacation,
    clearFilters
  } = useVacationSearch();

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="flex items-center justify-center h-96">
          <div className="text-lg">Chargement...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Rechercher des vacations
          </h1>
          <p className="text-gray-600">
            Trouvez et réservez des vacations médicales selon vos besoins
          </p>
        </div>

        <VacationSearchFilters
          filters={filters}
          onFiltersChange={setFilters}
          onSearch={handleSearch}
          onClearFilters={clearFilters}
          searchLoading={searchLoading}
        />

        <div className="space-y-6">
          <SearchResultsHeader count={vacations.length} />
          <VacationCardList 
            vacations={vacations} 
            onBookVacation={handleBookVacation} 
          />
        </div>
      </div>
    </div>
  );
};

export default VacationSearch;
