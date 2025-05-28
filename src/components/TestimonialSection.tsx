
import { Star, Quote } from "lucide-react";

const TestimonialSection = () => {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Ils nous font confiance
          </h2>
          <p className="text-xl text-gray-600">
            Découvrez les témoignages de nos utilisateurs
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Témoignage principal */}
          <div className="bg-gradient-to-br from-medical-blue-light to-white p-8 rounded-2xl shadow-lg border border-gray-100">
            <div className="flex items-center mb-6">
              <Quote className="w-8 h-8 text-medical-blue mr-3" />
              <div className="flex space-x-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                ))}
              </div>
            </div>
            
            <blockquote className="text-lg text-gray-700 leading-relaxed mb-6">
              "Projet Med a révolutionné ma pratique libérale. En tant que cardiologue, 
              je peux maintenant optimiser mon planning et augmenter mes revenus de 30%. 
              La plateforme est intuitive et les établissements me contactent directement. 
              Plus besoin de prospection !"
            </blockquote>
            
            <div className="flex items-center">
              <div className="w-12 h-12 bg-medical-blue rounded-full flex items-center justify-center text-white font-bold text-lg mr-4">
                DM
              </div>
              <div>
                <div className="font-semibold text-gray-900">Dr. Marie Dubois</div>
                <div className="text-gray-600">Cardiologue • Paris</div>
                <div className="text-sm text-medical-blue font-medium">Membre depuis 8 mois</div>
              </div>
            </div>
          </div>

          {/* Stats et mini témoignages */}
          <div className="space-y-6">
            {/* Stats rapides */}
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-medical-green-light p-6 rounded-xl text-center">
                <div className="text-3xl font-bold text-medical-green mb-2">98%</div>
                <div className="text-sm text-gray-600">Satisfaction médecins</div>
              </div>
              <div className="bg-medical-blue-light p-6 rounded-xl text-center">
                <div className="text-3xl font-bold text-medical-blue mb-2">2min</div>
                <div className="text-sm text-gray-600">Temps moyen de réservation</div>
              </div>
            </div>

            {/* Mini témoignages */}
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                <div className="flex items-center mb-2">
                  <div className="w-8 h-8 bg-gray-300 rounded-full mr-3"></div>
                  <div>
                    <div className="font-medium text-sm">Clinique Saint-Antoine</div>
                    <div className="text-xs text-gray-500">Établissement</div>
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  "Nous trouvons maintenant des remplaçants en urgence. 
                  Le gain de temps est considérable !"
                </p>
              </div>

              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                <div className="flex items-center mb-2">
                  <div className="w-8 h-8 bg-gray-300 rounded-full mr-3"></div>
                  <div>
                    <div className="font-medium text-sm">Dr. Jean Moreau</div>
                    <div className="text-xs text-gray-500">Urgentiste</div>
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  "Interface claire, paiements rapides. 
                  Exactement ce qu'il fallait au secteur médical."
                </p>
              </div>

              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                <div className="flex items-center mb-2">
                  <div className="w-8 h-8 bg-gray-300 rounded-full mr-3"></div>
                  <div>
                    <div className="font-medium text-sm">MedTech Innovation</div>
                    <div className="text-xs text-gray-500">Startup santé</div>
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  "Parfait pour nos consultations ponctuelles. 
                  Les médecins sont qualifiés et réactifs."
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialSection;
