
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

export const createVacation = async (vacationData: Omit<VacationPost, 'id' | 'created_at' | 'updated_at'>) => {
  try {
    console.log('Creating vacation with data:', vacationData);

    // Get existing vacations for date validation
    const { data: existingVacations } = await supabase
      .from('vacation_posts')
      .select('*')
      .eq('doctor_id', vacationData.doctor_id);

    // Validate dates
    const dateValidation = validateVacationDates(
      vacationData.start_date,
      vacationData.end_date,
      existingVacations || []
    );

    if (!dateValidation.isValid) {
      throw new Error('Il y a un conflit avec une autre vacation sur cette période');
    }

    // Validate time slots
    if (!vacationData.time_slots || vacationData.time_slots.length === 0) {
      throw new Error('Au moins un créneau horaire doit être spécifié');
    }

    // Validate time slot types
    for (const slot of vacationData.time_slots) {
      if (slot.type === 'custom' && (!slot.start_time || !slot.end_time)) {
        throw new Error('Les créneaux personnalisés doivent avoir une heure de début et de fin');
      }
    }

    // Extract time slots from vacation data
    const { time_slots, ...vacationWithoutSlots } = vacationData;

    // Create vacation post first
    const { data: vacation, error: vacationError } = await supabase
      .from('vacation_posts')
      .insert([vacationWithoutSlots])
      .select()
      .single();

    if (vacationError) throw vacationError;

    console.log('Vacation created:', vacation);

    // Create time slots with vacation_id
    if (time_slots && time_slots.length > 0) {
      const slotsToInsert = time_slots.map(slot => ({
        vacation_id: vacation.id,
        type: slot.type,
        start_time: slot.start_time || null,
        end_time: slot.end_time || null
      }));

      console.log('Creating time slots:', slotsToInsert);

      const { data: slots, error: slotsError } = await supabase
        .from('time_slots')
        .insert(slotsToInsert)
        .select();

      if (slotsError) {
        console.error('Error creating time slots:', slotsError);
        // Rollback vacation creation
        await supabase.from('vacation_posts').delete().eq('id', vacation.id);
        throw slotsError;
      }

      console.log('Time slots created:', slots);

      // Return vacation with time slots
      return {
        ...vacation,
        time_slots: slots
      };
    }

    return vacation;
  } catch (error: any) {
    console.error('Error creating vacation:', error);
    throw error;
  }
};

export const updateVacation = async (id: string, vacationData: Partial<VacationPost>) => {
  try {
    console.log('Updating vacation:', id, vacationData);

    // If dates are being updated, validate them
    if (vacationData.start_date || vacationData.end_date) {
      const existingVacation = await getVacationById(id);
      const { data: existingVacations } = await supabase
        .from('vacation_posts')
        .select('*')
        .eq('doctor_id', existingVacation.doctor_id)
        .neq('id', id);

      const dateValidation = validateVacationDates(
        vacationData.start_date || existingVacation.start_date,
        vacationData.end_date || existingVacation.end_date,
        existingVacations || []
      );

      if (!dateValidation.isValid) {
        throw new Error('Il y a un conflit avec une autre vacation sur cette période');
      }
    }

    // Handle time slots update separately
    const { time_slots, ...vacationWithoutSlots } = vacationData;

    // Update vacation post
    const { data: vacation, error: vacationError } = await supabase
      .from('vacation_posts')
      .update(vacationWithoutSlots)
      .eq('id', id)
      .select()
      .single();

    if (vacationError) throw vacationError;

    // If time slots are being updated
    if (time_slots !== undefined) {
      // Validate time slots
      if (time_slots.length === 0) {
        throw new Error('Au moins un créneau horaire doit être spécifié');
      }

      for (const slot of time_slots) {
        if (slot.type === 'custom' && (!slot.start_time || !slot.end_time)) {
          throw new Error('Les créneaux personnalisés doivent avoir une heure de début et de fin');
        }
      }

      // Delete existing time slots
      await supabase
        .from('time_slots')
        .delete()
        .eq('vacation_id', id);

      // Create new time slots
      if (time_slots.length > 0) {
        const slotsToInsert = time_slots.map(slot => ({
          vacation_id: id,
          type: slot.type,
          start_time: slot.start_time || null,
          end_time: slot.end_time || null
        }));

        const { data: slots, error: slotsError } = await supabase
          .from('time_slots')
          .insert(slotsToInsert)
          .select();

        if (slotsError) throw slotsError;

        return {
          ...vacation,
          time_slots: slots
        };
      }
    }

    return vacation;
  } catch (error: any) {
    console.error('Error updating vacation:', error);
    throw error;
  }
};

export const deleteVacation = async (id: string) => {
  try {
    // Delete time slots first (foreign key constraint)
    await supabase
      .from('time_slots')
      .delete()
      .eq('vacation_id', id);

    // Delete vacation
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
