import { supabase } from '@/integrations/supabase/client.browser';

export interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: 'doctor' | 'establishment' | 'admin';
  speciality?: string;
  languages?: string[];
  certifications?: string[];
  address?: string;
  city?: string;
  country?: string;
  profile_picture_url?: string;
  rating?: number;
  created_at: string;
  updated_at: string;
}

export const getProfile = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;

    return data;
  } catch (error: any) {
    console.error('Error fetching profile:', error);
    throw error;
  }
};

export const updateProfile = async (userId: string, updates: Partial<Profile>) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    return data;
  } catch (error: any) {
    console.error('Error updating profile:', error);
    throw error;
  }
};

export const uploadProfilePicture = async (userId: string, file: File, userType: 'doctor' | 'establishment') => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;
    const bucket = userType === 'doctor' ? 'avatars' : 'logos';

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    // Update the correct profile table based on user type
    const { error: updateError } = await supabase
      .from(userType === 'doctor' ? 'doctor_profiles' : 'establishment_profiles')
      .update({ [userType === 'doctor' ? 'avatar_url' : 'logo_url']: publicUrl })
      .eq('id', userId);

    if (updateError) throw updateError;

    return publicUrl;
  } catch (error: any) {
    console.error('Error uploading profile picture:', error);
    throw error;
  }
};

export const getDoctors = async (filters?: {
  speciality?: string;
  city?: string;
  minRating?: number;
}) => {
  try {
    let query = supabase
      .from('profiles')
      .select('*')
      .eq('role', 'doctor');

    if (filters?.speciality) {
      query = query.eq('speciality', filters.speciality);
    }

    if (filters?.city) {
      query = query.ilike('city', `%${filters.city}%`);
    }

    if (filters?.minRating) {
      query = query.gte('rating', filters.minRating);
    }

    const { data, error } = await query;

    if (error) throw error;

    return data;
  } catch (error: any) {
    console.error('Error fetching doctors:', error);
    throw error;
  }
};

export const getEstablishments = async (filters?: {
  city?: string;
  minRating?: number;
}) => {
  try {
    let query = supabase
      .from('profiles')
      .select('*')
      .eq('role', 'establishment');

    if (filters?.city) {
      query = query.ilike('city', `%${filters.city}%`);
    }

    if (filters?.minRating) {
      query = query.gte('rating', filters.minRating);
    }

    const { data, error } = await query;

    if (error) throw error;

    return data;
  } catch (error: any) {
    console.error('Error fetching establishments:', error);
    throw error;
  }
};