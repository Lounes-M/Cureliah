import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Speciality } from '@/types/database';
import { SPECIALITIES } from '@/utils/specialities';

export interface SpecialitySelectorProps {
  value: string;
  onChange: (value: Speciality) => void;
  onBlur?: () => void;
  className?: string;
}

const SpecialitySelector = ({ value, onChange, onBlur, className }: SpecialitySelectorProps) => {
  return (
    <Select
      value={value}
      onValueChange={(value) => onChange(value as Speciality)}
      onOpenChange={(open) => !open && onBlur?.()}
    >
      <SelectTrigger className={className}>
        <SelectValue placeholder="Sélectionnez une spécialité" />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(SPECIALITIES).map(([key, speciality]) => (
          <SelectItem key={key} value={key}>
            {speciality.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default SpecialitySelector;
