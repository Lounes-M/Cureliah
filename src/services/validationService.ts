import { supabase } from '@/integrations/supabase/client';
import { Document } from './documentService';
import { Profile } from './profileService';

export interface ValidationRequest {
  id: string;
  user_id: string;
  document_id: string;
  type: 'license' | 'certification' | 'insurance';
  status: 'pending' | 'approved' | 'rejected';
  reviewer_id?: string;
  review_date?: string;
  comments?: string;
  created_at: string;
  updated_at: string;
  document?: Document;
  user?: Profile;
}

export const createValidationRequest = async (
  userId: string,
  documentId: string,
  type: ValidationRequest['type']
) => {
  try {
    const { data, error } = await supabase
      .from('validation_requests')
      .insert([
        {
          user_id: userId,
          document_id: documentId,
          type,
          status: 'pending'
        }
      ])
      .select(`
        *,
        document:documents (*)
      `)
      .single();

    if (error) throw error;

    return data;
  } catch (error: any) {
    console.error('Error creating validation request:', error);
    throw error;
  }
};

export const getValidationRequests = async (filters?: {
  userId?: string;
  status?: ValidationRequest['status'];
  type?: ValidationRequest['type'];
}) => {
  try {
    let query = supabase
      .from('validation_requests')
      .select(`
        *,
        document:documents (*)
      `);

    if (filters?.userId) {
      query = query.eq('user_id', filters.userId);
    }

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.type) {
      query = query.eq('type', filters.type);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    return data;
  } catch (error: any) {
    console.error('Error fetching validation requests:', error);
    throw error;
  }
};

export const updateValidationRequest = async (
  requestId: string,
  updates: {
    status: ValidationRequest['status'];
    reviewer_id: string;
    comments?: string;
  }
) => {
  try {
    const { data, error } = await supabase
      .from('validation_requests')
      .update({
        ...updates,
        review_date: new Date().toISOString()
      })
      .eq('id', requestId)
      .select(`
        *,
        document:documents (*)
      `)
      .single();

    if (error) throw error;

    return data;
  } catch (error: any) {
    console.error('Error updating validation request:', error);
    throw error;
  }
};

export const getPendingValidations = async () => {
  try {
    const { data, error } = await supabase
      .from('validation_requests')
      .select(`
        *,
        document:documents (*),
        user:profiles!validation_requests_user_id_fkey (
          id,
          first_name,
          last_name,
          email,
          role
        )
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data;
  } catch (error: any) {
    console.error('Error fetching pending validations:', error);
    throw error;
  }
};

export const validateUserQualifications = async (userId: string) => {
  try {
    // Get all validation requests for the user
    const { data: requests, error: requestsError } = await supabase
      .from('validation_requests')
      .select('*')
      .eq('user_id', userId);

    if (requestsError) throw requestsError;

    // Check if all required documents are validated
    const requiredTypes = ['license', 'certification', 'insurance'];
    const validatedTypes = requests
      .filter(request => request.status === 'approved')
      .map(request => request.type);

    const missingTypes = requiredTypes.filter(
      type => !validatedTypes.includes(type)
    );

    if (missingTypes.length > 0) {
      return {
        isValid: false,
        missingTypes
      };
    }

    // Update user's validation status
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ is_validated: true })
      .eq('id', userId);

    if (updateError) throw updateError;

    return {
      isValid: true,
      missingTypes: []
    };
  } catch (error: any) {
    console.error('Error validating user qualifications:', error);
    throw error;
  }
}; 