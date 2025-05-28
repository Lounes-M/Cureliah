
import { Mail, Phone, MapPin } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Logo et description */}
          <div className="md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-medical-blue rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">PM</span>
              </div>
              <span className="text-xl font-bold">Projet Med</span>
            </div>
            <p className="text-gray-300 mb-6 leading-relaxed">
              La plateforme qui révolutionne les vacations médicales en France. 
              Connectons les médecins et les établissements de santé pour un système 
              plus efficace et moderne.
            </p>
            <div className="flex space-x-4">
              <div className="bg-gray-800 p-2 rounded-lg">
                <Mail className="w-5 h-5" />
              </div>
              <div className="bg-gray-800 p-2 rounded-lg">
                <Phone className="w-5 h-5" />
              </div>
              <div className="bg-gray-800 p-2 rounded-lg">
                <MapPin className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Liens rapides */}
          <div>
            <h3 className="font-bold text-lg mb-4">Liens rapides</h3>
            <ul className="space-y-2">
              <li><a href="#fonctionnement" className="text-gray-300 hover:text-white transition-colors">Fonctionnement</a></li>
              <li><a href="#avantages" className="text-gray-300 hover:text-white transition-colors">Avantages</a></li>
              <li><a href="#faq" className="text-gray-300 hover:text-white transition-colors">FAQ</a></li>
              <li><a href="/medecin" className="text-gray-300 hover:text-white transition-colors">Espace Médecin</a></li>
              <li><a href="/etablissement" className="text-gray-300 hover:text-white transition-colors">Espace Établissement</a></li>
            </ul>
          </div>

          {/* Légal */}
          <div>
            <h3 className="font-bold text-lg mb-4">Légal</h3>
            <ul className="space-y-2">
              <li><a href="/mentions-legales" className="text-gray-300 hover:text-white transition-colors">Mentions légales</a></li>
              <li><a href="/cgv" className="text-gray-300 hover:text-white transition-colors">CGV</a></li>
              <li><a href="/cgu" className="text-gray-300 hover:text-white transition-colors">CGU</a></li>
              <li><a href="/confidentialite" className="text-gray-300 hover:text-white transition-colors">Confidentialité</a></li>
              <li><a href="/rgpd" className="text-gray-300 hover:text-white transition-colors">RGPD</a></li>
            </ul>
          </div>
        </div>

        {/* Contact */}
        <div className="border-t border-gray-700 mt-12 pt-8">
          <div className="grid md:grid-cols-3 gap-6 text-sm">
            <div className="flex items-center space-x-3">
              <Mail className="w-4 h-4 text-medical-blue" />
              <span className="text-gray-300">contact@projetmed.fr</span>
            </div>
            <div className="flex items-center space-x-3">
              <Phone className="w-4 h-4 text-medical-blue" />
              <span className="text-gray-300">01 23 45 67 89</span>
            </div>
            <div className="flex items-center space-x-3">
              <MapPin className="w-4 h-4 text-medical-blue" />
              <span className="text-gray-300">Paris, France</span>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-700 mt-8 pt-8 text-center">
          <p className="text-gray-400 text-sm">
            © 2024 Projet Med. Tous droits réservés. 
            <span className="ml-2">Plateforme conforme aux normes HDS et RGPD.</span>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
