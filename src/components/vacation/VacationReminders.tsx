import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { VacationPost } from '@/types/database';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, Calendar, MapPin } from 'lucide-react';
import { format, isAfter, isBefore, addDays } from 'date-fns';
import { fr } from 'date-fns/locale';

const VacationReminders = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [upcomingVacations, setUpcomingVacations] = useState<VacationPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUpcomingVacations();
    }
  }, [user]);

  const fetchUpcomingVacations = async () => {
    if (!user) return;

    try {
      const today = new Date();
      const thirtyDaysFromNow = addDays(today, 30);

      const { data, error } = await supabase
        .from('vacation_posts')
        .select('*')
        .eq('doctor_id', user.id)
        .eq('status', 'booked')
        .gte('start_date', today.toISOString())
        .lte('start_date', thirtyDaysFromNow.toISOString())
        .order('start_date', { ascending: true });

      if (error) throw error;
      setUpcomingVacations(data || []);
    } catch (error: any) {
      console.error('Error fetching upcoming vacations:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les vacations à venir",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getReminderType = (startDate: string) => {
    const daysUntilStart = Math.ceil(
      (new Date(startDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysUntilStart <= 3) {
      return { type: 'urgent', label: 'Urgent' };
    } else if (daysUntilStart <= 7) {
      return { type: 'warning', label: 'Proche' };
    } else {
      return { type: 'info', label: 'À venir' };
    }
  };

  if (loading) {
    return <div>Chargement des rappels...</div>;
  }

  if (upcomingVacations.length === 0) {
    return null;
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Bell className="w-5 h-5 mr-2" />
          Rappels des vacations à venir
        </CardTitle>
        <CardDescription>
          Vos prochaines vacations programmées
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {upcomingVacations.map((vacation) => {
            const reminderType = getReminderType(vacation.start_date);
            return (
              <div
                key={vacation.id}
                className="flex items-start space-x-4 p-4 border rounded-lg"
              >
                <div className="flex-shrink-0">
                  <Calendar className="w-6 h-6 text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-gray-900">
                      {vacation.title}
                    </h4>
                    <Badge
                      variant={
                        reminderType.type === 'urgent'
                          ? 'destructive'
                          : reminderType.type === 'warning'
                          ? 'secondary'
                          : 'default'
                      }
                    >
                      {reminderType.label}
                    </Badge>
                  </div>
                  <div className="mt-1 text-sm text-gray-500">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      Du {format(new Date(vacation.start_date), 'PP', { locale: fr })}
                      {' au '}
                      {format(new Date(vacation.end_date), 'PP', { locale: fr })}
                    </div>
                    {vacation.location && (
                      <div className="flex items-center mt-1">
                        <MapPin className="w-4 h-4 mr-1" />
                        {vacation.location}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default VacationReminders; 