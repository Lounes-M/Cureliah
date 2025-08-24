import { z } from 'zod';

// Common validation schemas
export const emailSchema = z
  .string()
  .email('Adresse email invalide')
  .min(1, 'Email requis');

export const passwordSchema = z
  .string()
  .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
  .regex(/[A-Z]/, 'Le mot de passe doit contenir au moins une majuscule')
  .regex(/[a-z]/, 'Le mot de passe doit contenir au moins une minuscule')
  .regex(/[0-9]/, 'Le mot de passe doit contenir au moins un chiffre')
  .regex(/[^A-Za-z0-9]/, 'Le mot de passe doit contenir au moins un caractère spécial');

export const phoneSchema = z
  .string()
  .regex(/^(?:\+33|0)[1-9](?:[0-9]{8})$/, 'Numéro de téléphone français invalide')
  .optional()
  .or(z.literal(''));

export const siretSchema = z
  .string()
  .regex(/^[0-9]{14}$/, 'Le numéro SIRET doit contenir 14 chiffres')
  .optional()
  .or(z.literal(''));

export const licenseNumberSchema = z
  .string()
  .min(1, 'Numéro de licence requis')
  .max(20, 'Numéro de licence trop long');

// User validation schemas
export const userRegistrationSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
  firstName: z.string().min(1, 'Prénom requis').max(50, 'Prénom trop long'),
  lastName: z.string().min(1, 'Nom requis').max(50, 'Nom trop long'),
  userType: z.enum(['doctor', 'establishment'], {
    required_error: 'Type d\'utilisateur requis'
  }),
  acceptTerms: z.boolean().refine(val => val === true, {
    message: 'Vous devez accepter les conditions d\'utilisation'
  })
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword']
});

export const userLoginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Mot de passe requis')
});

export const userProfileSchema = z.object({
  firstName: z.string().min(1, 'Prénom requis').max(50, 'Prénom trop long'),
  lastName: z.string().min(1, 'Nom requis').max(50, 'Nom trop long'),
  phone: phoneSchema,
  bio: z.string().max(500, 'Biographie trop longue').optional(),
  avatar: z.string().url('URL d\'avatar invalide').optional().or(z.literal(''))
});

// Doctor validation schemas
export const doctorProfileSchema = z.object({
  speciality: z.string().min(1, 'Spécialité requise'),
  licenseNumber: licenseNumberSchema,
  experienceYears: z.number().min(0, 'Expérience invalide').max(50, 'Expérience trop élevée'),
  // Suppression de la validation du tarif horaire pour les médecins
  education: z.array(z.string()).optional(),
  languages: z.array(z.string()).optional(),
  certifications: z.array(z.string()).optional(),
  availability: z.object({
    days: z.array(z.string()),
    hours: z.string()
  }).optional()
});

// Establishment validation schemas
export const establishmentProfileSchema = z.object({
  establishmentName: z.string().min(1, 'Nom d\'établissement requis').max(100, 'Nom trop long'),
  establishmentType: z.enum(['hospital', 'clinic', 'care_home', 'medical_center', 'other'], {
    required_error: 'Type d\'établissement requis'
  }),
  address: z.string().min(1, 'Adresse requise').max(200, 'Adresse trop longue'),
  city: z.string().min(1, 'Ville requise').max(50, 'Ville trop longue'),
  postalCode: z.string().regex(/^[0-9]{5}$/, 'Code postal invalide'),
  phone: phoneSchema,
  website: z.string().url('URL de site web invalide').optional().or(z.literal('')),
  siret: siretSchema,
  contactPerson: z.string().min(1, 'Personne de contact requise').max(100, 'Nom trop long'),
  description: z.string().max(1000, 'Description trop longue').optional()
});

// Booking validation schemas
export const bookingRequestSchema = z.object({
  vacationId: z.string().uuid('ID de vacation invalide'),
  message: z.string().min(10, 'Message trop court (minimum 10 caractères)').max(500, 'Message trop long'),
  urgency: z.enum(['low', 'medium', 'high']),
  contactPhone: phoneSchema.refine(val => val !== '', {
    message: 'Numéro de téléphone requis pour les réservations'
  }),
  durationHours: z.number().min(1, 'Durée minimum: 1 heure').max(24, 'Durée maximum: 24 heures'),
  preferredStartTime: z.string().regex(/^[0-9]{2}:[0-9]{2}$/, 'Format d\'heure invalide (HH:MM)')
});

