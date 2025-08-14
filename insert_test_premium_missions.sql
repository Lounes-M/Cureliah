-- Script pour insérer des missions premium de test
-- À exécuter après avoir créé les tables premium avec setup_premium_tables.sql

-- D'abord créer quelques établissements de test (si ils n'existent pas)
INSERT INTO establishments (id, name, rating, created_at) VALUES
  ('550e8400-e29b-41d4-a716-446655440000', 'Clinique Saint-Louis', 4.8, NOW()),
  ('550e8400-e29b-41d4-a716-446655440001', 'Hôpital Européen', 4.5, NOW()),
  ('550e8400-e29b-41d4-a716-446655440002', 'Centre Médical Premium', 4.7, NOW())
ON CONFLICT (id) DO NOTHING;

-- Ensuite créer des abonnements premium pour ces établissements
INSERT INTO establishment_subscriptions (establishment_id, plan_type, status, created_at) VALUES
  ('550e8400-e29b-41d4-a716-446655440000', 'premium', 'active', NOW()),
  ('550e8400-e29b-41d4-a716-446655440001', 'pro', 'active', NOW()),
  ('550e8400-e29b-41d4-a716-446655440002', 'premium', 'active', NOW())
ON CONFLICT (establishment_id) DO UPDATE SET
  plan_type = EXCLUDED.plan_type,
  status = EXCLUDED.status;

-- Maintenant créer des missions premium
INSERT INTO premium_missions (
  id,
  title,
  description,
  location,
  salary_min,
  salary_max,
  duration,
  urgency,
  exclusive_until,
  premium_perks,
  establishment_id,
  establishment_name,
  establishment_rating,
  requirements,
  benefits,
  application_deadline,
  spots_available,
  spots_filled,
  created_at,
  updated_at
) VALUES
  (
    '750e8400-e29b-41d4-a716-446655440000',
    'Urgence Cardiologie - Week-end Premium',
    'Mission urgente en cardiologie pour un week-end. Patient VIP nécessitant une surveillance continue.',
    'Paris 8ème',
    800,
    1200,
    '48h',
    'critical',
    NOW() + INTERVAL '7 days',
    ARRAY['Transport premium inclus', 'Hébergement 5*', 'Repas gastro', 'Prime urgence +30%'],
    '550e8400-e29b-41d4-a716-446655440000',
    'Clinique Saint-Louis',
    4.8,
    ARRAY['Spécialiste cardiologue', '5+ ans expérience', 'Disponibilité immédiate'],
    ARRAY['Prime urgence', 'Transport VIP', 'Hébergement haut de gamme', 'Repas inclus'],
    NOW() + INTERVAL '2 days',
    2,
    0
  ),
  (
    '750e8400-e29b-41d4-a716-446655440001',
    'Remplacement Neurologie - 1 semaine',
    'Remplacement d\'un neurologue pour une semaine en clinique privée haut de gamme.',
    'Neuilly-sur-Seine',
    1500,
    2000,
    '7 jours',
    'high',
    NOW() + INTERVAL '14 days',
    ARRAY['Logement de fonction', 'Voiture de service', 'Déjeuners offerts', 'Accès spa'],
    '550e8400-e29b-41d4-a716-446655440001',
    'Hôpital Européen',
    4.5,
    ARRAY['Neurologue certifié', 'Expérience clinique privée', 'Références excellentes'],
    ARRAY['Logement fourni', 'Véhicule de service', 'Restauration', 'Services wellness'],
    NOW() + INTERVAL '5 days',
    1,
    0
  ),
  (
    '750e8400-e29b-41d4-a716-446655440002',
    'Consultant Dermatologie Esthétique',
    'Consultations dermatologie esthétique dans centre médical premium. Clientèle haut de gamme.',
    'Cannes',
    2000,
    2500,
    '3 jours',
    'high',
    NOW() + INTERVAL '10 days',
    ARRAY['Hébergement bord de mer', 'Yacht club accès', 'Cuisine étoilée', 'Spa thermal'],
    '550e8400-e29b-41d4-a716-446655440002',
    'Centre Médical Premium',
    4.7,
    ARRAY['Dermatologue esthétique', 'Expérience clientèle VIP', 'Techniques innovantes'],
    ARRAY['Suite vue mer', 'Accès yacht club', 'Restaurants étoilés', 'Soins spa'],
    NOW() + INTERVAL '7 days',
    1,
    0
  ),
  (
    '750e8400-e29b-41d4-a716-446655440003',
    'Garde Chirurgie Plastique - Nuit Premium',
    'Garde de nuit en chirurgie plastique. Établissement réputé, clientèle internationale.',
    'Monaco',
    1200,
    1800,
    '12h',
    'critical',
    NOW() + INTERVAL '3 days',
    ARRAY['Limousine A/R', 'Hôtel palace', 'Room service 24h', 'Bonus nuit +50%'],
    '550e8400-e29b-41d4-a716-446655440000',
    'Clinique Saint-Louis',
    4.8,
    ARRAY['Chirurgien plasticien', 'Garde de nuit', 'Clientèle internationale'],
    ARRAY['Transport de luxe', 'Hôtel 5 étoiles', 'Service premium', 'Prime exceptionnelle'],
    NOW() + INTERVAL '1 day',
    1,
    0
  ),
  (
    '750e8400-e29b-41d4-a716-446655440004',
    'Médecine Générale - Yacht Privé',
    'Accompagnement médical sur yacht privé en Méditerranée. Mission exceptionnelle.',
    'Nice - Méditerranée',
    3000,
    4000,
    '5 jours',
    'high',
    NOW() + INTERVAL '21 days',
    ARRAY['Croisière privée', 'Suite de luxe', 'Chef personnel', 'Excursions VIP'],
    '550e8400-e29b-41d4-a716-446655440002',
    'Centre Médical Premium',
    4.7,
    ARRAY['Médecin généraliste', 'Expérience maritime', 'Adaptabilité environnements luxe'],
    ARRAY['Croisière privée', 'Hébergement yacht', 'Restauration haut de gamme', 'Activités VIP'],
    NOW() + INTERVAL '14 days',
    1,
    0
  );

-- Optionnel: Créer quelques candidatures de test (remplacer les UUIDs par de vrais doctor_ids)
-- INSERT INTO premium_mission_applications (mission_id, user_id, status, application_date, priority_score)
-- VALUES 
--   ('750e8400-e29b-41d4-a716-446655440001', 'your-doctor-uuid-here', 'pending', NOW(), 100);
