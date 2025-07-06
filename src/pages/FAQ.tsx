import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, HelpCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import FAQSection from '@/components/FAQSection';

const FAQ = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="p-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <HelpCircle className="h-8 w-8 text-blue-600" />
              Questions fréquentes
            </h1>
            <p className="text-gray-600 mt-1">
              Trouvez les réponses aux questions les plus courantes sur Cureliah
            </p>
          </div>
        </div>

        {/* FAQ Component */}
        <FAQSection />

        {/* Contact section */}
        <div className="mt-12 text-center">
          <div className="bg-white rounded-lg p-8 shadow-sm border">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Vous ne trouvez pas la réponse ?
            </h2>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Notre équipe support est là pour vous aider. Contactez-nous et nous vous répondrons rapidement.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={() => navigate('/contact')}
                size="lg"
              >
                Nous contacter
              </Button>
              <Button 
                variant="outline"
                onClick={() => navigate('/demo-request')}
                size="lg"
              >
                Demander une démo
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FAQ;
