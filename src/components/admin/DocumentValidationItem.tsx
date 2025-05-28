
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Check, X, Eye } from 'lucide-react';
import { DocumentValidationItemProps } from '@/types/documentValidation';
import { 
  DOCUMENT_CATEGORIES, 
  DOCUMENT_STATUS_COLORS, 
  DOCUMENT_STATUS_LABELS 
} from '@/constants/documentValidationConstants';
import { formatFileSize } from '@/utils/documentValidationUtils';

const DocumentValidationItem = ({ document, onStatusUpdate, onDownload }: DocumentValidationItemProps) => {
  return (
    <div className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3">
            <FileText className="w-5 h-5 text-blue-500" />
            <div>
              <h4 className="font-medium">{document.name}</h4>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span>{DOCUMENT_CATEGORIES[document.category as keyof typeof DOCUMENT_CATEGORIES] || document.category}</span>
                <span>{formatFileSize(document.file_size)}</span>
                <span>{new Date(document.created_at).toLocaleDateString()}</span>
                <span>ID utilisateur: {document.user_id.slice(0, 8)}...</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Badge className={DOCUMENT_STATUS_COLORS[document.status as keyof typeof DOCUMENT_STATUS_COLORS]}>
            {DOCUMENT_STATUS_LABELS[document.status as keyof typeof DOCUMENT_STATUS_LABELS]}
          </Badge>
          
          <Button
            size="sm"
            variant="outline"
            onClick={() => onDownload(document)}
          >
            <Eye className="w-4 h-4" />
          </Button>
          
          {document.status === 'pending' && (
            <>
              <Button
                size="sm"
                variant="outline"
                className="text-green-600 hover:text-green-700"
                onClick={() => onStatusUpdate(document.id, 'approved')}
              >
                <Check className="w-4 h-4" />
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                className="text-red-600 hover:text-red-700"
                onClick={() => onStatusUpdate(document.id, 'rejected')}
              >
                <X className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentValidationItem;
