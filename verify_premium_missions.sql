-- Script de vérification pour les missions premium
-- Ce script permet de vérifier que les tables et données premium sont correctement configurées

-- 1. Vérifier les établissements avec abonnement premium
SELECT 
    e.name as establishment_name,
    es.plan_type,
    es.status,
    COUNT(pm.id) as total_missions
FROM establishments e
LEFT JOIN establishment_subscriptions es ON e.id = es.establishment_id
LEFT JOIN premium_missions pm ON e.id = pm.establishment_id
WHERE es.plan_type IN ('pro', 'premium') AND es.status = 'active'
GROUP BY e.id, e.name, es.plan_type, es.status
ORDER BY total_missions DESC;

-- 2. Vérifier les missions premium disponibles
SELECT 
    pm.title,
    pm.location,
    pm.salary_min,
    pm.salary_max,
    pm.urgency,
    pm.spots_available,
    pm.spots_filled,
    pm.establishment_name,
    pm.application_deadline,
    pm.exclusive_until,
    CASE 
        WHEN pm.application_deadline > NOW() AND pm.exclusive_until > NOW() 
        THEN 'Disponible' 
        ELSE 'Expiré' 
    END as status
FROM premium_missions pm
ORDER BY pm.created_at DESC;

-- 3. Vérifier les candidatures (si il y en a)
SELECT 
    pm.title as mission_title,
    pma.status as application_status,
    pma.priority_score,
    pma.application_date
FROM premium_mission_applications pma
JOIN premium_missions pm ON pma.mission_id = pm.id
ORDER BY pma.application_date DESC
LIMIT 10;

-- 4. Statistiques globales
SELECT 
    COUNT(*) as total_premium_missions,
    COUNT(*) FILTER (WHERE application_deadline > NOW()) as missions_ouvertes,
    COUNT(*) FILTER (WHERE urgency = 'critical') as missions_critiques,
    ROUND(AVG(salary_min + salary_max) / 2, 2) as salaire_moyen
FROM premium_missions;
