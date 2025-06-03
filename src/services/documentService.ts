import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Document {
  id: string;
  user_id: string;
  name: string;
  type: 'license' | 'certification' | 'insurance' | 'other';
  url: string;
  metadata?: {
    issue_date?: string;
    expiry_date?: string;
    issuer?: string;
    number?: string;
  };
  created_at: string;
}

export const uploadDocument = async (
  userId: string,
  file: File,
  type: Document['type'],
  metadata?: Document['metadata']
) => {
  try {
    // Upload file to storage
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;
    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('documents')
      .getPublicUrl(fileName);

    // Create document record
    const { data, error } = await supabase
      .from('documents')
      .insert([
        {
          user_id: userId,
          name: file.name,
          type,
          url: publicUrl,
          metadata
        }
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error: any) {
    console.error('Error uploading document:', error);
    throw error;
  }
};

export const getDocuments = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error: any) {
    console.error('Error fetching documents:', error);
    throw error;
  }
};

export const deleteDocument = async (documentId: string) => {
  try {
    // Get document URL
    const { data: document, error: fetchError } = await supabase
      .from('documents')
      .select('url')
      .eq('id', documentId)
      .single();

    if (fetchError) throw fetchError;

    // Delete from storage
    const fileName = document.url.split('/').pop();
    if (fileName) {
      const { error: deleteError } = await supabase.storage
        .from('documents')
        .remove([fileName]);

      if (deleteError) throw deleteError;
    }

    // Delete record
    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', documentId);

    if (error) throw error;
  } catch (error: any) {
    console.error('Error deleting document:', error);
    throw error;
  }
};

export const updateDocumentMetadata = async (
  documentId: string,
  metadata: Document['metadata']
) => {
  try {
    const { data, error } = await supabase
      .from('documents')
      .update({ metadata })
      .eq('id', documentId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error: any) {
    console.error('Error updating document metadata:', error);
    throw error;
  }
}; 