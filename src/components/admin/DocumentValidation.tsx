
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Check, X, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface Document {
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

const DocumentValidation = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');

  const categories = {
    contract: 'Contrat',
    invoice: 'Facture',
    certificate: 'Certificat',
    identity: 'Pièce d\'identité',
    medical: 'Document médical',
    general: 'Général'
  };

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800'
  };

  const statusLabels = {
    pending: 'En attente',
    approved: 'Approuvé',
    rejected: 'Rejeté'
  };

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

  const updateDocumentStatus = async (documentId: string, status: 'approved' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('documents')
        .update({ status })
        .eq('id', documentId);

      if (error) throw error;

      toast({
        title: "Statut mis à jour",
        description: `Le document a été ${status === 'approved' ? 'approuvé' : 'rejeté'}`,
      });

      fetchDocuments();
    } catch (error: any) {
      console.error('Error updating document status:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut du document",
        variant: "destructive"
      });
    }
  };

  const downloadDocument = async (document: Document) => {
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .download(document.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = document.name;
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error('Error downloading document:', error);
      toast({
        title: "Erreur de téléchargement",
        description: "Impossible de télécharger le document",
        variant: "destructive"
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
        <div className="flex space-x-2">
          {(['all', 'pending', 'approved', 'rejected'] as const).map((filterValue) => (
            <Button
              key={filterValue}
              variant={filter === filterValue ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(filterValue)}
            >
              {filterValue === 'all' ? 'Tous' : statusLabels[filterValue]}
            </Button>
          ))}
        </div>

        <div className="space-y-3">
          {documents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Aucun document {filter !== 'all' ? statusLabels[filter].toLowerCase() : ''}</p>
            </div>
          ) : (
            documents.map((doc) => (
              <div
                key={doc.id}
                className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <FileText className="w-5 h-5 text-blue-500" />
                      <div>
                        <h4 className="font-medium">{doc.name}</h4>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span>{categories[doc.category as keyof typeof categories] || doc.category}</span>
                          <span>{formatFileSize(doc.file_size)}</span>
                          <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                          <span>ID utilisateur: {doc.user_id.slice(0, 8)}...</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Badge className={statusColors[doc.status as keyof typeof statusColors]}>
                      {statusLabels[doc.status as keyof typeof statusLabels]}
                    </Badge>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => downloadDocument(doc)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    
                    {doc.status === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-600 hover:text-green-700"
                          onClick={() => updateDocumentStatus(doc.id, 'approved')}
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => updateDocumentStatus(doc.id, 'rejected')}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DocumentValidation;
