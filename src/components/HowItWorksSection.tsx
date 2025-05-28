
import { UserPlus, Calendar, CheckCircle, Search, MessageCircle, FileText } from "lucide-react";

const HowItWorksSection = () => {
  return (
    <section id="fonctionnement" className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Comment fonctionne Projet Med ?
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Un processus simple et efficace en 3 étapes pour connecter médecins et établissements
          </p>
        </div>

        {/* Pour les médecins */}
        <div className="mb-16">
          <h3 className="text-2xl font-bold text-medical-blue text-center mb-12">
            Pour les médecins
          </h3>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center group">
              <div className="bg-medical-blue-light p-6 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center group-hover:bg-medical-blue group-hover:text-white transition-all duration-300">
                <UserPlus className="w-10 h-10" />
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-4">1. Inscription et validation</h4>
              <p className="text-gray-600 leading-relaxed">
                Créez votre profil, uploadez vos diplômes et votre numéro RPPS. 
                Notre équipe valide votre profil sous 24h.
              </p>
            </div>

            <div className="text-center group">
              <div className="bg-medical-blue-light p-6 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center group-hover:bg-medical-blue group-hover:text-white transition-all duration-300">
                <Calendar className="w-10 h-10" />
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-4">2. Publiez vos créneaux</h4>
              <p className="text-gray-600 leading-relaxed">
                Ajoutez vos disponibilités sur notre calendrier intégré. 
                Définissez vos tarifs et zones d'intervention.
              </p>
            </div>

            <div className="text-center group">
              <div className="bg-medical-blue-light p-6 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center group-hover:bg-medical-blue group-hover:text-white transition-all duration-300">
                <CheckCircle className="w-10 h-10" />
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-4">3. Acceptez les missions</h4>
              <p className="text-gray-600 leading-relaxed">
                Recevez les demandes d'établissements, validez ou refusez. 
                Le contrat et la facturation sont automatiques.
              </p>
            </div>
          </div>
        </div>

        {/* Séparateur */}
        <div className="border-t border-gray-200 my-16"></div>

        {/* Pour les établissements */}
        <div>
          <h3 className="text-2xl font-bold text-medical-green text-center mb-12">
            Pour les établissements
          </h3>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center group">
              <div className="bg-medical-green-light p-6 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center group-hover:bg-medical-green group-hover:text-white transition-all duration-300">
                <Search className="w-10 h-10" />
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-4">1. Recherchez un médecin</h4>
              <p className="text-gray-600 leading-relaxed">
                Filtrez par spécialité, zone géographique, tarif et disponibilité. 
                Consultez les profils détaillés.
              </p>
            </div>

            <div className="text-center group">
              <div className="bg-medical-green-light p-6 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center group-hover:bg-medical-green group-hover:text-white transition-all duration-300">
                <MessageCircle className="w-10 h-10" />
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-4">2. Réservez instantanément</h4>
              <p className="text-gray-600 leading-relaxed">
                Sélectionnez le créneau qui vous convient. 
                Échangez avec le médecin via notre chat intégré.
              </p>
            </div>

            <div className="text-center group">
              <div className="bg-medical-green-light p-6 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center group-hover:bg-medical-green group-hover:text-white transition-all duration-300">
                <FileText className="w-10 h-10" />
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-4">3. Contrat automatique</h4>
              <p className="text-gray-600 leading-relaxed">
                Le contrat est généré automatiquement et signable électroniquement. 
                Recevez votre facture après la mission.
              </p>
            </div>
          </div>
        </div>

        {/* CTA final */}
        <div className="text-center mt-16">
          <div className="bg-gradient-to-r from-medical-blue to-medical-green text-white rounded-2xl p-8 inline-block">
            <h3 className="text-2xl font-bold mb-4">
              Prêt à révolutionner vos vacations médicales ?
            </h3>
            <p className="text-blue-100 mb-6">
              Rejoignez dès maintenant la communauté Projet Med
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-white text-medical-blue px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                Inscription médecin
              </button>
              <button className="border-2 border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-medical-blue transition-colors">
                Inscription établissement
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
