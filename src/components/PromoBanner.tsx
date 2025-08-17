import React, { useState } from 'react';
import { X, Gift, Copy, Check } from 'lucide-react';
import { promoService } from '@/services/promoService';
import { logger } from "@/services/logger";

interface PromoBannerProps {
  onClose?: () => void;
  variant?: 'top' | 'inline' | 'modal';
  user?: any; // Utilisateur connecté pour adapter le message
}

export const PromoBanner: React.FC<PromoBannerProps> = ({ 
  onClose, 
  variant = 'top',
  user
}) => {
  const [copied, setCopied] = useState(false);

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

  // Messages adaptés selon le type d'utilisateur
  const getMessages = () => {
    if (!user) {
      // Visiteur non-connecté
      return {
        title: "Offre de Bienvenue Médecins !",
        subtitle: "Créez votre compte médecin et obtenez votre premier mois gratuit",
        cta: "Créer mon compte médecin"
      };
    } else if (user.user_metadata?.user_type === 'doctor') {
      // Médecin non-abonné
      return {
        title: "Activez votre abonnement !",
        subtitle: "Utilisez votre premier mois gratuit avec le code",
        cta: "Choisir mon abonnement"
      };
    }
    
    // Fallback
    return {
      title: "Offre de Bienvenue !",
      subtitle: "Votre premier mois gratuit avec le code",
      cta: "Découvrir nos plans"
    };
  };

  const messages = getMessages(); 

  const baseStyles = "relative overflow-hidden";
  
  const variantStyles = {
    top: "w-full bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-3 px-4 shadow-lg",
    inline: "rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 p-4 my-4",
    modal: "rounded-xl bg-white border border-gray-200 p-6 shadow-xl max-w-md mx-auto"
  };

  const textStyles = {
    top: "text-white",
    inline: "text-blue-900",
    modal: "text-gray-900"
  };

  return (
    <div className={`${baseStyles} ${variantStyles[variant]}`}>
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-repeat bg-center" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }} />
      </div>
      
      <div className="relative flex items-center justify-between">
        <div className="flex items-center space-x-3 flex-1">
          {/* Gift Icon */}
          <div className={`flex-shrink-0 ${variant === 'top' ? 'text-yellow-300' : 'text-medical-blue-light'}`}>
            <Gift className="w-6 h-6" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className={`font-bold text-lg ${textStyles[variant]}`}>
              {messages.title}
            </div>
            <div className={`text-sm ${textStyles[variant]} ${variant === 'top' ? 'text-blue-100' : 'text-blue-700'}`}>
              {messages.subtitle}{' '}
              <button
                onClick={copyPromoCode}
                className={`inline-flex items-center space-x-1 px-2 py-1 rounded font-mono font-bold transition-all duration-200 ${
                  variant === 'top' 
                    ? 'bg-white/20 hover:bg-white/30 text-yellow-300 hover:text-yellow-200' 
                    : 'bg-medical-blue hover:bg-medical-blue-dark text-white'
                }`}
              >
                <span>WELCOME100</span>
                {copied ? (
                  <Check className="w-3 h-3" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Close Button */}
        {onClose && (
          <button
            onClick={onClose}
            className={`flex-shrink-0 ml-4 p-1 rounded-full transition-colors ${
              variant === 'top'
                ? 'text-white/70 hover:text-white hover:bg-white/20'
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Call to Action for larger variants */}
      {variant !== 'top' && (
        <div className="mt-4 flex items-center justify-between">
          <div className="text-xs text-gray-500">
            Valable pour tous les nouveaux abonnements
          </div>
          <button 
            onClick={() => {
              promoService.trackPromoUsage('WELCOME100', 'banner_click');
              
              // Redirection adaptée selon l'utilisateur
              if (!user) {
                window.location.href = '/auth?type=doctor'; // Page d'inscription médecin
              } else if (user.user_metadata?.user_type === 'doctor') {
                window.location.href = '/pricing'; // Page d'abonnement
              } else {
                window.location.href = '/pricing'; // Fallback
              }
            }}
            className="bg-medical-blue hover:bg-medical-blue-dark text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            {messages.cta}
          </button>
        </div>
      )}
    </div>
  );
};
