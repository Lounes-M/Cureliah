
import { AlertCircle, Clock, UserX, Building } from "lucide-react";

const ProblemSection = () => {
  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Les défis actuels du secteur médical
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Le système traditionnel de recrutement médical présente des inefficacités majeures 
            pour tous les acteurs du secteur.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Problèmes des médecins */}
          <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-100">
            <div className="flex items-center mb-6">
              <div className="bg-red-100 p-3 rounded-full mr-4">
                <UserX className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">Pour les médecins</h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-red-500 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-gray-900">Manque de visibilité</h4>
                  <p className="text-gray-600">Difficile de faire connaître ses disponibilités aux établissements</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <Clock className="w-5 h-5 text-red-500 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-gray-900">Processus longs</h4>
                  <p className="text-gray-600">Négociations interminables, contrats complexes, démarches administratives</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-red-500 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-gray-900">Revenus imprévisibles</h4>
                  <p className="text-gray-600">Difficile de planifier ses revenus et optimiser son planning</p>
                </div>
              </div>
            </div>
          </div>

          {/* Problèmes des établissements */}
          <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-100">
            <div className="flex items-center mb-6">
              <div className="bg-orange-100 p-3 rounded-full mr-4">
                <Building className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">Pour les établissements</h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Clock className="w-5 h-5 text-orange-500 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-gray-900">Urgences non couvertes</h4>
                  <p className="text-gray-600">Besoin immédiat de médecins sans solution rapide</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-orange-500 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-gray-900">Recrutement complexe</h4>
                  <p className="text-gray-600">Réseau limité, validation des compétences chronophage</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <UserX className="w-5 h-5 text-orange-500 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-gray-900">Manque de transparence</h4>
                  <p className="text-gray-600">Tarifs opaques, disponibilités inconnues</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Call to action */}
        <div className="text-center mt-12">
          <div className="bg-medical-blue-light rounded-xl p-8 inline-block">
            <h3 className="text-xl font-bold text-medical-blue mb-2">
              Il est temps de changer la donne
            </h3>
            <p className="text-medical-blue">
              Projet Med apporte une solution moderne et efficace à ces problématiques
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProblemSection;
