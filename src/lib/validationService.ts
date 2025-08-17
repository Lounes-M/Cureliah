// ===================================
// SERVICE DE VALIDATION CENTRALISÉ
// ===================================

import { z } from 'zod';
import { createError, handleError } from './errorManager';
import { logger } from "@/services/logger";

// ===================================
// TYPES DE BASE POUR LA VALIDATION
// ===================================

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  details?: string[];
}

export interface ValidationConfig {
  throwOnError: boolean;
  logErrors: boolean;
  context?: string;
}

// ===================================
// SCHÉMAS DE VALIDATION COURANTS
// ===================================

// Schémas de base
export const emailSchema = z.string()
  .email('Adresse email invalide')
  .max(255, 'Adresse email trop longue');

export const phoneSchema = z.string()
  .regex(/^(\+33|0)[1-9](\d{8})$/, 'Numéro de téléphone français invalide')
  .optional()
  .or(z.literal(''));

export const passwordSchema = z.string()
  .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
  .max(128, 'Le mot de passe ne peut pas dépasser 128 caractères')
  .regex(/[A-Z]/, 'Le mot de passe doit contenir au moins une majuscule')
  .regex(/[a-z]/, 'Le mot de passe doit contenir au moins une minuscule')
  .regex(/[0-9]/, 'Le mot de passe doit contenir au moins un chiffre')
  .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Le mot de passe doit contenir au moins un caractère spécial');

export const urlSchema = z.string()
  .url('URL invalide')
  .optional()
  .or(z.literal(''));

export const siretSchema = z.string()
  .regex(/^\d{14}$/, 'Le numéro SIRET doit contenir exactement 14 chiffres')
  .optional()
  .or(z.literal(''));

export const postalCodeSchema = z.string()
  .regex(/^\d{5}$/, 'Le code postal doit contenir exactement 5 chiffres')
  .optional()
  .or(z.literal(''));

// ===================================
// SCHÉMAS MÉTIER
// ===================================

// Schéma de profil utilisateur
export const profileSchema = z.object({
  first_name: z.string().min(1, 'Le prénom est obligatoire').max(50, 'Prénom trop long'),
  last_name: z.string().min(1, 'Le nom est obligatoire').max(50, 'Nom trop long'),
  email: emailSchema,
  phone: phoneSchema,
  avatar_url: urlSchema,
  user_type: z.enum(['doctor', 'establishment', 'admin'], {
    errorMap: () => ({ message: 'Type d\'utilisateur invalide' })
  }),
});

// Schéma de profil médecin
export const doctorProfileSchema = z.object({
  specialty: z.string().min(1, 'La spécialité est obligatoire').max(100),
  sub_specialties: z.array(z.string().max(100)).default([]),
  experience_years: z.number().int().min(0, 'L\'expérience ne peut pas être négative').max(60, 'Expérience irréaliste'),
  education: z.array(z.object({
    degree: z.string().min(1, 'Le diplôme est obligatoire').max(200),
    institution: z.string().min(1, 'L\'établissement est obligatoire').max(200),
    year: z.number().int().min(1950).max(new Date().getFullYear()),
    verified: z.boolean().optional(),
  })).min(1, 'Au moins un diplôme est requis'),
  languages: z.array(z.string()).min(1, 'Au moins une langue est requise'),
  bio: z.string().max(1000, 'La biographie est trop longue').optional().or(z.literal('')),
  consultation_fee: z.number().int().min(0, 'Les honoraires ne peuvent pas être négatifs'),
  availability: z.object({
    days: z.array(z.enum(['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'])),
    hours: z.string().min(1, 'Les horaires sont obligatoires'),
  }),
  license_number: z.string().min(1, 'Le numéro de licence est obligatoire').max(50),
});

// Schéma de profil établissement
export const establishmentProfileSchema = z.object({
  name: z.string().min(1, 'Le nom est obligatoire').max(200),
  type: z.string().min(1, 'Le type d\'établissement est obligatoire').max(100),
  specialties: z.array(z.string()).min(1, 'Au moins une spécialité est requise'),
  address: z.string().min(1, 'L\'adresse est obligatoire').max(500),
  city: z.string().min(1, 'La ville est obligatoire').max(100),
  postal_code: postalCodeSchema.refine(val => val !== '', 'Le code postal est obligatoire'),
  phone: phoneSchema.refine(val => val !== '', 'Le téléphone est obligatoire'),
  website: urlSchema,
  siret: siretSchema.refine(val => val !== '', 'Le SIRET est obligatoire'),
  description: z.string().max(2000, 'La description est trop longue').optional().or(z.literal('')),
  services: z.array(z.string()).default([]),
  facilities: z.array(z.string()).default([]),
  staff_count: z.number().int().min(1, 'Au moins 1 employé est requis').max(10000),
  operating_hours: z.object({
    days: z.array(z.enum(['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'])),
    hours: z.string().min(1, 'Les horaires sont obligatoires'),
  }),
  insurance_accepted: z.array(z.string()).default([]),
  payment_methods: z.array(z.string()).min(1, 'Au moins un moyen de paiement est requis'),
});

