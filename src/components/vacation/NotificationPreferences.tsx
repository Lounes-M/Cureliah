import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EmailFrequency } from '@/types/database';
import { Bell } from 'lucide-react';

const NotificationPreferences = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [preferences, setPreferences] = useState({
    email_on_message: true,
    email_on_booking_update: true,
    email_on_review: true,
    email_frequency: 'immediate' as EmailFrequency
  });

  useEffect(() => {
    if (user) {
      fetchPreferences();
    }
  }, [user]);

  const fetchPreferences = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      // Si des préférences existent, les utiliser, sinon garder les valeurs par défaut
      if (data) {
        setPreferences(data);
      } else {
        // Créer les préférences par défaut
        const { error: insertError } = await supabase
          .from('notification_preferences')
          .insert({
            user_id: user.id,
            email_on_message: true,
            email_on_booking_update: true,
            email_on_review: true,
            email_frequency: 'immediate'
          });

        if (insertError) throw insertError;
      }
    } catch (error: any) {
      console.error('Error fetching notification preferences:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les préférences de notification",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updatePreference = async (key: string, value: any) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('notification_preferences')
        .upsert({
          user_id: user.id,
          [key]: value,
          ...preferences
        });

      if (error) throw error;

      setPreferences(prev => ({ ...prev, [key]: value }));
      toast({
        title: "Préférences mises à jour",
        description: "Vos préférences de notification ont été enregistrées",
      });
    } catch (error: any) {
      console.error('Error updating notification preferences:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour les préférences",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return <div>Chargement des préférences...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Bell className="w-5 h-5 mr-2" />
          Préférences de notification
        </CardTitle>
        <CardDescription>
          Configurez vos préférences de notification par email
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Messages</Label>
            <p className="text-sm text-gray-500">
              Recevoir des notifications pour les nouveaux messages
            </p>
          </div>
          <Switch
            checked={preferences.email_on_message}
            onCheckedChange={(checked) => updatePreference('email_on_message', checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Mises à jour des réservations</Label>
            <p className="text-sm text-gray-500">
              Recevoir des notifications pour les changements de statut des réservations
            </p>
          </div>
          <Switch
            checked={preferences.email_on_booking_update}
            onCheckedChange={(checked) => updatePreference('email_on_booking_update', checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Avis</Label>
            <p className="text-sm text-gray-500">
              Recevoir des notifications pour les nouveaux avis
            </p>
          </div>
          <Switch
            checked={preferences.email_on_review}
            onCheckedChange={(checked) => updatePreference('email_on_review', checked)}
          />
        </div>

        <div className="space-y-2">
          <Label>Fréquence des emails</Label>
          <Select
            value={preferences.email_frequency}
            onValueChange={(value) => updatePreference('email_frequency', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionnez une fréquence" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="immediate">Immédiat</SelectItem>
              <SelectItem value="daily">Quotidien</SelectItem>
              <SelectItem value="weekly">Hebdomadaire</SelectItem>
              <SelectItem value="never">Jamais</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
};

export default NotificationPreferences; 