
import { VacationWithDoctor } from '@/hooks/useEstablishmentSearch';
import { EstablishmentVacationCard } from './EstablishmentVacationCard';
import { EmptyState } from './EmptyState';

interface VacationListProps {
  vacations: VacationWithDoctor[];
  onBookingRequest: (vacation: VacationWithDoctor) => void;
}

export const VacationList = ({ vacations, onBookingRequest }: VacationListProps) => {
  if (vacations.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="grid gap-6">
      {vacations.map((vacation) => (
        <EstablishmentVacationCard
          key={vacation.id}
          vacation={vacation}
          onBookingRequest={() => onBookingRequest(vacation)}
        />
      ))}
    </div>
  );
};
