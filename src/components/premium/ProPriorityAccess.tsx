import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Zap, 
  Clock, 
  Users, 
  MessageCircle, 
  PhoneCall,
  Calendar,
  CheckCircle2,
  ArrowRight,
  Crown,
  Star
} from 'lucide-react';

export interface ProAccessBenefit {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  status: 'active' | 'coming_soon' | 'premium_only';
  usage_count?: number;
  usage_limit?: number;
}

const proAccessBenefits: ProAccessBenefit[] = [
  {
    id: 'priority_support',
    title: 'Support prioritaire 24/7',
    description: 'Assistance dédiée avec temps de réponse garanti sous 2h',
    icon: <MessageCircle className="h-5 w-5" />,
    status: 'active',
    usage_count: 3,
    usage_limit: 50
  },
  {
    id: 'priority_booking',
    title: 'Réservation prioritaire',
    description: 'Accès en avant-première aux créneaux les plus demandés',
    icon: <Calendar className="h-5 w-5" />,
    status: 'active',
    usage_count: 12,
    usage_limit: 100
  },
  {
    id: 'direct_contact',
    title: 'Contact direct établissements',
    description: 'Numéro de téléphone et email direct des recruteurs',
    icon: <PhoneCall className="h-5 w-5" />,
    status: 'active',
    usage_count: 8,
    usage_limit: 25
  },
  {
    id: 'fast_track',
    title: 'Processus accéléré',
    description: 'Validation de profil et candidatures traitées en priorité',
    icon: <Zap className="h-5 w-5" />,
    status: 'active'
  },
  {
    id: 'exclusive_offers',
    title: 'Offres exclusives Pro',
    description: 'Accès à des missions réservées aux abonnés Pro',
    icon: <Star className="h-5 w-5" />,
    status: 'active',
    usage_count: 5,
    usage_limit: 20
  },
  {
    id: 'premium_analytics',
    title: 'Analytics avancées',
    description: 'Statistiques détaillées sur vos candidatures et performance',
    icon: <Clock className="h-5 w-5" />,
    status: 'coming_soon'
  }
];

const priorityQueues = [
  {
    service: 'Validation de profil',
    standard_time: '48-72h',
    pro_time: '6-12h',
    savings: '75% plus rapide'
  },
  {
    service: 'Réponse candidatures',
    standard_time: '5-7 jours',
    pro_time: '24-48h',
    savings: '80% plus rapide'
  },
  {
    service: 'Support client',
    standard_time: '24-48h',
    pro_time: '< 2h',
    savings: 'Priorité absolue'
  },
  {
    service: 'Accès nouvelles missions',
    standard_time: 'Public',
    pro_time: '24h avant',
    savings: 'Accès anticipé'
  }
];

const ProPriorityAccess: React.FC = () => {
  const getStatusColor = (status: ProAccessBenefit['status']) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'coming_soon': return 'bg-yellow-100 text-yellow-800';
      case 'premium_only': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: ProAccessBenefit['status']) => {
    switch (status) {
      case 'active': return 'Actif';
      case 'coming_soon': return 'Bientôt';
      case 'premium_only': return 'Premium uniquement';
      default: return 'Inconnu';
    }
  };

  const getUsagePercentage = (used: number = 0, limit: number = 100) => {
    return Math.min((used / limit) * 100, 100);
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold flex items-center justify-center gap-2 mb-2">
          <Zap className="h-8 w-8 text-medical-blue-light" />
          Accès Prioritaire Pro
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Profitez d'un service premium avec des temps de réponse accélérés 
          et un accès privilégié à toutes nos fonctionnalités.
        </p>
      </div>

      {/* Comparaison des temps */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Comparaison des temps de traitement
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3">Service</th>
                  <th className="text-center py-3">Standard</th>
                  <th className="text-center py-3">Pro</th>
                  <th className="text-center py-3">Avantage</th>
                </tr>
              </thead>
              <tbody>
                {priorityQueues.map((queue, index) => (
                  <tr key={index} className="border-b">
                    <td className="py-4 font-medium">{queue.service}</td>
                    <td className="text-center py-4 text-gray-600">{queue.standard_time}</td>
                    <td className="text-center py-4">
                      <Badge className="bg-blue-100 text-blue-800">{queue.pro_time}</Badge>
                    </td>
                    <td className="text-center py-4">
                      <Badge variant="outline" className="text-medical-green border-medical-green">
                        {queue.savings}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Avantages Pro */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {proAccessBenefits.map((benefit) => (
          <Card key={benefit.id} className="relative overflow-hidden">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg text-medical-blue">
                    {benefit.icon}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{benefit.title}</CardTitle>
                    <Badge className={getStatusColor(benefit.status)} variant="secondary">
                      {getStatusText(benefit.status)}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <p className="text-gray-600">{benefit.description}</p>

              {/* Usage stats si disponible */}
              {benefit.usage_limit && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Utilisation ce mois</span>
                    <span className="text-sm font-medium">
                      {benefit.usage_count || 0}/{benefit.usage_limit}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-medical-blue-light h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${getUsagePercentage(benefit.usage_count, benefit.usage_limit)}%` 
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Actions basées sur le statut */}
              {benefit.status === 'active' && (
                <Button className="w-full" size="sm">
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Utiliser maintenant
                </Button>
              )}

              {benefit.status === 'coming_soon' && (
                <Button variant="outline" className="w-full" size="sm" disabled>
                  <Clock className="h-4 w-4 mr-2" />
                  Bientôt disponible
                </Button>
              )}

              {benefit.status === 'premium_only' && (
                <Button variant="outline" className="w-full" size="sm">
                  <Crown className="h-4 w-4 mr-2" />
                  Passer à Premium
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Statistiques d'utilisation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Vos statistiques Pro ce mois
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-medical-blue">15</div>
              <div className="text-sm text-gray-600">Candidatures prioritaires</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-medical-green">3</div>
              <div className="text-sm text-gray-600">Réponses obtenues</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">24h</div>
              <div className="text-sm text-gray-600">Temps de réponse moyen</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">8</div>
              <div className="text-sm text-gray-600">Contacts directs établis</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Call to action */}
      <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
        <CardContent className="text-center py-8">
          <h2 className="text-2xl font-bold mb-2">Maximisez vos avantages Pro</h2>
          <p className="mb-4 opacity-90">
            Découvrez comment optimiser votre utilisation de l'accès prioritaire
          </p>
          <Button variant="secondary" size="lg">
            Guide d'utilisation Pro
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProPriorityAccess;
