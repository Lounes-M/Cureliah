
import { Button } from '@/components/ui/button';
import { DocumentValidationFiltersProps } from '@/types/documentValidation';
import { FILTER_OPTIONS, DOCUMENT_STATUS_LABELS } from '@/constants/documentValidationConstants';

const DocumentValidationFilters = ({ filter, onFilterChange }: DocumentValidationFiltersProps) => {
  return (
    <div className="flex space-x-2">
      {FILTER_OPTIONS.map((filterOption) => (
        <Button
          key={filterOption.value}
          variant={filter === filterOption.value ? 'default' : 'outline'}
          size="sm"
          onClick={() => onFilterChange(filterOption.value)}
        >
          {filterOption.value === 'all' ? filterOption.label : DOCUMENT_STATUS_LABELS[filterOption.value]}
        </Button>
      ))}
    </div>
  );
};

export default DocumentValidationFilters;