// Schéma de mission premium
export const premiumMissionSchema = z.object({
  title: z.string().min(1, 'Le titre est obligatoire').max(200),
  description: z.string().min(1, 'La description est obligatoire').max(2000),
  specialty: z.string().min(1, 'La spécialité est obligatoire'),
  location: z.string().min(1, 'La localisation est obligatoire'),
  start_date: z.string().datetime('Date de début invalide'),
  end_date: z.string().datetime('Date de fin invalide'),
  application_deadline: z.string().datetime('Date limite de candidature invalide'),
  salary_min: z.number().int().positive('Le salaire minimum doit être positif'),
  salary_max: z.number().int().positive('Le salaire maximum doit être positif'),
  spots_available: z.number().int().positive('Le nombre de postes doit être positif'),
  urgency: z.enum(['normal', 'high', 'critical']),
  premium_perks: z.array(z.string()).default([]),
  duration: z.string().min(1, 'La durée est obligatoire'),
}).refine(data => new Date(data.end_date) > new Date(data.start_date), {
  message: 'La date de fin doit être postérieure à la date de début',
  path: ['end_date'],
}).refine(data => new Date(data.application_deadline) < new Date(data.start_date), {
  message: 'La date limite doit être antérieure à la date de début',
  path: ['application_deadline'],
}).refine(data => data.salary_max >= data.salary_min, {
  message: 'Le salaire maximum doit être supérieur ou égal au salaire minimum',
  path: ['salary_max'],
});

// Schéma de candidature
export const missionApplicationSchema = z.object({
  mission_id: z.string().uuid('ID de mission invalide'),
  cover_letter: z.string().max(1000, 'La lettre de motivation est trop longue').optional().or(z.literal('')),
  expected_compensation: z.number().int().positive('La rémunération attendue doit être positive').optional(),
  availability_confirmed: z.boolean(),
});

// Schémas pour les filtres
export const premiumMissionFilterSchema = z.object({
  specialty: z.string().optional(),
  location: z.string().optional(),
  salary_min: z.number().int().nonnegative().optional(),
  salary_max: z.number().int().positive().optional(),
  urgency: z.enum(['normal', 'high', 'critical']).optional(),
  available_spots_only: z.boolean().optional(),
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
}).refine(data => {
  if (data.salary_min && data.salary_max) {
    return data.salary_max >= data.salary_min;
  }
  return true;
}, {
  message: 'Le salaire maximum doit être supérieur au salaire minimum',
  path: ['salary_max'],
});

// ===================================
// CLASSE DE VALIDATION CENTRALISÉE
// ===================================

class ValidationService {
  private defaultConfig: ValidationConfig = {
    throwOnError: false,
    logErrors: true,
    context: 'validation',
  };

