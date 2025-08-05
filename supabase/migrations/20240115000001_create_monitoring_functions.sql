-- Fonctions SQL pour les statistiques de monitoring
-- 2024-01-XX: Create monitoring statistics functions

-- Fonction pour obtenir les statistiques d'erreurs par heure
CREATE OR REPLACE FUNCTION get_hourly_error_stats(time_filter timestamptz)
RETURNS TABLE (
    hour timestamptz,
    total_errors bigint,
    critical_errors bigint,
    high_errors bigint,
    resolved_errors bigint
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        date_trunc('hour', er.timestamp) as hour,
        COUNT(*) as total_errors,
        COUNT(CASE WHEN er.severity = 'critical' THEN 1 END) as critical_errors,
        COUNT(CASE WHEN er.severity = 'high' THEN 1 END) as high_errors,
        COUNT(CASE WHEN er.resolved = true THEN 1 END) as resolved_errors
    FROM error_reports er
    WHERE er.timestamp >= time_filter
    GROUP BY date_trunc('hour', er.timestamp)
    ORDER BY hour;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour obtenir les moyennes de performance
CREATE OR REPLACE FUNCTION get_performance_averages(time_filter timestamptz)
RETURNS TABLE (
    metric_name text,
    avg_value numeric,
    min_value numeric,
    max_value numeric,
    count_measurements bigint
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pm.name as metric_name,
        AVG(pm.value) as avg_value,
        MIN(pm.value) as min_value,
        MAX(pm.value) as max_value,
        COUNT(*) as count_measurements
    FROM performance_metrics pm
    WHERE pm.timestamp >= time_filter
    GROUP BY pm.name
    ORDER BY pm.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour obtenir les percentiles de performance
CREATE OR REPLACE FUNCTION get_performance_percentiles(time_filter timestamptz)
RETURNS TABLE (
    metric_name text,
    p50 numeric,
    p75 numeric,
    p90 numeric,
    p95 numeric,
    p99 numeric
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pm.name as metric_name,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY pm.value) as p50,
        PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY pm.value) as p75,
        PERCENTILE_CONT(0.90) WITHIN GROUP (ORDER BY pm.value) as p90,
        PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY pm.value) as p95,
        PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY pm.value) as p99
    FROM performance_metrics pm
    WHERE pm.timestamp >= time_filter
    GROUP BY pm.name
    ORDER BY pm.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour obtenir les statistiques de performance par heure
