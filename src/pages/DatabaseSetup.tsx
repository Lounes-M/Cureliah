import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createUrgentRequestsTables, checkTablesExist, createTablesDirectly } from '@/utils/initUrgentTables';
import { useToast } from '@/hooks/use-toast';
import { Copy, ExternalLink, Database } from 'lucide-react';

export const DatabaseSetup: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>('');
  const [showManualInstructions, setShowManualInstructions] = useState(false);
  const { toast } = useToast();

  const sqlScript = `-- Script SQL Cureliah - Demandes Urgentes
CREATE TABLE IF NOT EXISTS urgent_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    establishment_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    specialty_required TEXT NOT NULL,
    urgency_level TEXT NOT NULL CHECK (urgency_level IN ('medium', 'high', 'critical', 'emergency')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    location TEXT NOT NULL,
    latitude DECIMAL,
    longitude DECIMAL,
    hourly_rate DECIMAL NOT NULL,
    total_budget DECIMAL,
    min_experience_years INTEGER DEFAULT 0,
    required_certifications TEXT[] DEFAULT '{}',
    equipment_provided BOOLEAN DEFAULT false,
    transport_provided BOOLEAN DEFAULT false,
    accommodation_provided BOOLEAN DEFAULT false,
    priority_boost BOOLEAN DEFAULT false,
    featured BOOLEAN DEFAULT false,
    auto_accept_qualified BOOLEAN DEFAULT false,
    max_responses INTEGER DEFAULT 10,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'filled', 'cancelled', 'expired')),
    expires_at TIMESTAMP WITH TIME ZONE,
    response_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS urgent_request_responses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    request_id UUID REFERENCES urgent_requests(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    response_type TEXT NOT NULL CHECK (response_type IN ('interested', 'available', 'maybe')),
    availability_start TIMESTAMP WITH TIME ZONE,
    availability_end TIMESTAMP WITH TIME ZONE,
    message TEXT,
    requested_rate DECIMAL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn')),
    response_time INTEGER,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(request_id, doctor_id)
);

CREATE TABLE IF NOT EXISTS urgent_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    request_id UUID REFERENCES urgent_requests(id) ON DELETE CASCADE,
    recipient_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    recipient_type TEXT NOT NULL CHECK (recipient_type IN ('doctor', 'establishment')),
    type TEXT NOT NULL CHECK (type IN ('new_request', 'new_response', 'request_accepted', 'request_cancelled', 'reminder')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT false,
    action_url TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_urgent_requests_establishment_id ON urgent_requests(establishment_id);
CREATE INDEX IF NOT EXISTS idx_urgent_requests_status ON urgent_requests(status);
CREATE INDEX IF NOT EXISTS idx_urgent_request_responses_request_id ON urgent_request_responses(request_id);

-- RLS
ALTER TABLE urgent_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE urgent_request_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE urgent_notifications ENABLE ROW LEVEL SECURITY;

-- Politiques RLS essentielles
DROP POLICY IF EXISTS "Establishments can create their own urgent requests" ON urgent_requests;
CREATE POLICY "Establishments can create their own urgent requests" ON urgent_requests
    FOR INSERT WITH CHECK (auth.uid() = establishment_id);

DROP POLICY IF EXISTS "Establishments can view their own urgent requests" ON urgent_requests;
CREATE POLICY "Establishments can view their own urgent requests" ON urgent_requests
    FOR SELECT USING (auth.uid() = establishment_id);

DROP POLICY IF EXISTS "Doctors can view open urgent requests" ON urgent_requests;
CREATE POLICY "Doctors can view open urgent requests" ON urgent_requests
    FOR SELECT USING (status = 'open');`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(sqlScript);
      toast({
        title: "Copié !",
        description: "Le script SQL a été copié dans le presse-papiers",
        variant: "default",
      });
    } catch (err) {
      toast({
        title: "Erreur",
        description: "Impossible de copier le texte",
        variant: "destructive",
      });
    }
  };

  const handleCreateTables = async () => {
    setLoading(true);
    setStatus('Vérification des tables...');
    
    try {
      const tablesExist = await checkTablesExist();
      
      if (tablesExist) {
        setStatus('✅ Les tables existent déjà !');
        toast({
          title: "Tables existantes",
          description: "Le système de demandes urgentes est déjà configuré",
          variant: "default",
        });
      } else {
        setStatus('❌ Tables manquantes, tentative de création automatique...');
        const success = await createTablesDirectly();
        
        if (success) {
          setStatus('🎉 Tables créées avec succès !');
          toast({
            title: "Succès",
            description: "Système de demandes urgentes créé avec succès",
            variant: "default",
          });
        } else {
          setStatus('⚠️ Création automatique impossible, utilisation manuelle requise');
          setShowManualInstructions(true);
          toast({
            title: "Configuration manuelle requise",
            description: "Veuillez utiliser le script SQL fourni ci-dessous",
            variant: "default",
          });
        }
      }
    } catch (error) {
      setStatus('💥 Erreur: ' + (error as Error).message);
      setShowManualInstructions(true);
      toast({
        title: "Erreur",
        description: "Configuration manuelle requise",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-6 w-6" />
              🛠️ Configuration Base de Données
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Configuration du système de demandes urgentes Premium pour Cureliah.
              Cette étape est nécessaire pour activer les fonctionnalités complètes.
            </p>
            
            <Button 
              onClick={handleCreateTables} 
              disabled={loading}
              className="w-full"
              size="lg"
            >
              {loading ? "Vérification..." : "Vérifier / Créer les Tables"}
            </Button>
            
            {status && (
              <div className="bg-gray-100 p-3 rounded-md">
                <p className="text-sm font-mono">{status}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {showManualInstructions && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                📋 Configuration Manuelle
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
                <h4 className="font-semibold text-amber-800 mb-2">Instructions :</h4>
                <ol className="list-decimal list-inside text-sm text-amber-700 space-y-1">
                  <li>Cliquez sur "Ouvrir Supabase SQL Editor" ci-dessous</li>
                  <li>Copiez le script SQL avec le bouton "Copier le script"</li>
                  <li>Collez le script dans l'éditeur Supabase</li>
                  <li>Cliquez sur "Run" pour exécuter</li>
                  <li>Rafraîchissez cette page pour tester</li>
                </ol>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={copyToClipboard}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Copy className="h-4 w-4" />
                  Copier le script SQL
                </Button>
                
                <Button
                  onClick={() => window.open('https://supabase.com/dashboard/project/rlfghipdzxfnwijsylac/sql/new', '_blank')}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  Ouvrir Supabase SQL Editor
                </Button>
              </div>

              <div className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto">
                <pre className="text-xs whitespace-pre-wrap font-mono">
                  {sqlScript}
                </pre>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default DatabaseSetup;
