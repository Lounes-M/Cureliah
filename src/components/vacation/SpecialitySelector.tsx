
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface SpecialitySelectorProps {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}

const SpecialitySelector = ({ value, onChange, required = false }: SpecialitySelectorProps) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="speciality">Spécialité {required && '*'}</Label>
      <Select 
        value={value} 
        onValueChange={onChange}
        required={required}
      >
        <SelectTrigger>
          <SelectValue placeholder="Spécialité" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="cardiology">Cardiologie</SelectItem>
          <SelectItem value="neurology">Neurologie</SelectItem>
          <SelectItem value="orthopedics">Orthopédie</SelectItem>
          <SelectItem value="pediatrics">Pédiatrie</SelectItem>
          <SelectItem value="psychiatry">Psychiatrie</SelectItem>
          <SelectItem value="radiology">Radiologie</SelectItem>
          <SelectItem value="surgery">Chirurgie</SelectItem>
          <SelectItem value="general_medicine">Médecine générale</SelectItem>
          <SelectItem value="dermatology">Dermatologie</SelectItem>
          <SelectItem value="gynecology">Gynécologie</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default SpecialitySelector;
