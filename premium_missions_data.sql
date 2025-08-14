-- Données supplémentaires pour tester le système Premium Missions

INSERT INTO premium_missions (
    establishment_id, establishment_name, establishment_type, establishment_rating,
    title, description, specialization, mission_type,
    start_date, end_date, start_time, end_time,
    salary_min, salary_max,
    premium_perks, premium_bonus, priority_level,
    spots_total, spots_available,
    location, is_vip, is_exclusive, exclusivity_hours,
    status
) VALUES 
(
    '123e4567-e89b-12d3-a456-426614174003',
    'Centre Médical Excellence',
    'Centre Médical',
    4.6,
    'Télémédecine Premium - Consultation VIP',
    'Consultations de télémédecine pour clientèle VIP internationale.',
    'Médecine Générale',
    'consultation',
    CURRENT_DATE + INTERVAL '5 days',
    CURRENT_DATE + INTERVAL '12 days',
    '09:00', '17:00',
    1200, 1800,
    ARRAY['Équipement fourni', 'Formation incluse', 'Support technique 24/7'],
    150,
    2,
    3, 3,
    'Remote - France',
    false, true, 48,
    'active'
),
(
    '123e4567-e89b-12d3-a456-426614174004',
    'Clinique des Alpes',
    'Clinique Spécialisée',
    4.7,
    'Garde de Nuit - Urgentiste',
    'Garde de nuit en service d\'urgences avec prime montagne.',
    'Médecine d\'Urgence',
    'night_shift',
    CURRENT_DATE + INTERVAL '3 days',
    CURRENT_DATE + INTERVAL '10 days',
    '20:00', '08:00',
    2000, 2800,
    ARRAY['Prime montagne', 'Hébergement ski', 'Forfait remontées'],
    300,
    4,
    1, 1,
    'Chamonix',
    true, false, 24,
    'active'
),
(
    '123e4567-e89b-12d3-a456-426614174005',
    'Hôpital International Dubai',
    'Hôpital International',
    4.9,
    'Mission Internationale - Chirurgie Cardiaque',
    'Mission de 2 semaines en chirurgie cardiaque à Dubai avec équipe internationale.',
    'Chirurgie Cardiaque',
    'vacation',
    CURRENT_DATE + INTERVAL '15 days',
    CURRENT_DATE + INTERVAL '29 days',
    '07:00', '19:00',
    8000, 12000,
    ARRAY['Vol business', 'Hôtel 5*', 'Per diem', 'Visa inclus', 'Assurance internationale'],
    2000,
    5,
    1, 1,
    'Dubai, UAE',
    true, true, 72,
    'active'
);

-- Quelques candidatures d'exemple (remplace les user_id par de vrais UUID si nécessaire)
INSERT INTO premium_mission_applications (
    mission_id, user_id, doctor_name, doctor_specialization, doctor_rating,
    status, cover_letter, availability_confirmed, expected_salary,
    priority_application, fast_track_review
) VALUES 
(
    (SELECT id FROM premium_missions WHERE title LIKE '%Cardiologue Urgence%' LIMIT 1),
    '550e8400-e29b-41d4-a716-446655440001',
    'Dr. Marie Dubois',
    'Cardiologie',
    4.8,
    'pending',
    'Cardiologue expérimentée avec 10 ans d\'expérience en cardiologie interventionnelle.',
    true,
    3000,
    true,
    true
),
(
    (SELECT id FROM premium_missions WHERE title LIKE '%Chirurgien ORL%' LIMIT 1),
    '550e8400-e29b-41d4-a716-446655440002',
    'Dr. Pierre Martin',
    'ORL',
    4.6,
    'pending',
    'Chirurgien ORL spécialisé dans les interventions weekend.',
    true,
    2000,
    false,
    true
);

SELECT 'Données supplémentaires ajoutées avec succès!' as message;
