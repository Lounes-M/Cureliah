import React from 'react';
import { AlertTriangle, Shield, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const PaymentTroubleshootingPage = () => {
  const navigate = useNavigate();

  const adBlockers = [
    'uBlock Origin',
    'Adblock Plus', 
    'AdBlock',
    'Ghostery',
    'Privacy Badger',
    'Brave Shield'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <AlertTriangle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Problème de Paiement Détecté
          </h1>
          <p className="text-lg text-gray-600">
            Il semble que votre navigateur bloque les services de paiement Stripe
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Problème identifié */}
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-800">
                <XCircle className="w-5 h-5" />
                Problème Identifié
              </CardTitle>
            </CardHeader>
            <CardContent className="text-orange-700">
              <p className="mb-4">
                Votre navigateur ou une extension bloque les requêtes vers Stripe, 
                empêchant le traitement des paiements.
              </p>
              <div className="bg-orange-100 p-3 rounded-lg">
                <p className="font-semibold text-sm">Erreur technique :</p>
                <code className="text-xs">net::ERR_BLOCKED_BY_CLIENT</code>
              </div>
            </CardContent>
          </Card>

          {/* Solution recommandée */}
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-800">
                <CheckCircle className="w-5 h-5" />
                Solution Recommandée
              </CardTitle>
            </CardHeader>
            <CardContent className="text-green-700">
              <div className="space-y-3">
                <div className="bg-green-100 p-3 rounded-lg">
                  <p className="font-semibold mb-2">Option 1 : Liste blanche</p>
                  <p className="text-sm">
                    Ajoutez <code className="bg-white px-1 rounded">*.stripe.com</code> 
                    à la liste blanche de votre bloqueur
                  </p>
                </div>
                <div className="bg-green-100 p-3 rounded-lg">
                  <p className="font-semibold mb-2">Option 2 : Désactivation temporaire</p>
                  <p className="text-sm">
                    Désactivez votre bloqueur sur cureliah.com
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Guides par bloqueur */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-600" />
              Guides par Bloqueur de Publicité
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {adBlockers.map((blocker, index) => (
                <div key={index} className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-800 mb-2">{blocker}</h4>
                  <ol className="text-sm text-gray-600 space-y-1">
                    <li>1. Cliquez sur l'icône {blocker}</li>
                    <li>2. Cherchez "Liste blanche" ou "Exceptions"</li>
                    <li>3. Ajoutez "*.stripe.com"</li>
                    <li>4. Rechargez la page</li>
                  </ol>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-center gap-4 mt-8">
          <Button 
            variant="outline" 
            onClick={() => navigate(-1)}
            className="px-6"
          >
            Retour
          </Button>
          <Button 
            onClick={() => window.location.reload()}
            className="px-6"
          >
            Tester à Nouveau
          </Button>
        </div>

        {/* Contact support */}
        <div className="text-center mt-8 p-4 bg-blue-50 rounded-lg">
          <p className="text-blue-800">
            <strong>Besoin d'aide ?</strong> Contactez notre support technique si le problème persiste.
          </p>
          <Button 
            variant="link" 
            onClick={() => navigate('/contact')}
            className="text-blue-600"
          >
            Contacter le Support →
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PaymentTroubleshootingPage;
