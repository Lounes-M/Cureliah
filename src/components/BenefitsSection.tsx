
import { DollarSign, Clock, Shield, Zap, Users, BarChart3 } from "lucide-react";

const BenefitsSection = () => {
  return (
    <section id="avantages" className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Pourquoi choisir Cureliah ?
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Une plateforme conçue pour répondre aux besoins spécifiques de chaque acteur du secteur médical
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-16">
          {/* Avantages médecins */}
          <div>
            <div className="flex items-center mb-8">
              <div className="bg-medical-blue text-white p-3 rounded-lg mr-4">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">Avantages pour les médecins</h3>
            </div>

            <div className="space-y-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-start space-x-4">
                  <div className="bg-green-100 p-2 rounded-lg">
                    <DollarSign className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 mb-2">Revenus optimisés</h4>
                    <p className="text-gray-600">
                      Fixez vos tarifs librement et optimisez votre planning. 
                      Plus de négociations, revenus prévisibles.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-start space-x-4">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <Clock className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 mb-2">Liberté totale</h4>
                    <p className="text-gray-600">
                      Travaillez quand vous voulez, où vous voulez. 
                      Gérez votre planning en toute autonomie.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-start space-x-4">
                  <div className="bg-purple-100 p-2 rounded-lg">
                    <BarChart3 className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 mb-2">Visibilité accrue</h4>
                    <p className="text-gray-600">
                      Votre profil est visible par tous les établissements. 
                      Développez votre réseau professionnel.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Avantages établissements */}
          <div>
            <div className="flex items-center mb-8">
              <div className="bg-medical-green text-white p-3 rounded-lg mr-4">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">Avantages pour les établissements</h3>
            </div>

            <div className="space-y-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-start space-x-4">
                  <div className="bg-red-100 p-2 rounded-lg">
                    <Zap className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 mb-2">Réactivité maximale</h4>
                    <p className="text-gray-600">
                      Trouvez un médecin en moins de 2 minutes. 
                      Idéal pour les urgences et remplacements de dernière minute.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-start space-x-4">
                  <div className="bg-green-100 p-2 rounded-lg">
                    <Shield className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 mb-2">Sécurité garantie</h4>
                    <p className="text-gray-600">
                      Tous les médecins sont vérifiés (RPPS, diplômes). 
                      Contrats conformes, assurances validées.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-start space-x-4">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <DollarSign className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 mb-2">Tarifs transparents</h4>
                    <p className="text-gray-600">
                      Comparez les tarifs en temps réel. 
                      Aucune négociation, prix fixés à l'avance.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Comparaison avant/après */}
        <div className="mt-20">
          <h3 className="text-2xl font-bold text-center text-gray-900 mb-12">
            Avant / Après Cureliah
          </h3>
          
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="grid md:grid-cols-2">
              {/* Avant */}
              <div className="p-8 border-r border-gray-200">
                <div className="text-center mb-6">
                  <div className="bg-red-100 text-red-600 px-4 py-2 rounded-full inline-block font-semibold">
                    AVANT
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                    <span className="text-gray-600">Recrutement de 2-3 semaines</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                    <span className="text-gray-600">Négociations complexes</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                    <span className="text-gray-600">Contrats papier</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                    <span className="text-gray-600">Facturation manuelle</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                    <span className="text-gray-600">Réseau limité</span>
                  </div>
                </div>
              </div>

              {/* Après */}
              <div className="p-8 bg-gradient-to-br from-medical-blue-light to-medical-green-light">
                <div className="text-center mb-6">
                  <div className="bg-green-500 text-white px-4 py-2 rounded-full inline-block font-semibold">
                    AVEC CURELIAH
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-gray-700 font-medium">Réservation en 2 minutes</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-gray-700 font-medium">Tarifs transparents</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-gray-700 font-medium">Contrats automatiques</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-gray-700 font-medium">Facturation intégrée</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-gray-700 font-medium">Accès à tous les médecins</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BenefitsSection;
