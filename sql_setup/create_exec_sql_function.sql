-- Cette fonction permet d'exécuter du SQL directement via RPC
CREATE OR REPLACE FUNCTION exec_sql(sql text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql;
  RETURN 'SUCCESS';
EXCEPTION
  WHEN OTHERS THEN
    RETURN 'ERROR: ' || SQLERRM;
END;
$$;
