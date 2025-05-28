
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Header from '@/components/Header';
import VacationForm from '@/components/vacation/VacationForm';

const CreateVacation = () => {
  const { vacationId } = useParams<{ vacationId: string }>();
  const isEditing = Boolean(vacationId);
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [initialLoading, setInitialLoading] = useState(isEditing);

  useEffect(() => {
    if (!user || profile?.user_type !== 'doctor') {
      navigate('/auth');
      return;
    }
  }, [user, profile]);

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center h-96">
          <div className="text-lg">Chargement...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate(isEditing ? '/doctor/manage-vacations' : '/doctor/dashboard')}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {isEditing ? 'Retour aux vacations' : 'Retour au dashboard'}
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>{isEditing ? 'Modifier la vacation' : 'Publier une nouvelle vacation'}</CardTitle>
            <CardDescription>
              {isEditing 
                ? 'Modifiez les informations de votre vacation'
                : 'Créez une annonce pour proposer vos services médicaux'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <VacationForm
              vacationId={vacationId}
              isEditing={isEditing}
              onLoadingChange={setInitialLoading}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreateVacation;
