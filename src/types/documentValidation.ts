
export interface DocumentValidationDocument {
  id: string;
  name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  category: string;
  status: string;
  created_at: string;
  user_id: string;
  booking_id?: string;
}

export type DocumentFilterType = 'all' | 'pending' | 'approved' | 'rejected';

export interface DocumentValidationFiltersProps {
  filter: DocumentFilterType;
  onFilterChange: (filter: DocumentFilterType) => void;
}

export interface DocumentValidationItemProps {
  document: DocumentValidationDocument;
  onStatusUpdate: (documentId: string, status: 'approved' | 'rejected') => void;
  onDownload: (document: DocumentValidationDocument) => void;
}
