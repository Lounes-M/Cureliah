import { supabase } from '@/integrations/supabase/client.browser';
import { logger } from '@/services/logger';
import { ErrorHandler } from '@/utils/errorHandler';

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

    logger.debug('Uploading document', { filePath, fileType: file.type, fileSize: file.size, component: 'Documents', action: 'upload_start' });

    // Upload file to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, file);

    if (uploadError) {
      ErrorHandler.handleError(uploadError, { filePath, fileType: file.type, component: 'Documents', action: 'storage_upload_error' });
      throw uploadError;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('documents')
      .getPublicUrl(filePath);

    logger.debug('Creating document record', { userId, name: file.name, type: file.type, component: 'Documents', action: 'db_insert_start' });

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
      ErrorHandler.handleError(dbError, { userId, fileName: file.name, component: 'Documents', action: 'db_insert_error' });
      throw dbError;
    }

    return document;
  } catch (error) {
    ErrorHandler.handleUnexpectedError(error as Error, { userId, fileName: file.name });
    throw error;
  }
};

export const getDocuments = async (userId: string) => {
  try {
    logger.debug('Fetching documents for user', { userId, component: 'Documents', action: 'fetch_start' });
    
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      ErrorHandler.handleError(error, { userId, component: 'Documents', action: 'db_select_error' });
      throw error;
    }

    logger.debug('Documents fetched successfully', { count: data?.length, userId, component: 'Documents', action: 'fetch_success' });
    return data;
  } catch (error) {
    ErrorHandler.handleUnexpectedError(error as Error, { userId });
    throw error;
  }
};

export const deleteDocument = async (documentId: string) => {
  try {
    logger.debug('Deleting document', { documentId, component: 'Documents', action: 'delete_start' });

    // Get document details
    const { data: document, error: fetchError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (fetchError) {
      ErrorHandler.handleError(fetchError, { documentId, component: 'Documents', action: 'document_fetch_error' });
      throw fetchError;
    }

    // Delete from storage
    const filePath = document.url.split('/').pop();
    const { error: storageError } = await supabase.storage
      .from('documents')
      .remove([`${document.user_id}/${filePath}`]);

    if (storageError) {
      ErrorHandler.handleError(storageError, { documentId, filePath, component: 'Documents', action: 'storage_delete_error' });
      throw storageError;
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from('documents')
      .delete()
      .eq('id', documentId);

    if (dbError) {
      ErrorHandler.handleError(dbError, { documentId, component: 'Documents', action: 'db_delete_error' });
      throw dbError;
    }

    logger.info('Document deleted successfully', { documentId, component: 'Documents', action: 'delete_success' });
  } catch (error) {
    ErrorHandler.handleUnexpectedError(error as Error, { documentId });
    throw error;
  }
};