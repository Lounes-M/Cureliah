import { supabase } from '@/integrations/supabase/client';
import { VacationPost, TimeSlot, VacationStatus } from '@/types/database';
import { validateVacationDates } from './dateConflictService';

export const getVacations = async (filters?: {
  doctorId?: string;
  establishmentId?: string;
  status?: VacationStatus;
}) => {
  try {
    let query = supabase
      .from('vacation_posts')
      .select(`
        *,
        doctor:profiles!vacation_posts_doctor_id_fkey (*),
        establishment:profiles!vacation_posts_establishment_id_fkey (*),
        time_slots(*)
      `);

    if (filters?.doctorId) {
      query = query.eq('doctor_id', filters.doctorId);
    }

    if (filters?.establishmentId) {
      query = query.eq('establishment_id', filters.establishmentId);
    }

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    return data;
  } catch (error: any) {
    console.error('Error fetching vacations:', error);
    throw error;
  }
};

export const getVacationById = async (id: string) => {
  try {
    const { data, error } = await supabase
      .from('vacation_posts')
      .select(`
        *,
        doctor:profiles!vacation_posts_doctor_id_fkey (*),
        establishment:profiles!vacation_posts_establishment_id_fkey (*),
        time_slots(*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  } catch (error: any) {
    console.error('Error fetching vacation:', error);
    throw error;
  }
};

export const createVacation = async (vacation: Omit<VacationPost, 'id' | 'created_at' | 'updated_at'>) => {
  try {
    // Get existing vacations for date validation
    const { data: existingVacations } = await supabase
      .from('vacation_posts')
      .select('*')
      .eq('doctor_id', vacation.doctor_id);

    // Validate dates
    const dateValidation = validateVacationDates(
      vacation.start_date,
      vacation.end_date,
      existingVacations || []
    );

    if (!dateValidation.isValid) {
      throw new Error('Il y a un conflit avec une autre vacation sur cette période');
    }

    // Validate time slots
    if (!vacation.time_slots || vacation.time_slots.length === 0) {
      throw new Error('Au moins un créneau horaire doit être spécifié');
    }

    // Validate time slot types
    for (const slot of vacation.time_slots) {
      if (slot.type === 'custom' && (!slot.start_time || !slot.end_time)) {
        throw new Error('Les créneaux personnalisés doivent avoir une heure de début et de fin');
      }
    }

    const { data, error } = await supabase
      .from('vacation_posts')
      .insert([vacation])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error: any) {
    console.error('Error creating vacation:', error);
    throw error;
  }
};

export const updateVacation = async (id: string, vacation: Partial<VacationPost>) => {
  try {
    // If dates are being updated, validate them
    if (vacation.start_date || vacation.end_date) {
      const existingVacation = await getVacationById(id);
      const { data: existingVacations } = await supabase
        .from('vacation_posts')
        .select('*')
        .eq('doctor_id', existingVacation.doctor_id)
        .neq('id', id);

      const dateValidation = validateVacationDates(
        vacation.start_date || existingVacation.start_date,
        vacation.end_date || existingVacation.end_date,
        existingVacations || []
      );

      if (!dateValidation.isValid) {
        throw new Error('Il y a un conflit avec une autre vacation sur cette période');
      }
    }

    // If time slots are being updated, validate them
    if (vacation.time_slots) {
      if (vacation.time_slots.length === 0) {
        throw new Error('Au moins un créneau horaire doit être spécifié');
      }

      for (const slot of vacation.time_slots) {
        if (slot.type === 'custom' && (!slot.start_time || !slot.end_time)) {
          throw new Error('Les créneaux personnalisés doivent avoir une heure de début et de fin');
        }
      }
    }

    const { data, error } = await supabase
      .from('vacation_posts')
      .update(vacation)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error: any) {
    console.error('Error updating vacation:', error);
    throw error;
  }
};

export const deleteVacation = async (id: string) => {
  try {
    const { error } = await supabase
      .from('vacation_posts')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error: any) {
    console.error('Error deleting vacation:', error);
    throw error;
  }
};

export const vacationService = {
  getVacations,
  getVacationById,
  createVacation,
  updateVacation,
  deleteVacation
}; 