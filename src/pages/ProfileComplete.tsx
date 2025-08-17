import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Upload, X, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client.browser';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import { SPECIALITIES, ESTABLISHMENT_TYPES } from '@/utils/specialities';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import DoctorProfileForm from '@/components/profile/DoctorProfileForm';
import EstablishmentProfileForm from '@/components/profile/EstablishmentProfileForm';

const ProfileComplete = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [existingProfile, setExistingProfile] = useState<any>(null);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    const fetchProfile = async () => {
      try {
        let result;
        if (user.user_type === 'doctor') {
          result = await supabase
            .from('doctor_profiles')
            .select('*')
            .eq('id', user.id)
            .single();
        } else {
          result = await supabase
            .from('establishment_profiles')
            .select('*')
            .eq('id', user.id)
            .single();
        }

        if (result.error && result.error.code !== 'PGRST116') {
          throw result.error;
        }
        
        setExistingProfile(result.data);
      } catch (error: any) {
        logger.error('Error fetching profile:', error, {}, 'Auto', 'todo_replaced');
        toast({
          title: "Erreur",
          description: "Impossible de charger le profil",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user, navigate, toast]);

  const handleSuccess = () => {
    if (user?.user_type === 'doctor') {
      navigate('/doctor/dashboard');
    } else {
      navigate('/establishment/dashboard');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate(user?.user_type === 'doctor' ? '/doctor/dashboard' : '/establishment/dashboard')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour au tableau de bord
          </Button>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {existingProfile ? 'Modifier le profil' : 'Compléter le profil'}
          </h1>
          <p className="text-gray-600">
            {existingProfile 
              ? 'Mettez à jour les informations de votre profil'
              : 'Complétez les informations de votre profil pour commencer à utiliser la plateforme'}
          </p>
        </div>

        {user?.user_type === 'doctor' ? (
          <DoctorProfileForm
            userId={user.id}
            existingProfile={existingProfile}
            onSuccess={handleSuccess}
          />
        ) : (
          <EstablishmentProfileForm
            userId={user.id}
            existingProfile={existingProfile}
            onSuccess={handleSuccess}
          />
        )}
      </div>
    </div>
  );
};

export default ProfileComplete;
