import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, HelpCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const pricingPlans = [
  {
    name: 'Essentiel',
    price: '49',
    description: 'Parfait pour commencer',
    features: [
      'Profil médecin vérifié',
      'Recherche de missions',
      'Notifications par email',
      'Support basique',
    ],
    cta: 'Commencer',
    popular: false,
  },
  {
    name: 'Pro',
    price: '99',
    description: 'Pour les médecins actifs',
    features: [
      'Tout le plan Essentiel',
      'Missions prioritaires',
      'Statistiques avancées',
      'Support prioritaire',
      'Facturation automatique',
    ],
    cta: 'Commencer',
    popular: true,
  },
  {
    name: 'Premium',
    price: '199',
    description: 'Pour les médecins experts',
    features: [
      'Tout le plan Pro',
      'Missions exclusives',
      'Accès aux établissements premium',
      'Formation personnalisée',
      'Dédicace commerciale',
    ],
    cta: 'Commencer',
    popular: false,
  },
];

export default function PricingSection() {
  return (
    <section className="py-16 bg-gradient-to-br from-medical-blue-light/50 via-white to-medical-green-light/50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Nos offres d'abonnement
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Choisissez l'offre qui correspond le mieux à vos besoins
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {pricingPlans.map((plan) => (
            <Card 
              key={plan.name} 
              className={`relative ${plan.popular ? 'border-medical-blue shadow-lg' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-medical-blue text-white px-4 py-1 rounded-full text-sm font-semibold">
                    Le plus populaire
                  </span>
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-gray-900">{plan.name}</CardTitle>
                <CardDescription className="text-gray-600">{plan.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-gray-900">€{plan.price}</span>
                  <span className="text-gray-600">/mois</span>
                </div>
                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center">
                      <Check className="w-5 h-5 text-medical-green mr-2" />
                      <span className="text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button 
                  className={`w-full ${plan.popular ? 'bg-medical-blue hover:bg-medical-blue-dark' : 'bg-medical-green hover:bg-medical-green-dark'}`}
                  asChild
                >
                  <Link to="/auth?type=doctor">{plan.cta}</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        <div className="text-center mt-8">
          <Link 
            to="/faq" 
            className="inline-flex items-center text-medical-blue hover:text-medical-blue-dark"
          >
            <HelpCircle className="w-4 h-4 mr-2" />
            Questions sur la facturation et l'annulation ?
          </Link>
        </div>
      </div>
    </section>
  );
} 