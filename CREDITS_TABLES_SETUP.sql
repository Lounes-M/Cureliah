-- Tables pour le système de crédits
CREATE TABLE IF NOT EXISTS user_credits (
    user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    balance INTEGER NOT NULL DEFAULT 0 CHECK (balance >= 0),
    total_purchased INTEGER NOT NULL DEFAULT 0,
    total_spent INTEGER NOT NULL DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS credit_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('purchase', 'usage', 'refund', 'bonus')),
    description TEXT NOT NULL,
    stripe_payment_intent_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON credit_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_type ON credit_transactions(type);

-- RLS
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour user_credits
DROP POLICY IF EXISTS "Users can view their own credits" ON user_credits;
CREATE POLICY "Users can view their own credits" ON user_credits
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own credits" ON user_credits;
CREATE POLICY "Users can update their own credits" ON user_credits
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own credits" ON user_credits;
CREATE POLICY "Users can insert their own credits" ON user_credits
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can insert user credits" ON user_credits;
CREATE POLICY "System can insert user credits" ON user_credits
    FOR INSERT WITH CHECK (true);

-- Politiques RLS pour credit_transactions
DROP POLICY IF EXISTS "Users can view their own credit transactions" ON credit_transactions;
CREATE POLICY "Users can view their own credit transactions" ON credit_transactions
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own credit transactions" ON credit_transactions;
CREATE POLICY "Users can insert their own credit transactions" ON credit_transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can insert credit transactions" ON credit_transactions;
CREATE POLICY "System can insert credit transactions" ON credit_transactions
    FOR INSERT WITH CHECK (true);

-- Fonction pour acheter des crédits
CREATE OR REPLACE FUNCTION purchase_credits(
    p_user_id UUID,
    p_amount INTEGER,
    p_payment_intent_id TEXT,
    p_description TEXT DEFAULT 'Achat de crédits'
)
RETURNS user_credits
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    updated_credits user_credits;
BEGIN
    -- Vérifier que l'utilisateur existe
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = p_user_id) THEN
        RAISE EXCEPTION 'Utilisateur introuvable';
    END IF;
    
    -- Vérifier les paramètres
    IF p_amount <= 0 THEN
        RAISE EXCEPTION 'Le montant doit être positif';
    END IF;
    
    -- Créer ou mettre à jour le solde de crédits
    INSERT INTO user_credits (user_id, balance, total_purchased, total_spent)
    VALUES (p_user_id, p_amount, p_amount, 0)
    ON CONFLICT (user_id) DO UPDATE SET
        balance = user_credits.balance + p_amount,
        total_purchased = user_credits.total_purchased + p_amount,
        last_updated = NOW()
    RETURNING * INTO updated_credits;
    
    -- Enregistrer la transaction
    INSERT INTO credit_transactions (user_id, amount, type, description, stripe_payment_intent_id)
    VALUES (p_user_id, p_amount, 'purchase', p_description, p_payment_intent_id);
    
    RETURN updated_credits;
END;
$$;

-- Fonction pour consommer des crédits
CREATE OR REPLACE FUNCTION consume_credits(
    p_user_id UUID,
    p_amount INTEGER,
    p_description TEXT DEFAULT 'Utilisation de crédits'
)
RETURNS user_credits
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_balance INTEGER;
    updated_credits user_credits;
BEGIN
    -- Vérifier que l'utilisateur existe
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = p_user_id) THEN
        RAISE EXCEPTION 'Utilisateur introuvable';
    END IF;
    
    -- Vérifier les paramètres
    IF p_amount <= 0 THEN
        RAISE EXCEPTION 'Le montant doit être positif';
    END IF;
    
    -- Récupérer le solde actuel (créer un enregistrement si nécessaire)
    INSERT INTO user_credits (user_id, balance, total_purchased, total_spent)
    VALUES (p_user_id, 0, 0, 0)
    ON CONFLICT (user_id) DO NOTHING;
    
    SELECT balance INTO current_balance 
    FROM user_credits 
    WHERE user_id = p_user_id;
    
    -- Vérifier que le solde est suffisant
    IF current_balance < p_amount THEN
        RAISE EXCEPTION 'Solde insuffisant. Solde actuel: %, requis: %', current_balance, p_amount;
    END IF;
    
    -- Consommer les crédits
    UPDATE user_credits 
    SET 
        balance = balance - p_amount,
        total_spent = total_spent + p_amount,
        last_updated = NOW()
    WHERE user_id = p_user_id
    RETURNING * INTO updated_credits;
    
    -- Enregistrer la transaction
    INSERT INTO credit_transactions (user_id, amount, type, description)
    VALUES (p_user_id, -p_amount, 'usage', p_description);
    
    RETURN updated_credits;
END;
$$;

-- Fonction pour rembourser des crédits
CREATE OR REPLACE FUNCTION refund_credits(
    p_user_id UUID,
    p_amount INTEGER,
    p_description TEXT DEFAULT 'Remboursement de crédits'
)
RETURNS user_credits
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    updated_credits user_credits;
BEGIN
    -- Vérifier que l'utilisateur existe
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = p_user_id) THEN
        RAISE EXCEPTION 'Utilisateur introuvable';
    END IF;
    
    -- Vérifier les paramètres
    IF p_amount <= 0 THEN
        RAISE EXCEPTION 'Le montant doit être positif';
    END IF;
    
    -- Créer ou mettre à jour le solde de crédits
    INSERT INTO user_credits (user_id, balance, total_purchased, total_spent)
    VALUES (p_user_id, p_amount, 0, 0)
    ON CONFLICT (user_id) DO UPDATE SET
        balance = user_credits.balance + p_amount,
        last_updated = NOW()
    RETURNING * INTO updated_credits;
    
    -- Enregistrer la transaction
    INSERT INTO credit_transactions (user_id, amount, type, description)
    VALUES (p_user_id, p_amount, 'refund', p_description);
    
    RETURN updated_credits;
END;
$$;

-- Trigger pour mettre à jour last_updated
CREATE OR REPLACE FUNCTION update_credits_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.last_updated = NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_user_credits_updated_at ON user_credits;
CREATE TRIGGER update_user_credits_updated_at
    BEFORE UPDATE ON user_credits
    FOR EACH ROW
    EXECUTE FUNCTION update_credits_updated_at();

-- Trigger pour mettre à jour updated_at dans credit_transactions
DROP TRIGGER IF EXISTS update_credit_transactions_updated_at ON credit_transactions;
CREATE TRIGGER update_credit_transactions_updated_at
    BEFORE UPDATE ON credit_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_credits_updated_at();
