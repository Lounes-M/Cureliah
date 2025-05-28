
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Document, DocumentManagementProps } from '@/types/document';
import DocumentUploadArea from './documents/DocumentUploadArea';
import DocumentList from './documents/DocumentList';

const DocumentManagement = ({ bookingId, readonly = false }: DocumentManagementProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDocuments();
    }
  }, [user, bookingId]);

  const fetchDocuments = async () => {
    if (!user) return;

    try {
      let query = supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false });

      if (bookingId) {
        query = query.eq('booking_id', bookingId);
      } else {
        query = query.eq('user_id', user.id);
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
          <span>Gestion des documents</span>
        </CardTitle>
        <CardDescription>
          {bookingId ? 'Documents liés à cette réservation' : 'Vos documents'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!readonly && (
          <DocumentUploadArea 
            bookingId={bookingId} 
            onUploadSuccess={fetchDocuments} 
          />
        )}

        <DocumentList 
          documents={documents} 
          readonly={readonly} 
          onDocumentDeleted={fetchDocuments} 
        />
      </CardContent>
    </Card>
  );
};

export default DocumentManagement;