CREATE OR REPLACE FUNCTION get_hourly_performance_stats(time_filter timestamptz)
RETURNS TABLE (
    hour timestamptz,
    metric_name text,
    avg_value numeric,
    max_value numeric,
    measurement_count bigint
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        date_trunc('hour', pm.timestamp) as hour,
        pm.name as metric_name,
        AVG(pm.value) as avg_value,
        MAX(pm.value) as max_value,
        COUNT(*) as measurement_count
    FROM performance_metrics pm
    WHERE pm.timestamp >= time_filter
    GROUP BY date_trunc('hour', pm.timestamp), pm.name
    ORDER BY hour, pm.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour obtenir les URLs avec le plus d'erreurs
CREATE OR REPLACE FUNCTION get_top_error_urls(time_filter timestamptz, limit_rows int DEFAULT 10)
RETURNS TABLE (
    url text,
    error_count bigint,
    critical_count bigint,
    latest_error timestamptz
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        er.url,
        COUNT(*) as error_count,
        COUNT(CASE WHEN er.severity = 'critical' THEN 1 END) as critical_count,
        MAX(er.timestamp) as latest_error
    FROM error_reports er
    WHERE er.timestamp >= time_filter
    GROUP BY er.url
    ORDER BY error_count DESC
    LIMIT limit_rows;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour obtenir les métriques de performance dégradées
CREATE OR REPLACE FUNCTION get_degraded_performance_metrics(time_filter timestamptz)
RETURNS TABLE (
    metric_name text,
    current_avg numeric,
    threshold_exceeded_count bigint,
    worst_value numeric,
    worst_timestamp timestamptz
) AS $$
DECLARE
    thresholds RECORD;
BEGIN
    -- Définir les seuils de performance
    FOR thresholds IN 
        SELECT 'page-load-time' as name, 3000 as threshold
        UNION ALL SELECT 'first-contentful-paint', 1800
        UNION ALL SELECT 'largest-contentful-paint', 2500
        UNION ALL SELECT 'cumulative-layout-shift', 0.1
        UNION ALL SELECT 'first-input-delay', 100
    LOOP
        RETURN QUERY
        SELECT 
            thresholds.name as metric_name,
            AVG(pm.value) as current_avg,
            COUNT(CASE WHEN pm.value > thresholds.threshold THEN 1 END) as threshold_exceeded_count,
            MAX(pm.value) as worst_value,
            (SELECT pm2.timestamp FROM performance_metrics pm2 
             WHERE pm2.name = thresholds.name 
             AND pm2.timestamp >= time_filter 
             ORDER BY pm2.value DESC LIMIT 1) as worst_timestamp
        FROM performance_metrics pm
        WHERE pm.name = thresholds.name
        AND pm.timestamp >= time_filter
        GROUP BY thresholds.name, thresholds.threshold
        HAVING COUNT(CASE WHEN pm.value > thresholds.threshold THEN 1 END) > 0;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour créer un rapport de santé système
CREATE OR REPLACE FUNCTION get_system_health_report(time_filter timestamptz)
RETURNS TABLE (
    metric_type text,
    status text,
    value numeric,
    message text
) AS $$
DECLARE
    error_count bigint;
    critical_error_count bigint;
    avg_page_load numeric;
    alert_count bigint;
BEGIN
    -- Compter les erreurs
    SELECT COUNT(*), COUNT(CASE WHEN severity = 'critical' THEN 1 END)
    INTO error_count, critical_error_count
    FROM error_reports
    WHERE timestamp >= time_filter;
    
    -- Moyenne du temps de chargement des pages
    SELECT COALESCE(AVG(value), 0)
    INTO avg_page_load
    FROM performance_metrics
    WHERE name = 'page-load-time'
    AND timestamp >= time_filter;
    
    -- Compter les alertes actives
    SELECT COUNT(*)
    INTO alert_count
    FROM performance_alerts
    WHERE timestamp >= time_filter
    AND resolved = false;
    
    -- Retourner le rapport
    RETURN QUERY
    SELECT 
        'errors'::text as metric_type,
        CASE 
            WHEN critical_error_count > 5 THEN 'critical'
            WHEN error_count > 50 THEN 'warning'
            WHEN error_count > 10 THEN 'caution'
            ELSE 'healthy'
        END as status,
        error_count::numeric as value,
        CASE 
            WHEN critical_error_count > 5 THEN 'Trop d''erreurs critiques détectées'
            WHEN error_count > 50 THEN 'Volume d''erreurs élevé'
            WHEN error_count > 10 THEN 'Erreurs détectées, surveillance recommandée'
            ELSE 'Niveau d''erreurs normal'
        END as message
    
    UNION ALL
    
    SELECT 
        'performance'::text as metric_type,
        CASE 
            WHEN avg_page_load > 5000 THEN 'critical'
            WHEN avg_page_load > 3000 THEN 'warning'
            WHEN avg_page_load > 2000 THEN 'caution'
            ELSE 'healthy'
        END as status,
        avg_page_load as value,
        CASE 
            WHEN avg_page_load > 5000 THEN 'Performance très dégradée'
            WHEN avg_page_load > 3000 THEN 'Performance sous le seuil acceptable'
            WHEN avg_page_load > 2000 THEN 'Performance acceptable mais à surveiller'
            ELSE 'Performance normale'
        END as message
    
    UNION ALL
    
    SELECT 
        'alerts'::text as metric_type,
        CASE 
            WHEN alert_count > 10 THEN 'critical'
            WHEN alert_count > 5 THEN 'warning'
            WHEN alert_count > 0 THEN 'caution'
            ELSE 'healthy'
        END as status,
        alert_count::numeric as value,
        CASE 
            WHEN alert_count > 10 THEN 'Trop d''alertes actives'
            WHEN alert_count > 5 THEN 'Plusieurs alertes nécessitent attention'
            WHEN alert_count > 0 THEN 'Quelques alertes à traiter'
            ELSE 'Aucune alerte active'
        END as message;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Accorder les permissions d'exécution
GRANT EXECUTE ON FUNCTION get_hourly_error_stats(timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION get_performance_averages(timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION get_performance_percentiles(timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION get_hourly_performance_stats(timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION get_top_error_urls(timestamptz, int) TO authenticated;
GRANT EXECUTE ON FUNCTION get_degraded_performance_metrics(timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION get_system_health_report(timestamptz) TO authenticated;
