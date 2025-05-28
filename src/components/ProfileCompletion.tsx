
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertCircle, User, FileText, Shield } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const ProfileCompletion = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [completionData, setCompletionData] = useState({
    percentage: 0,
    completedSteps: [] as string[],
    pendingSteps: [] as string[]
  });

  useEffect(() => {
    calculateCompletion();
  }, [profile]);

  const calculateCompletion = () => {
    const steps = [
      { id: 'basic_info', label: 'Informations de base', completed: !!(profile?.first_name && profile?.last_name && profile?.phone) },
      { id: 'profile_type', label: 'Profil spécialisé', completed: profile?.user_type === 'doctor' ? false : false }, // Will check doctor/establishment profile
      { id: 'verification', label: 'Vérification', completed: false }, // Will check verification status
      { id: 'avatar', label: 'Photo de profil', completed: false }, // Will check if avatar is uploaded
    ];

    const completed = steps.filter(step => step.completed);
    const pending = steps.filter(step => !step.completed);
    
    setCompletionData({
      percentage: (completed.length / steps.length) * 100,
      completedSteps: completed.map(s => s.label),
      pendingSteps: pending.map(s => s.label)
    });
  };

  const getCompletionStatus = () => {
    if (completionData.percentage === 100) return { color: 'green', icon: CheckCircle, text: 'Profil complet' };
    if (completionData.percentage >= 75) return { color: 'blue', icon: AlertCircle, text: 'Presque terminé' };
    if (completionData.percentage >= 50) return { color: 'yellow', icon: AlertCircle, text: 'En cours' };
    return { color: 'red', icon: AlertCircle, text: 'À compléter' };
  };

  const status = getCompletionStatus();
  const StatusIcon = status.icon;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <StatusIcon className={`w-5 h-5 mr-2 text-${status.color}-600`} />
              Complétude du Profil
            </CardTitle>
            <CardDescription>
              {status.text} ({Math.round(completionData.percentage)}%)
            </CardDescription>
          </div>
          <Badge variant={status.color === 'green' ? 'default' : 'secondary'}>
            {Math.round(completionData.percentage)}%
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Progress value={completionData.percentage} className="w-full" />
        
        {completionData.completedSteps.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-green-800 mb-2">✓ Étapes complétées</h4>
            <div className="flex flex-wrap gap-1">
              {completionData.completedSteps.map((step, index) => (
                <Badge key={index} className="bg-green-100 text-green-800">
                  {step}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {completionData.pendingSteps.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-orange-800 mb-2">⏳ À compléter</h4>
            <div className="flex flex-wrap gap-1">
              {completionData.pendingSteps.map((step, index) => (
                <Badge key={index} variant="outline" className="border-orange-300 text-orange-700">
                  {step}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="flex space-x-2 mt-4">
          <Button 
            onClick={() => navigate('/profile/complete')}
            className="flex items-center"
            variant={completionData.percentage === 100 ? "outline" : "default"}
          >
            <User className="w-4 h-4 mr-2" />
            {completionData.percentage === 100 ? 'Modifier le profil' : 'Compléter le profil'}
          </Button>
          
          {profile?.user_type === 'doctor' && (
            <Button variant="outline" className="flex items-center">
              <Shield className="w-4 h-4 mr-2" />
              Vérification
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfileCompletion;
