
export interface Document {
  id: string;
  name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  category: string;
  status: string;
  created_at: string;
  booking_id?: string;
}

export interface DocumentManagementProps {
  bookingId?: string;
  readonly?: boolean;
}
