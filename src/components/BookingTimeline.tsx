
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Clock, XCircle, Star, Send, Calendar } from 'lucide-react';
import { VacationStatus } from '@/types/database';

interface BookingTimelineProps {
  currentStatus: VacationStatus;
  createdAt: string;
  updatedAt: string;
  userType: 'doctor' | 'establishment';
}

const BookingTimeline = ({ currentStatus, createdAt, updatedAt, userType }: BookingTimelineProps) => {
  const timelineSteps = [
    {
      id: 'pending',
      label: 'Demande envoyée',
      description: userType === 'establishment' 
        ? 'Votre demande a été envoyée au médecin' 
        : 'Demande reçue de l\'établissement',
      icon: <Send className="w-4 h-4" />,
      status: 'completed' as const
    },
    {
      id: 'booked',
      label: 'Réservation confirmée',
      description: userType === 'doctor' 
        ? 'Vous avez accepté la réservation' 
        : 'Le médecin a accepté votre demande',
      icon: <CheckCircle className="w-4 h-4" />,
      status: getCurrentStepStatus('booked', currentStatus)
    },
    {
      id: 'completed',
      label: 'Vacation terminée',
      description: 'La vacation a été menée à bien',
      icon: <Star className="w-4 h-4" />,
      status: getCurrentStepStatus('completed', currentStatus)
    }
  ];

  function getCurrentStepStatus(stepId: string, currentStatus: VacationStatus): 'completed' | 'current' | 'pending' | 'cancelled' {
    if (currentStatus === 'cancelled') {
      if (stepId === 'pending') return 'completed';
      return 'cancelled';
    }

    const statusOrder = ['pending', 'booked', 'completed'];
    const currentIndex = statusOrder.indexOf(currentStatus);
    const stepIndex = statusOrder.indexOf(stepId);

    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return 'pending';
  }

  const getStepColor = (status: 'completed' | 'current' | 'pending' | 'cancelled') => {
    switch (status) {
      case 'completed': return 'bg-medical-green-light';
      case 'current': return 'bg-medical-blue-light';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-300';
    }
  };

  const getStepTextColor = (status: 'completed' | 'current' | 'pending' | 'cancelled') => {
    switch (status) {
      case 'completed': return 'text-green-700';
      case 'current': return 'text-blue-700';
      case 'cancelled': return 'text-red-700';
      default: return 'text-gray-500';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Calendar className="w-5 h-5" />
          <span>Progression de la réservation</span>
        </CardTitle>
        <CardDescription>
          Suivez l'évolution de votre réservation
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {timelineSteps.map((step, index) => (
            <div key={step.id} className="flex items-start space-x-4">
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${getStepColor(step.status)}`}>
                  {step.status === 'cancelled' ? (
                    <XCircle className="w-4 h-4" />
                  ) : (
                    step.icon
                  )}
                </div>
                {index < timelineSteps.length - 1 && (
                  <div className={`w-0.5 h-8 mt-2 ${
                    step.status === 'completed' || (step.status === 'current' && currentStatus !== 'cancelled')
                      ? 'bg-green-300' 
                      : 'bg-gray-200'
                  }`} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <p className={`text-sm font-medium ${getStepTextColor(step.status)}`}>
                    {step.label}
                  </p>
                  {step.status === 'current' && (
                    <Badge variant="outline" className="text-xs">
                      En cours
                    </Badge>
                  )}
                  {step.status === 'completed' && (
                    <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                      Terminé
                    </Badge>
                  )}
                  {step.status === 'cancelled' && (
                    <Badge variant="outline" className="text-xs bg-red-50 text-red-700">
                      Annulé
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-600">{step.description}</p>
              </div>
            </div>
          ))}
        </div>

        {currentStatus === 'cancelled' && (
          <div className="mt-6 p-4 bg-red-50 rounded-lg border border-red-200">
            <p className="text-sm text-red-800">
              <XCircle className="w-4 h-4 inline mr-1" />
              Cette réservation a été annulée. Vous pouvez toujours consulter les détails et l'historique des messages.
            </p>
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="text-xs text-gray-500 space-y-1">
            <p>Créée le: {new Date(createdAt).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</p>
            <p>Dernière mise à jour: {new Date(updatedAt).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BookingTimeline;
