import React, { useState, useEffect } from 'react';
import { X, Gift, Copy, Check, Sparkles } from 'lucide-react';
import { promoService } from '@/services/promoService';
import { logger } from "@/services/logger";

interface PromoModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: any;
  trigger?: 'signup_hesitation' | 'checkout_abandon' | 'manual';
}

export const PromoModal: React.FC<PromoModalProps> = ({ 
  isOpen, 
  onClose, 
  user,
  trigger = 'manual'
}) => {
  const [copied, setCopied] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Animation d'apparition
      const timer = setTimeout(() => setIsVisible(true), 50);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [isOpen]);

  const copyPromoCode = async () => {
    try {
      await navigator.clipboard.writeText('WELCOME100');
      setCopied(true);
      
      // Track analytics
      promoService.trackPromoUsage('WELCOME100', 'copied');
      
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      logger.error('Failed to copy promo code:', err);
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onClose(), 300);
  };

  const getMessages = () => {
    switch (trigger) {
      case 'signup_hesitation':
        return {
          title: "Attendez ! 🎉",
          subtitle: "Dernière chance de profiter de votre premier mois gratuit",
          description: "Créez votre compte médecin maintenant et économisez sur votre premier mois d'abonnement."
        };
      case 'checkout_abandon':
        return {
          title: "Votre code promo vous attend ! ✨",
          subtitle: "N'oubliez pas d'utiliser WELCOME100",
          description: "Appliquez ce code pour obtenir votre premier mois gratuitement."
        };
      default:
        return {
          title: "Offre spéciale médecins ! 🩺",
          subtitle: "Premier mois gratuit avec WELCOME100",
          description: "Profitez de cette offre limitée pour démarrer votre abonnement."
        };
    }
  };

  const messages = getMessages();

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/20 backdrop-blur-sm z-50 transition-opacity duration-300 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-start justify-end p-4 pt-20 pr-8">
        <div 
          className={`relative bg-white rounded-2xl shadow-2xl max-w-sm w-full transform transition-all duration-300 ${
            isVisible ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 -translate-y-4'
          }`}
          onClick={(e) => e.stopPropagation()}
          style={{
            maxHeight: 'calc(100vh - 8rem)'
          }}
        >
          {/* Fermer */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Contenu */}
          <div className="p-6">
            {/* Header avec icône */}
            <div className="text-center mb-4">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-3">
                <Gift className="w-6 h-6 text-white" />
              </div>
              
              <h2 className="text-xl font-bold text-gray-900 mb-1">
                {messages.title}
              </h2>
              
              <p className="text-base text-medical-blue font-semibold mb-2">
                {messages.subtitle}
              </p>
              
              <p className="text-sm text-gray-600">
                {messages.description}
              </p>
            </div>

            {/* Code promo */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-3 mb-4">
              <div className="text-center">
                <div className="text-xs text-gray-600 mb-1">Votre code promo :</div>
                <button
                  onClick={copyPromoCode}
                  className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg font-mono font-bold text-base hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105"
                >
                  <span>WELCOME100</span>
                  {copied ? (
                    <Check className="w-4 h-4 text-green-300" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
                {copied && (
                  <div className="text-xs text-medical-green mt-1 animate-pulse">
                    ✓ Code copié !
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <button
                onClick={() => {
                  promoService.trackPromoUsage('WELCOME100', 'banner_click');
                  if (!user) {
                    window.location.href = '/auth?type=doctor&tab=signup';
                  } else {
                    window.location.href = '/pricing';
                  }
                }}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2.5 px-4 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 flex items-center justify-center space-x-2 text-sm"
              >
                <Sparkles className="w-4 h-4" />
                <span>
                  {!user ? 'Créer mon compte' : 'Choisir mon plan'}
                </span>
              </button>
              
              <button
                onClick={handleClose}
                className="w-full text-gray-500 hover:text-gray-700 py-2 text-xs transition-colors"
              >
                Peut-être plus tard
              </button>
            </div>

            {/* Footer */}
            <div className="text-center mt-3 text-xs text-gray-500">
              Offre valable pour nouveaux abonnements
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
