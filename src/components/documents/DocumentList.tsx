
import { FileText } from 'lucide-react';
import { Document } from '@/types/document';
import DocumentListItem from './DocumentListItem';

interface DocumentListProps {
  documents: Document[];
  readonly?: boolean;
  onDocumentDeleted: () => void;
}

const DocumentList = ({ documents, readonly = false, onDocumentDeleted }: DocumentListProps) => {
  if (documents.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
        <p>Aucun document</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {documents.map((doc) => (
        <DocumentListItem
          key={doc.id}
          document={doc}
          readonly={readonly}
          onDelete={onDocumentDeleted}
        />
      ))}
    </div>
  );
};

export default DocumentList;
