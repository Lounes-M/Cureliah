
import { supabase } from '@/integrations/supabase/client';
import { Document } from '@/types/document';

export const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const downloadDocument = async (document: Document, toast: any) => {
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

export const deleteDocument = async (document: Document, toast: any, onSuccess: () => void) => {
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

    onSuccess();
  } catch (error: any) {
    console.error('Error deleting document:', error);
    toast({
      title: "Erreur",
      description: "Impossible de supprimer le document",
      variant: "destructive"
    });
  }
};
