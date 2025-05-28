
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Document } from '@/types/document';
import { categories, statusColors, statusLabels } from '@/constants/documentConstants';
import { formatFileSize, downloadDocument, deleteDocument } from '@/utils/documentUtils';

interface DocumentListItemProps {
  document: Document;
  readonly?: boolean;
  onDelete: () => void;
}

const DocumentListItem = ({ document, readonly = false, onDelete }: DocumentListItemProps) => {
  const { toast } = useToast();

  const getCategoryLabel = (category: string) => {
    return categories.find(c => c.value === category)?.label || category;
  };

  const handleDownload = () => {
    downloadDocument(document, toast);
  };

  const handleDelete = () => {
    deleteDocument(document, toast, onDelete);
  };

  return (
    <div className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3">
            <FileText className="w-5 h-5 text-blue-500" />
            <div>
              <h4 className="font-medium">{document.name}</h4>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span>{getCategoryLabel(document.category)}</span>
                <span>{formatFileSize(document.file_size)}</span>
                <span>{new Date(document.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Badge className={statusColors[document.status as keyof typeof statusColors]}>
            {statusLabels[document.status as keyof typeof statusLabels]}
          </Badge>
          
          <Button
            size="sm"
            variant="outline"
            onClick={handleDownload}
          >
            <Download className="w-4 h-4" />
          </Button>
          
          {!readonly && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleDelete}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentListItem;