  /**
   * Valide des données avec un schéma Zod
   */
  public validate<T>(
    schema: z.ZodSchema<T>,
    data: unknown,
    config: Partial<ValidationConfig> = {}
  ): ValidationResult<T> {
    const finalConfig = { ...this.defaultConfig, ...config };

    try {
      const result = schema.parse(data);
      
      if (finalConfig.logErrors) {
        logger.debug('Validation successful', { 
          context: finalConfig.context,
          dataType: schema.constructor.name 
        });
      }

      return {
        success: true,
        data: result,
      };

    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessages = error.errors.map(err => 
          `${err.path.join('.')}: ${err.message}`
        );
        
        const errorMessage = `Validation failed: ${errorMessages.join(', ')}`;

        if (finalConfig.logErrors) {
          logger.warning('Validation failed', {
            context: finalConfig.context,
            errors: errorMessages,
            data: JSON.stringify(data),
          });
        }

        if (finalConfig.throwOnError) {
          const appError = createError(
            'VALIDATION_INVALID_FORMAT',
            errorMessage,
            'warning',
            { validationErrors: errorMessages }
          );
          throw appError;
        }

        return {
          success: false,
          error: errorMessage,
          details: errorMessages,
        };
      }

      // Erreur inattendue
      const errorMessage = `Unexpected validation error: ${error instanceof Error ? error.message : 'Unknown error'}`;
      
      if (finalConfig.logErrors) {
        logger.error('Unexpected validation error', {
          context: finalConfig.context,
          error: errorMessage,
          stack: error instanceof Error ? error.stack : undefined,
        });
      }

      if (finalConfig.throwOnError) {
        const appError = createError(
          'SYSTEM_UNKNOWN_ERROR',
          errorMessage,
          'error'
        );
        throw appError;
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Valide un email
   */
  public validateEmail(email: string): ValidationResult<string> {
    return this.validate(emailSchema, email, { context: 'email' });
  }

  /**
   * Valide un mot de passe
   */
  public validatePassword(password: string): ValidationResult<string> {
    return this.validate(passwordSchema, password, { context: 'password' });
  }

  /**
   * Valide un profil utilisateur
   */
  public validateProfile(data: unknown): ValidationResult<z.infer<typeof profileSchema>> {
    return this.validate(profileSchema, data, { context: 'profile' });
  }

  /**
   * Valide un profil médecin
   */
  public validateDoctorProfile(data: unknown): ValidationResult<z.infer<typeof doctorProfileSchema>> {
    return this.validate(doctorProfileSchema, data, { context: 'doctor_profile' });
  }

  /**
   * Valide un profil établissement
   */
  public validateEstablishmentProfile(data: unknown): ValidationResult<z.infer<typeof establishmentProfileSchema>> {
    return this.validate(establishmentProfileSchema, data, { context: 'establishment_profile' });
  }

  /**
   * Valide une mission premium
   */
  public validatePremiumMission(data: unknown): ValidationResult<z.infer<typeof premiumMissionSchema>> {
    return this.validate(premiumMissionSchema, data, { context: 'premium_mission' });
  }

  /**
   * Valide une candidature
   */
  public validateMissionApplication(data: unknown): ValidationResult<z.infer<typeof missionApplicationSchema>> {
    return this.validate(missionApplicationSchema, data, { context: 'mission_application' });
  }

  /**
   * Valide des filtres de mission premium
   */
  public validatePremiumMissionFilter(data: unknown): ValidationResult<z.infer<typeof premiumMissionFilterSchema>> {
    return this.validate(premiumMissionFilterSchema, data, { context: 'premium_mission_filter' });
  }

  /**
   * Validation personnalisée avec callback
   */
  public validateCustom<T>(
    data: T,
    validator: (data: T) => boolean | string,
    errorMessage = 'Validation failed'
  ): ValidationResult<T> {
    try {
      const result = validator(data);
      
      if (result === true) {
        return {
          success: true,
          data,
        };
      }

      const message = typeof result === 'string' ? result : errorMessage;
      
      logger.warning('Custom validation failed', {
        context: 'custom_validation',
        error: message,
        data: JSON.stringify(data),
      });

      return {
        success: false,
        error: message,
      };

    } catch (error) {
      const message = `Custom validation error: ${error instanceof Error ? error.message : 'Unknown error'}`;
      
      logger.error('Custom validation error', {
        context: 'custom_validation',
        error: message,
        stack: error instanceof Error ? error.stack : undefined,
      });

      return {
        success: false,
        error: message,
      };
    }
  }

  /**
   * Valide plusieurs schémas en parallèle
   */
  public validateMultiple<T extends Record<string, unknown>>(
    validations: Array<{
      name: string;
      schema: z.ZodSchema<any>;
      data: unknown;
    }>
  ): { success: boolean; results: Record<string, ValidationResult<any>>; errors: string[] } {
    const results: Record<string, ValidationResult<any>> = {};
    const errors: string[] = [];

    for (const validation of validations) {
      const result = this.validate(validation.schema, validation.data, {
        context: validation.name,
        throwOnError: false,
        logErrors: false, // Log global à la fin
      });

      results[validation.name] = result;

      if (!result.success && result.error) {
        errors.push(`${validation.name}: ${result.error}`);
      }
    }

    const success = errors.length === 0;

    if (!success) {
      logger.warning('Multiple validation failed', {
        context: 'multiple_validation',
        errors,
        failedCount: errors.length,
        totalCount: validations.length,
      });
    } else {
      logger.debug('Multiple validation successful', {
        context: 'multiple_validation',
        validatedCount: validations.length,
      });
    }

    return {
      success,
      results,
      errors,
    };
  }
}

// ===================================
// INSTANCE GLOBALE
// ===================================

export const validationService = new ValidationService();

// ===================================
// FONCTIONS UTILITAIRES
// ===================================

/**
 * Valide rapidement des données avec gestion d'erreur automatique
 */
export function quickValidate<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  showToast = true
): T | null {
  const result = validationService.validate(schema, data, {
    throwOnError: false,
    logErrors: true,
  });

  if (!result.success) {
    if (showToast && result.error) {
      const error = createError(
        'VALIDATION_INVALID_FORMAT',
        result.error,
        'warning'
      );
      handleError(error);
    }
    return null;
  }

  return result.data!;
}

/**
 * Crée un schéma de validation avec transformation
 */
export function createTransformSchema<Input, Output>(
  baseSchema: z.ZodSchema<Input>,
  transform: (data: Input) => Output
): z.ZodEffects<z.ZodSchema<Input>, Output, Input> {
  return baseSchema.transform(transform);
}

/**
 * Hook pour la validation dans les composants React
 */
export function useValidation() {
  return {
    validate: validationService.validate.bind(validationService),
    validateEmail: validationService.validateEmail.bind(validationService),
    validatePassword: validationService.validatePassword.bind(validationService),
    validateProfile: validationService.validateProfile.bind(validationService),
    validateDoctorProfile: validationService.validateDoctorProfile.bind(validationService),
    validateEstablishmentProfile: validationService.validateEstablishmentProfile.bind(validationService),
    validatePremiumMission: validationService.validatePremiumMission.bind(validationService),
    validateMissionApplication: validationService.validateMissionApplication.bind(validationService),
    validatePremiumMissionFilter: validationService.validatePremiumMissionFilter.bind(validationService),
    validateCustom: validationService.validateCustom.bind(validationService),
    validateMultiple: validationService.validateMultiple.bind(validationService),
    quickValidate,
  };
}

export default validationService;
