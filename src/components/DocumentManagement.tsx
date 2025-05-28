
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { FileText, Upload, Download, Trash2, Eye } from 'lucide-react';
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
  booking_id?: string;
}

interface DocumentManagementProps {
  bookingId?: string;
  readonly?: boolean;
}

const DocumentManagement = ({ bookingId, readonly = false }: DocumentManagementProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('general');

  const categories = [
    { value: 'contract', label: 'Contrat' },
    { value: 'invoice', label: 'Facture' },
    { value: 'certificate', label: 'Certificat' },
    { value: 'identity', label: 'Pièce d\'identité' },
    { value: 'medical', label: 'Document médical' },
    { value: 'general', label: 'Général' }
  ];

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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    try {
      // Create unique file path
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const filePath = `documents/${fileName}`;

      // Upload file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Create document record
      const documentData = {
        user_id: user.id,
        booking_id: bookingId || null,
        name: file.name,
        file_path: filePath,
        file_type: file.type,
        file_size: file.size,
        category: selectedCategory,
        status: 'pending'
      };

      const { error: dbError } = await supabase
        .from('documents')
        .insert(documentData);

      if (dbError) throw dbError;

      toast({
        title: "Document téléchargé",
        description: "Le document a été téléchargé avec succès et est en attente de validation",
      });

      fetchDocuments();
    } catch (error: any) {
      console.error('Error uploading document:', error);
      
      // Clean up file if database insert failed
      if (error.message?.includes('insert')) {
        const fileName = `${user.id}/${Date.now()}.${file.name.split('.').pop()}`;
        const filePath = `documents/${fileName}`;
        await supabase.storage.from('documents').remove([filePath]);
      }

      toast({
        title: "Erreur de téléchargement",
        description: "Impossible de télécharger le document",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const downloadDocument = async (document: Document) => {
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .download(document.file_path);

      if (error) throw error;

      // Create download link
      const url = URL.createObjectURL(data);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = document.name;
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Téléchargement démarré",
        description: "Le document est en cours de téléchargement",
      });
    } catch (error: any) {
      console.error('Error downloading document:', error);
      toast({
        title: "Erreur de téléchargement",
        description: "Impossible de télécharger le document",
        variant: "destructive"
      });
    }
  };

  const deleteDocument = async (document: Document) => {
    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('documents')
        .remove([document.file_path]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('documents')
        .delete()
        .eq('id', document.id);

      if (dbError) throw dbError;

      toast({
        title: "Document supprimé",
        description: "Le document a été supprimé avec succès",
      });

      fetchDocuments();
    } catch (error: any) {
      console.error('Error deleting document:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le document",
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

  const getCategoryLabel = (category: string) => {
    return categories.find(c => c.value === category)?.label || category;
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
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
            <div className="space-y-4">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sélectionner une catégorie" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <div className="flex items-center justify-center">
                <label htmlFor="file-upload" className="cursor-pointer">
                  <div className="flex flex-col items-center space-y-2">
                    <Upload className="w-8 h-8 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {uploading ? 'Téléchargement en cours...' : 'Cliquer pour ajouter un document'}
                    </span>
                  </div>
                  <Input
                    id="file-upload"
                    type="file"
                    className="hidden"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  />
                </label>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {documents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Aucun document</p>
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
                          <span>{getCategoryLabel(doc.category)}</span>
                          <span>{formatFileSize(doc.file_size)}</span>
                          <span>{new Date(doc.created_at).toLocaleDateString()}</span>
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
                      <Download className="w-4 h-4" />
                    </Button>
                    
                    {!readonly && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteDocument(doc)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
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

export default DocumentManagement;
