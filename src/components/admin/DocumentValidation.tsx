
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { DocumentValidationDocument, DocumentFilterType } from '@/types/documentValidation';
import { downloadDocument, updateDocumentStatus } from '@/utils/documentValidationUtils';
import DocumentValidationFilters from './DocumentValidationFilters';
import DocumentValidationList from './DocumentValidationList';

const DocumentValidation = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [documents, setDocuments] = useState<DocumentValidationDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<DocumentFilterType>('pending');

  useEffect(() => {
    if (user) {
      fetchDocuments();
    }
  }, [user, filter]);

  const fetchDocuments = async () => {
    if (!user) return;

    try {
      let query = supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setDocuments(data || []);
    } catch (error: any) {
      console.error('Error fetching documents:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les documents",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (documentId: string, status: 'approved' | 'rejected') => {
    await updateDocumentStatus(documentId, status, toast);
    fetchDocuments();
  };

  const handleDownload = (document: DocumentValidationDocument) => {
    downloadDocument(document, toast);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <div className="text-gray-500">Chargement des documents...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <FileText className="w-5 h-5" />
          <span>Validation des documents</span>
        </CardTitle>
        <CardDescription>
          Gérez et validez les documents téléchargés par les utilisateurs
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <DocumentValidationFilters filter={filter} onFilterChange={setFilter} />
        <DocumentValidationList
          documents={documents}
          filter={filter}
          onStatusUpdate={handleStatusUpdate}
          onDownload={handleDownload}
        />
      </CardContent>
    </Card>
  );
};

export default DocumentValidation;
