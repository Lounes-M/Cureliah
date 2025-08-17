import React, { useState, useEffect } from 'react';
import { X, Gift, Copy, Check } from 'lucide-react';
import { promoService } from '@/services/promoService';
import { logger } from "@/services/logger";

interface PromoNotificationProps {
  isOpen: boolean;
  onClose: () => void;
  user?: any;
}

export const PromoNotification: React.FC<PromoNotificationProps> = ({ 
  isOpen, 
  onClose, 
  user
}) => {
  const [copied, setCopied] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => setIsVisible(true), 100);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [isOpen]);

  const copyPromoCode = async () => {
    try {
      await navigator.clipboard.writeText('WELCOME100');
      setCopied(true);
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

  if (!isOpen) return null;

  return (
    <div 
      className={`fixed top-4 right-4 z-50 max-w-sm w-full transform transition-all duration-300 ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
    >
      <div className="bg-white rounded-xl shadow-2xl border border-gray-100 p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Gift className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-sm">Premier mois gratuit !</h3>
              <p className="text-xs text-gray-600">Offre limitée</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Code promo */}
        <div className="bg-blue-50 rounded-lg p-3 mb-3">
          <div className="text-center">
            <button
              onClick={copyPromoCode}
              className="inline-flex items-center space-x-2 bg-medical-blue text-white px-3 py-2 rounded-lg font-mono font-bold text-sm hover:bg-medical-blue-dark transition-colors"
            >
              <span>WELCOME100</span>
              {copied ? (
                <Check className="w-3 h-3 text-green-300" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
            </button>
            {copied && (
              <div className="text-xs text-medical-green mt-1">
                ✓ Copié !
              </div>
            )}
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={() => {
            promoService.trackPromoUsage('WELCOME100', 'banner_click');
            if (!user) {
              window.location.href = '/auth?type=doctor&tab=signup';
            } else {
              window.location.href = '/pricing';
            }
          }}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 px-3 rounded-lg font-medium text-sm hover:from-blue-700 hover:to-purple-700 transition-all"
        >
          {!user ? 'Créer mon compte' : 'Voir les plans'}
        </button>
      </div>
    </div>
  );
};
