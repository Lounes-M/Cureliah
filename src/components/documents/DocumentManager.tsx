import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Document, uploadDocument, getDocuments, deleteDocument } from '@/services/documents';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { File, Trash2, Download, Upload, Loader2, Folder, Search, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface DocumentCategory {
  id: string;
  name: string;
  icon: React.ReactNode;
}

const DOCUMENT_CATEGORIES: DocumentCategory[] = [
  { id: 'all', name: 'Tous les documents', icon: <File className="w-4 h-4" /> },
  { id: 'diplomas', name: 'Diplômes', icon: <File className="w-4 h-4" /> },
  { id: 'certifications', name: 'Certifications', icon: <File className="w-4 h-4" /> },
  { id: 'contracts', name: 'Contrats', icon: <File className="w-4 h-4" /> },
  { id: 'other', name: 'Autres', icon: <File className="w-4 h-4" /> }
];

export default function DocumentManager() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('date');

  const fetchDocuments = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error: any) {
      console.error('Error fetching documents:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de charger les documents",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchDocuments();
    }
  }, [user]);

  const handleUpload = async (file: File) => {
    if (!user) return;

    // Vérification de la taille du fichier (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "Erreur",
        description: "Le fichier ne doit pas dépasser 10MB",
        variant: "destructive"
      });
      return;
    }

    // Vérification du type de fichier
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Erreur",
        description: "Type de fichier non supporté. Formats acceptés : PDF, JPEG, PNG, DOC, DOCX",
        variant: "destructive"
      });
      return;
    }

    try {
      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload du fichier
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Création de l'entrée dans la base de données
      const { error: dbError } = await supabase
        .from('documents')
        .insert([
          {
            user_id: user.id,
            name: file.name,
            type: file.type,
            size: file.size,
            url: filePath,
            category: selectedCategory === 'all' ? 'other' : selectedCategory
          }
        ]);

      if (dbError) throw dbError;

      toast({
        title: "Succès",
        description: "Document téléchargé avec succès"
      });

      fetchDocuments();
    } catch (error: any) {
      console.error('Error uploading document:', error);
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors du téléchargement du document",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (documentId: string, filePath: string) => {
    if (!user) return;

    try {
      setLoading(true);

      // Suppression du fichier du stockage
      const { error: storageError } = await supabase.storage
        .from('documents')
        .remove([filePath]);

      if (storageError) throw storageError;

      // Suppression de l'entrée dans la base de données
      const { error: dbError } = await supabase
        .from('documents')
        .delete()
        .eq('id', documentId)
        .eq('user_id', user.id);

      if (dbError) throw dbError;

      toast({
        title: "Succès",
        description: "Document supprimé avec succès"
      });

      fetchDocuments();
    } catch (error: any) {
      console.error('Error deleting document:', error);
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la suppression du document",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (filePath: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .download(filePath);

      if (error) throw error;

      // Création d'un lien de téléchargement
      const url = URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error('Error downloading document:', error);
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors du téléchargement du document",
        variant: "destructive"
      });
    }
  };

  const filteredDocuments = documents
    .filter(doc => selectedCategory === 'all' || doc.category === selectedCategory)
    .filter(doc => doc.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      return a.name.localeCompare(b.name);
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="w-6 h-6 animate-spin" />
        <span className="ml-2">Chargement des documents...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Documents</h2>
        <div className="flex items-center space-x-4">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Trier par" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Date</SelectItem>
              <SelectItem value="name">Nom</SelectItem>
            </SelectContent>
          </Select>
          <div className="relative">
            <Input
              type="file"
              onChange={(e) => {
                if (e.target.files) {
                  const file = e.target.files[0];
                  handleUpload(file);
                }
              }}
              className="hidden"
              id="file-upload"
              disabled={uploading}
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            />
            <label htmlFor="file-upload">
              <Button
                variant="outline"
                className="cursor-pointer"
                disabled={uploading}
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Téléchargement...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Télécharger un document
                  </>
                )}
              </Button>
            </label>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Rechercher un document..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Tabs defaultValue="all" value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList>
          {DOCUMENT_CATEGORIES.map((category) => (
            <TabsTrigger key={category.id} value={category.id}>
              <span className="flex items-center">
                {category.icon}
                <span className="ml-2">{category.name}</span>
              </span>
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value={selectedCategory}>
          <ScrollArea className="h-[400px] border rounded-lg">
            <div className="p-4">
              {filteredDocuments.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <File className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Aucun document trouvé</p>
                  <p className="text-sm mt-1">
                    {searchQuery ? 'Essayez une autre recherche' : 'Téléchargez vos documents pour les partager'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredDocuments.map((document) => (
                    <div
                      key={document.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <File className="w-6 h-6 text-primary" />
                        <div>
                          <p className="font-medium">{document.name}</p>
                          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                            <span>{format(new Date(document.created_at), 'PPp')}</span>
                            <Badge variant="outline">{document.category}</Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDownload(document.url, document.name)}
                          title="Télécharger"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(document.id, document.url)}
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
