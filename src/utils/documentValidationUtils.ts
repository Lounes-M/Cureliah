
import { supabase } from '@/integrations/supabase/client';
import { DocumentValidationDocument } from '@/types/documentValidation';

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const downloadDocument = async (document: DocumentValidationDocument, toast: any): Promise<void> => {
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

export const updateDocumentStatus = async (
  documentId: string, 
  status: 'approved' | 'rejected',
  toast: any
): Promise<void> => {
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
  } catch (error: any) {
    console.error('Error updating document status:', error);
    toast({
      title: "Erreur",
      description: "Impossible de mettre à jour le statut du document",
      variant: "destructive"
    });
  }
};
