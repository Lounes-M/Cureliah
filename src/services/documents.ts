import { supabase } from '@/integrations/supabase/client.browser';

export interface Document {
  id: string;
  user_id: string;
  name: string;
  type: string;
  url: string;
  created_at: string;
  metadata?: any;
}

export const uploadDocument = async (
  userId: string,
  file: File,
  metadata?: any
): Promise<Document> => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;
    const filePath = `documents/${fileName}`;

    console.log('Uploading document:', { filePath, fileType: file.type, fileSize: file.size });

    // Upload file to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, file);

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      throw uploadError;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('documents')
      .getPublicUrl(filePath);

    console.log('Creating document record:', { userId, name: file.name, type: file.type });

    // Create document record
    const { data: document, error: dbError } = await supabase
      .from('documents')
      .insert([
        {
          user_id: userId,
          name: file.name,
          type: file.type,
          url: publicUrl,
          created_at: new Date().toISOString(),
          metadata,
        },
      ])
      .select()
      .single();

    if (dbError) {
      console.error('Database insert error:', dbError);
      throw dbError;
    }

    return document;
  } catch (error) {
    console.error('Error uploading document:', error);
    throw error;
  }
};

export const getDocuments = async (userId: string) => {
  try {
    console.log('Fetching documents for user:', userId);
    
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database select error:', error);
      throw error;
    }

    console.log('Documents fetched successfully:', data?.length);
    return data;
  } catch (error) {
    console.error('Error fetching documents:', error);
    throw error;
  }
};

export const deleteDocument = async (documentId: string) => {
  try {
    console.log('Deleting document:', documentId);

    // Get document details
    const { data: document, error: fetchError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (fetchError) {
      console.error('Document fetch error:', fetchError);
      throw fetchError;
    }

    // Delete from storage
    const filePath = document.url.split('/').pop();
    const { error: storageError } = await supabase.storage
      .from('documents')
      .remove([`${document.user_id}/${filePath}`]);

    if (storageError) {
      console.error('Storage delete error:', storageError);
      throw storageError;
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from('documents')
      .delete()
      .eq('id', documentId);

    if (dbError) {
      console.error('Database delete error:', dbError);
      throw dbError;
    }

    console.log('Document deleted successfully');
  } catch (error) {
    console.error('Error deleting document:', error);
    throw error;
  }
};