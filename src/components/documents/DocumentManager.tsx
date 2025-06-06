import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { File, Trash2, Download, Upload, Loader2, Search, X, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

interface Document {
  id: string;
  user_id: string;
  name: string;
  type: string;
  size: number;
  file_path: string; // Changez selon le nom réel de votre colonne
  category: string;
  created_at: string;
}

interface DocumentCategory {
  id: string;
  name: string;
  icon: React.ReactNode;
}

const DOCUMENT_CATEGORIES: DocumentCategory[] = [
  { id: 'all', name: 'Tous les documents', icon: <File className="w-4 h-4" /> },
  { id: 'diplomas', name: 'Diplômes', icon: <FileText className="w-4 h-4" /> },
  { id: 'certifications', name: 'Certifications', icon: <FileText className="w-4 h-4" /> },
  { id: 'contracts', name: 'Contrats', icon: <FileText className="w-4 h-4" /> },
  { id: 'other', name: 'Autres', icon: <File className="w-4 h-4" /> }
];

const UPLOAD_CATEGORIES = DOCUMENT_CATEGORIES.filter(cat => cat.id !== 'all');

const DocumentManager: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [documents, setDocuments] = useState<DocumentFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('date');
  
  // États pour le modal d'upload
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadCategory, setUploadCategory] = useState('other');
  const [dragActive, setDragActive] = useState(false);

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

  const validateFile = (file: File): string | null => {
    // Vérification de la taille du fichier (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return "Le fichier ne doit pas dépasser 10MB";
    }

    // Vérification du type de fichier
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      return "Type de fichier non supporté. Formats acceptés : PDF, JPEG, PNG, DOC, DOCX";
    }

    return null;
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    const error = validateFile(file);
    
    if (error) {
      toast({
        title: "Erreur",
        description: error,
        variant: "destructive"
      });
      return;
    }
    
    setSelectedFile(file);
    setUploadModalOpen(true);
  };

  const handleUpload = async () => {
    if (!user || !selectedFile) return;

    try {
      setUploading(true);
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload du fichier
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      // Création de l'entrée dans la base de données
      const { error: dbError } = await supabase
        .from('documents')
        .insert([
          {
            user_id: user.id,
            name: selectedFile.name,
            file_type: selectedFile.type,  // Utiliser file_type au lieu de type
            file_size: selectedFile.size,  // Utiliser file_size au lieu de size
            file_path: filePath,           // Utiliser file_path pour le storage
            url: filePath,                 // Et aussi url pour compatibilité
            category: uploadCategory
          }
        ]);

      if (dbError) throw dbError;

      toast({
        title: "Succès",
        description: "Document téléversé avec succès"
      });

      fetchDocuments();
      setUploadModalOpen(false);
      setSelectedFile(null);
      setUploadCategory('other');
    } catch (error: any) {
      console.error('Error uploading document:', error);
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors du téléversement du document",
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
          
          <Dialog open={uploadModalOpen} onOpenChange={setUploadModalOpen}>
            <DialogTrigger asChild>
              <Button 
                variant="outline"
                disabled={uploading}
                onClick={() => setUploadModalOpen(true)}
              >
                <Upload className="w-4 h-4 mr-2" />
                Téléverser un document
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Téléverser un document</DialogTitle>
                <DialogDescription>
                  Sélectionnez un fichier et choisissez sa catégorie
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                {/* Zone de drag & drop */}
                <div
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                    dragActive ? 'border-primary bg-primary/5' : 'border-gray-300'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  {selectedFile ? (
                    <div className="space-y-2">
                      <File className="w-8 h-8 mx-auto text-primary" />
                      <p className="font-medium">{selectedFile.name}</p>
                      <p className="text-sm text-gray-500">{formatFileSize(selectedFile.size)}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedFile(null)}
                      >
                        <X className="w-4 h-4 mr-1" />
                        Supprimer
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="w-8 h-8 mx-auto text-gray-400" />
                      <div>
                        <p className="font-medium">Glissez-déposez un fichier ici</p>
                        <p className="text-sm text-gray-500">ou cliquez pour sélectionner</p>
                      </div>
                      <Input
                        type="file"
                        onChange={(e) => handleFileSelect(e.target.files)}
                        className="hidden"
                        id="file-input"
                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      />
                      <label htmlFor="file-input">
                        <Button variant="outline" className="cursor-pointer" asChild>
                          <span>Sélectionner un fichier</span>
                        </Button>
                      </label>
                    </div>
                  )}
                </div>

                {/* Sélection de catégorie */}
                <div className="space-y-2">
                  <Label htmlFor="category">Catégorie du document</Label>
                  <Select value={uploadCategory} onValueChange={setUploadCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez une catégorie" />
                    </SelectTrigger>
                    <SelectContent>
                      {UPLOAD_CATEGORIES.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          <div className="flex items-center">
                            {category.icon}
                            <span className="ml-2">{category.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="text-xs text-gray-500">
                  Formats acceptés : PDF, JPEG, PNG, DOC, DOCX (max 10MB)
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setUploadModalOpen(false);
                    setSelectedFile(null);
                    setUploadCategory('other');
                  }}
                >
                  Annuler
                </Button>
                <Button
                  onClick={handleUpload}
                  disabled={!selectedFile || uploading}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Téléversement...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Téléverser
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
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
                    {searchQuery ? 'Essayez une autre recherche' : 'Téléversez vos documents pour les organiser'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredDocuments.map((document: DocumentFile) => (
                    <div
                      key={document.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <File className="w-6 h-6 text-primary" />
                        <div>
                          <p className="font-medium">{document.name}</p>
                          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                            <span>{formatDate(document.created_at)}</span>
                            <Badge variant="outline">{DOCUMENT_CATEGORIES.find(cat => cat.id === document.category)?.name || document.category}</Badge>
                            <span>•</span>
                            <span>{formatFileSize(document.file_size)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDownload(document.url || document.file_path, document.name)}
                          title="Télécharger"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(document.id, document.url || document.file_path)}
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
};

export default DocumentManager;