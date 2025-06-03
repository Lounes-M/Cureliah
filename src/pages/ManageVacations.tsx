import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import { PlanningMedecin } from '@/components/vacation/PlanningMedecin';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const ManageVacations = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

    if (!user || profile?.user_type !== 'doctor') {
      navigate('/auth');
    return null;
  }

  const handleSlotCreated = () => {
      toast({
      title: "Succès",
      description: "Le créneau a été créé avec succès",
    });
  };

  const handleSlotUpdated = () => {
      toast({
      title: "Succès",
      description: "Le créneau a été mis à jour avec succès",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/doctor/dashboard')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour au dashboard
          </Button>

          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Gérer mes disponibilités
              </h1>
              <p className="text-gray-600">
                Planifiez vos vacations et gérez vos créneaux de disponibilité
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <PlanningMedecin
            doctorId={user.id}
            onSlotCreated={handleSlotCreated}
            onSlotUpdated={handleSlotUpdated}
          />
        </div>
      </div>
    </div>
  );
};

export default ManageVacations;
