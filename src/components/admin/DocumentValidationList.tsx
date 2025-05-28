
import { FileText } from 'lucide-react';
import { DocumentValidationDocument } from '@/types/documentValidation';
import DocumentValidationItem from './DocumentValidationItem';

interface DocumentValidationListProps {
  documents: DocumentValidationDocument[];
  filter: string;
  onStatusUpdate: (documentId: string, status: 'approved' | 'rejected') => void;
  onDownload: (document: DocumentValidationDocument) => void;
}

const DocumentValidationList = ({ documents, filter, onStatusUpdate, onDownload }: DocumentValidationListProps) => {
  if (documents.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
        <p>Aucun document {filter !== 'all' ? filter.toLowerCase() : ''}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {documents.map((doc) => (
        <DocumentValidationItem
          key={doc.id}
          document={doc}
          onStatusUpdate={onStatusUpdate}
          onDownload={onDownload}
        />
      ))}
    </div>
  );
};

export default DocumentValidationList;
