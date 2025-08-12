import React, { useState } from 'react';
import { X, Gift, Copy, Check } from 'lucide-react';
import { promoService } from '@/services/promoService';

interface PromoHeaderBannerProps {
  onClose?: () => void;
  user?: any;
}

export const PromoHeaderBanner: React.FC<PromoHeaderBannerProps> = ({ 
  onClose, 
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
      // TODO: Replace with logger.error('Failed to copy promo code:', err);
    }
  };

  // Messages adaptés selon le type d'utilisateur
  const getMessages = () => {
    if (!user) {
      return {
        title: "Offre de Bienvenue Médecins !",
        subtitle: "Premier mois gratuit"
      };
    } else if (user.user_metadata?.user_type === 'doctor') {
      return {
        title: "🎉 Activez votre abonnement !",
        subtitle: "Premier mois gratuit"
      };
    }
    
    return {
      title: "Offre de Bienvenue !",
      subtitle: "Premier mois gratuit"
    };
  };

  const messages = getMessages();

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-lg">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-repeat bg-center" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='20' cy='20' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }} />
      </div>
      
      <div className="relative max-w-7xl mx-auto px-3 py-2 sm:px-4 sm:py-3">
        <div className="flex items-center justify-between">
          {/* Left Section - Main Message */}
          <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
            <div className="flex-shrink-0 text-yellow-300">
              <Gift className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            
            <div className="flex items-center space-x-1 sm:space-x-2 min-w-0">
              <span className="font-bold text-xs sm:text-sm md:text-base truncate">
                {messages.title}
              </span>
              <span className="hidden sm:inline text-blue-100 text-xs sm:text-sm">
                {messages.subtitle} avec le code
              </span>
              <span className="sm:hidden text-blue-100 text-xs">
                {messages.subtitle}
              </span>
              <button
                onClick={copyPromoCode}
                className="inline-flex items-center space-x-1 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded bg-white/20 hover:bg-white/30 text-yellow-300 hover:text-yellow-200 font-mono font-bold text-xs sm:text-sm transition-all duration-200 flex-shrink-0"
              >
                <span>WELCOME100</span>
                {copied ? (
                  <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                ) : (
                  <Copy className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                )}
              </button>
            </div>
          </div>

          {/* Right Section - Close */}
          <div className="flex items-center ml-2">
            {onClose && (
              <button
                onClick={onClose}
                className="flex-shrink-0 p-0.5 sm:p-1 rounded-full text-white/70 hover:text-white hover:bg-white/20 transition-colors"
              >
                <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
