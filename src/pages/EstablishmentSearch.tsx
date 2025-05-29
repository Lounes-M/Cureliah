
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import { SearchBar } from '@/components/establishment/SearchBar';
import { VacationList } from '@/components/establishment/VacationList';
import VacationFilters from '@/components/establishment/VacationFilters';
import BookingRequestModal from '@/components/establishment/BookingRequestModal';
import { useEstablishmentSearch, VacationWithDoctor } from '@/hooks/useEstablishmentSearch';

const EstablishmentSearch = () => {
  const { toast } = useToast();
  const {
    filteredVacations,
    loading,
    searchTerm,
    setSearchTerm,
    showFilters,
    setShowFilters,
    filters,
    setFilters
  } = useEstablishmentSearch();

  const [selectedVacation, setSelectedVacation] = useState<VacationWithDoctor | null>(null);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);

  const handleBookingRequest = (vacation: VacationWithDoctor) => {
    setSelectedVacation(vacation);
    setBookingModalOpen(true);
  };

  const handleBookingSuccess = () => {
    setBookingModalOpen(false);
    setSelectedVacation(null);
    toast({
      title: "Demande envoyée",
      description: "Votre demande de réservation a été envoyée au médecin",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="flex items-center justify-center h-96">
          <div className="text-lg">Chargement des vacations...</div>
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
            Trouvez des médecins disponibles pour vos besoins
          </p>
        </div>

        <SearchBar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          showFilters={showFilters}
          onToggleFilters={() => setShowFilters(!showFilters)}
        />

        {showFilters && (
          <div className="mb-6">
            <VacationFilters
              filters={filters}
              onFiltersChange={setFilters}
              onReset={() => setFilters({
                location: '',
                speciality: '',
                startDate: '',
                endDate: '',
                minRate: '',
                maxRate: ''
              })}
            />
          </div>
        )}

        <div className="mb-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">
              {filteredVacations.length} vacation{filteredVacations.length > 1 ? 's' : ''} trouvée{filteredVacations.length > 1 ? 's' : ''}
            </h2>
          </div>
        </div>

        <VacationList 
          vacations={filteredVacations} 
          onBookingRequest={handleBookingRequest} 
        />

        {selectedVacation && (
          <BookingRequestModal
            isOpen={bookingModalOpen}
            onClose={() => {
              setBookingModalOpen(false);
              setSelectedVacation(null);
            }}
            vacation={selectedVacation}
            onSuccess={handleBookingSuccess}
          />
        )}
      </div>
    </div>
  );
};

export default EstablishmentSearch;
