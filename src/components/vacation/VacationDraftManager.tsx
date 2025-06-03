import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { VacationPost } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Save, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface VacationDraftManagerProps {
  onDraftSelect: (draft: VacationPost) => void;
}

const VacationDraftManager = ({ onDraftSelect }: VacationDraftManagerProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [drafts, setDrafts] = useState<VacationPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDrafts();
    }
  }, [user]);

  const fetchDrafts = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('vacation_posts')
        .select('*')
        .eq('doctor_id', user.id)
        .eq('status', 'draft')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setDrafts(data || []);
    } catch (error: any) {
      console.error('Error fetching drafts:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les brouillons",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDraft = async (draftId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce brouillon ?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('vacation_posts')
        .delete()
        .eq('id', draftId)
        .eq('doctor_id', user?.id);

      if (error) throw error;

      toast({
        title: "Brouillon supprimé",
        description: "Le brouillon a été supprimé avec succès",
      });

      await fetchDrafts();
    } catch (error: any) {
      console.error('Error deleting draft:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le brouillon",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return <div>Chargement des brouillons...</div>;
  }

  if (drafts.length === 0) {
    return null;
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Brouillons enregistrés</CardTitle>
        <CardDescription>
          Continuez l'édition d'une vacation enregistrée
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {drafts.map((draft) => (
            <div
              key={draft.id}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div className="space-y-1">
                <div className="font-medium">{draft.title}</div>
                <div className="text-sm text-gray-500">
                  Dernière modification : {format(new Date(draft.updated_at), 'PPp', { locale: fr })}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onDraftSelect(draft)}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Continuer
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDeleteDraft(draft.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default VacationDraftManager; 