export const vacationPostSchema = z.object({
  title: z.string().min(1, 'Titre requis').max(100, 'Titre trop long'),
  description: z.string().min(10, 'Description trop courte').max(1000, 'Description trop longue'),
  location: z.string().min(1, 'Localisation requise').max(100, 'Localisation trop longue'),
  startDate: z.string().refine(val => !isNaN(Date.parse(val)), {
    message: 'Date de début invalide'
  }),
  endDate: z.string().refine(val => !isNaN(Date.parse(val)), {
    message: 'Date de fin invalide'
  }),
  // Suppression de la validation du tarif horaire pour les vacations
  actType: z.enum(['full_time', 'part_time', 'emergency', 'consultation'], {
    required_error: 'Type d\'activité requis'
  }),
  requirements: z.array(z.string()).optional(),
  maxDistance: z.number().min(0).max(200).optional()
}).refine((data) => {
  const startDate = new Date(data.startDate);
  const endDate = new Date(data.endDate);
  return startDate < endDate;
}, {
  message: 'La date de fin doit être après la date de début',
  path: ['endDate']
});

// Review validation schemas
export const reviewSchema = z.object({
  rating: z.number().min(1, 'Note minimum: 1').max(5, 'Note maximum: 5'),
  comment: z.string().min(10, 'Commentaire trop court').max(500, 'Commentaire trop long'),
  bookingId: z.string().uuid('ID de réservation invalide')
});

// Message validation schemas
export const messageSchema = z.object({
  content: z.string().min(1, 'Message requis').max(1000, 'Message trop long'),
  receiverId: z.string().uuid('ID de destinataire invalide'),
  bookingId: z.string().uuid('ID de réservation invalide')
});

// Payment validation schemas
export const paymentSchema = z.object({
  // Suppression de la validation du montant pour les vacations
  bookingId: z.string().uuid('ID de réservation invalide'),
  paymentMethod: z.enum(['card', 'sepa', 'paypal'], {
    required_error: 'Méthode de paiement requise'
  })
});

// Document validation schemas
export const documentSchema = z.object({
  name: z.string().min(1, 'Nom du document requis').max(100, 'Nom trop long'),
  category: z.enum(['diploma', 'certification', 'insurance', 'license', 'other'], {
    required_error: 'Catégorie requise'
  }),
  file: z.instanceof(File, { message: 'Fichier requis' })
}).refine((data) => {
  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
  return allowedTypes.includes(data.file.type);
}, {
  message: 'Type de fichier non autorisé (PDF, JPEG, PNG uniquement)',
  path: ['file']
}).refine((data) => {
  const maxSize = 10 * 1024 * 1024; // 10MB
  return data.file.size <= maxSize;
}, {
  message: 'Taille de fichier trop importante (maximum 10MB)',
  path: ['file']
});

// Search validation schemas
export const searchFiltersSchema = z.object({
  location: z.string().max(100, 'Localisation trop longue').optional(),
  speciality: z.string().max(50, 'Spécialité trop longue').optional(),
  actType: z.string().max(50, 'Type d\'activité trop long').optional(),
  minRate: z.number().min(0).max(500).optional(),
  maxRate: z.number().min(0).max(500).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  maxDistance: z.number().min(0).max(200).optional()
}).refine((data) => {
  if (data.minRate && data.maxRate) {
    return data.minRate <= data.maxRate;
  }
  return true;
}, {
  message: 'Le tarif minimum doit être inférieur au tarif maximum',
  path: ['maxRate']
});

// Validation helper functions
export const validateEmail = (email: string): boolean => {
  try {
    emailSchema.parse(email);
    return true;
  } catch {
    return false;
  }
};

export const validatePassword = (password: string): boolean => {
  try {
    passwordSchema.parse(password);
    return true;
  } catch {
    return false;
  }
};

export const validatePhone = (phone: string): boolean => {
  try {
    phoneSchema.parse(phone);
    return true;
  } catch {
    return false;
  }
};

export const getValidationErrors = (schema: z.ZodSchema, data: any): Record<string, string> => {
  try {
    schema.parse(data);
    return {};
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      error.errors.forEach((err) => {
        const path = err.path.join('.');
        errors[path] = err.message;
      });
      return errors;
    }
    return { general: 'Erreur de validation' };
  }
};

export const validateField = (schema: z.ZodSchema, data: any, field: string): string | null => {
  try {
    schema.parse(data);
    return null;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const fieldError = error.errors.find(err => err.path.includes(field));
      return fieldError ? fieldError.message : null;
    }
    return 'Erreur de validation';
  }
};

export default {
  emailSchema,
  passwordSchema,
  phoneSchema,
  userRegistrationSchema,
  userLoginSchema,
  userProfileSchema,
  doctorProfileSchema,
  establishmentProfileSchema,
  bookingRequestSchema,
  vacationPostSchema,
  reviewSchema,
  messageSchema,
  paymentSchema,
  documentSchema,
  searchFiltersSchema,
  validateEmail,
  validatePassword,
  validatePhone,
  getValidationErrors,
  validateField
};
