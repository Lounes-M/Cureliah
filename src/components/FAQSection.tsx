
import { Plus, Minus } from "lucide-react";
import { useState } from "react";

const FAQSection = () => {
  const [openFAQ, setOpenFAQ] = useState<number | null>(0);

  const faqs = [
    {
      question: "Comment fonctionne l'abonnement médecin ?",
      answer: "L'abonnement médecin est de 49€/mois. Il vous donne accès à toutes les fonctionnalités : publication de créneaux illimitée, réception de demandes, messagerie, génération de contrats et facturation automatique. Aucune commission sur vos revenus."
    },
    {
      question: "Comment la vérification RPPS fonctionne-t-elle ?",
      answer: "Lors de votre inscription, vous devez fournir votre numéro RPPS et uploader une copie de votre diplôme. Notre équipe vérifie ces informations auprès des registres officiels sous 24h. Cette validation garantit la sécurité pour tous."
    },
    {
      question: "Quels types de vacations puis-je proposer ?",
      answer: "Vous pouvez proposer tous types de vacations : consultations en présentiel, téléconsultations, gardes, remplacements, missions ponctuelles, interventions esthétiques, etc. Vous définissez vos spécialités et modes d'intervention."
    },
    {
      question: "Comment sont gérés les paiements ?",
      answer: "Les établissements paient directement sur la plateforme via Stripe. Vous recevez vos paiements sous 48h après validation de la mission. Les factures sont générées automatiquement avec toutes les mentions légales."
    },
    {
      question: "Y a-t-il des frais pour les établissements ?",
      answer: "Les établissements ne paient que les vacations réservées, sans abonnement. Ils peuvent également souscrire à un forfait entreprise pour des besoins récurrents avec tarifs préférentiels."
    },
    {
      question: "Que se passe-t-il en cas d'annulation ?",
      answer: "Les conditions d'annulation sont définies dans nos CGU. Généralement, une annulation 24h avant est gratuite. En cas d'urgence médicale, des exceptions sont prévues. Un système de notation mutuel encourage le professionnalisme."
    },
    {
      question: "La plateforme est-elle sécurisée ?",
      answer: "Oui, nous utilisons un chiffrement SSL, respectons le RGPD et stockons les données de santé selon les normes HDS. Toutes les communications transitent par des serveurs sécurisés en France."
    },
    {
      question: "Puis-je annuler mon abonnement à tout moment ?",
      answer: "Oui, vous pouvez annuler votre abonnement médecin à tout moment depuis votre espace personnel. L'abonnement reste actif jusqu'à la fin de la période payée."
    }
  ];

  return (
    <section id="faq" className="py-16 bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Questions fréquentes
          </h2>
          <p className="text-xl text-gray-600">
            Trouvez rapidement les réponses à vos questions
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div 
              key={index} 
              className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
            >
              <button
                className="w-full px-6 py-4 text-left flex items-center justify-between focus:outline-none focus:bg-gray-50"
                onClick={() => setOpenFAQ(openFAQ === index ? null : index)}
              >
                <span className="font-semibold text-gray-900 pr-4">
                  {faq.question}
                </span>
                <div className="flex-shrink-0">
                  {openFAQ === index ? (
                    <Minus className="w-5 h-5 text-medical-blue" />
                  ) : (
                    <Plus className="w-5 h-5 text-medical-blue" />
                  )}
                </div>
              </button>
              
              {openFAQ === index && (
                <div className="px-6 pb-4">
                  <div className="pt-2 border-t border-gray-100">
                    <p className="text-gray-600 leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Contact pour autres questions */}
        <div className="text-center mt-12">
          <div className="bg-medical-blue-light rounded-xl p-6 inline-block">
            <h3 className="font-bold text-medical-blue mb-2">
              Vous ne trouvez pas votre réponse ?
            </h3>
            <p className="text-medical-blue mb-4">
              Notre équipe est là pour vous aider
            </p>
            <button className="bg-medical-blue text-white px-6 py-2 rounded-lg hover:bg-medical-blue-dark transition-colors">
              Nous contacter
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
