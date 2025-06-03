import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';
import SpecialitySelector from './SpecialitySelector';
import DateSelector from './DateSelector';

interface VacationFormData {
  title: string;
  description: string;
  speciality: string;
  hourly_rate: string;
  location: string;
  requirements: string;
}

interface VacationFormFieldsProps {
  vacationData: VacationFormData;
  setVacationData: (data: VacationFormData) => void;
  startDate: Date | undefined;
  endDate: Date | undefined;
  setStartDate: (date: Date | undefined) => void;
  setEndDate: (date: Date | undefined) => void;
  errors?: {
    title?: string;
    speciality?: string;
    hourly_rate?: string;
    start_date?: string;
    end_date?: string;
  };
}

const VacationFormFields = ({
  vacationData,
  setVacationData,
  startDate,
  endDate,
  setStartDate,
  setEndDate,
  errors = {}
}: VacationFormFieldsProps) => {
  const calculateTotalAmount = () => {
    if (!startDate || !endDate || !vacationData.hourly_rate) return null;

    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const hoursPerDay = 8; // Par défaut, on considère 8 heures par jour
    const totalHours = days * hoursPerDay;
    const totalAmount = totalHours * parseFloat(vacationData.hourly_rate);

    return totalAmount.toFixed(2);
  };

  const totalAmount = calculateTotalAmount();

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">Titre de la vacation *</Label>
        <Input
          id="title"
          value={vacationData.title}
          onChange={(e) => setVacationData({...vacationData, title: e.target.value})}
          placeholder="Ex: Vacation de garde en cardiologie"
          required
          className={errors.title ? "border-red-500" : ""}
        />
        {errors.title && (
          <p className="text-sm text-red-500">{errors.title}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={vacationData.description}
          onChange={(e) => setVacationData({...vacationData, description: e.target.value})}
          placeholder="Décrivez les détails de la vacation..."
          rows={3}
        />
        <p className="text-sm text-gray-500">
          Décrivez précisément les missions, les responsabilités et les conditions de travail.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="speciality">Spécialité *</Label>
          <SpecialitySelector
            value={vacationData.speciality}
            onChange={(value) => setVacationData({...vacationData, speciality: value})}
            required
            className={errors.speciality ? "border-red-500" : ""}
          />
          {errors.speciality && (
            <p className="text-sm text-red-500">{errors.speciality}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="hourly_rate">Tarif horaire (€) *</Label>
          <Input
            id="hourly_rate"
            type="number"
            step="0.01"
            min="0"
            value={vacationData.hourly_rate}
            onChange={(e) => setVacationData({...vacationData, hourly_rate: e.target.value})}
            placeholder="120.00"
            required
            className={errors.hourly_rate ? "border-red-500" : ""}
          />
          {errors.hourly_rate && (
            <p className="text-sm text-red-500">{errors.hourly_rate}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="start_date">Date de début *</Label>
          <DateSelector
            label="Date de début"
            date={startDate}
            onSelect={setStartDate}
            disabled={(date) => date < new Date()}
            required
            className={errors.start_date ? "border-red-500" : ""}
          />
          {errors.start_date && (
            <p className="text-sm text-red-500">{errors.start_date}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="end_date">Date de fin *</Label>
          <DateSelector
            label="Date de fin"
            date={endDate}
            onSelect={setEndDate}
            disabled={(date) => date <= (startDate || new Date())}
            required
            className={errors.end_date ? "border-red-500" : ""}
          />
          {errors.end_date && (
            <p className="text-sm text-red-500">{errors.end_date}</p>
          )}
        </div>
      </div>

      {totalAmount && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Montant total estimé pour {Math.ceil((endDate!.getTime() - startDate!.getTime()) / (1000 * 60 * 60 * 24))} jours : {totalAmount}€
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="location">Lieu</Label>
        <Input
          id="location"
          value={vacationData.location}
          onChange={(e) => setVacationData({...vacationData, location: e.target.value})}
          placeholder="Ex: Paris, Marseille, Lyon..."
        />
        <p className="text-sm text-gray-500">
          Précisez la ville ou l'adresse exacte de l'établissement.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="requirements">Exigences particulières</Label>
        <Textarea
          id="requirements"
          value={vacationData.requirements}
          onChange={(e) => setVacationData({...vacationData, requirements: e.target.value})}
          placeholder="Ex: Expérience en urgences requise, garde de nuit..."
          rows={2}
        />
        <p className="text-sm text-gray-500">
          Indiquez les compétences, expériences ou conditions particulières requises.
        </p>
      </div>
    </div>
  );
};

export default VacationFormFields;
export type { VacationFormData };
