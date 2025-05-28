
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
}

const VacationFormFields = ({
  vacationData,
  setVacationData,
  startDate,
  endDate,
  setStartDate,
  setEndDate
}: VacationFormFieldsProps) => {
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
        />
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
      </div>

      <div className="grid grid-cols-2 gap-4">
        <SpecialitySelector
          value={vacationData.speciality}
          onChange={(value) => setVacationData({...vacationData, speciality: value})}
          required
        />

        <div className="space-y-2">
          <Label htmlFor="hourly_rate">Tarif horaire (€) *</Label>
          <Input
            id="hourly_rate"
            type="number"
            step="0.01"
            value={vacationData.hourly_rate}
            onChange={(e) => setVacationData({...vacationData, hourly_rate: e.target.value})}
            placeholder="120.00"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <DateSelector
          label="Date de début"
          date={startDate}
          onSelect={setStartDate}
          disabled={(date) => date < new Date()}
          required
        />

        <DateSelector
          label="Date de fin"
          date={endDate}
          onSelect={setEndDate}
          disabled={(date) => date <= (startDate || new Date())}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="location">Lieu</Label>
        <Input
          id="location"
          value={vacationData.location}
          onChange={(e) => setVacationData({...vacationData, location: e.target.value})}
          placeholder="Ex: Paris, Marseille, Lyon..."
        />
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
      </div>
    </div>
  );
};

export default VacationFormFields;
export type { VacationFormData };
