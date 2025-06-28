import React from 'react';
import Footer from '@/components/Footer';
import { XCircle, LifeBuoy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PaymentFailure = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-red-100 via-white to-red-200">
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-24 sm:py-32">
        <div className="max-w-lg w-full bg-white rounded-3xl shadow-2xl p-12 flex flex-col items-center text-center animate-fade-in">
          <XCircle className="w-20 h-20 text-red-500 mb-6 animate-shake" />
          <h1 className="text-4xl font-extrabold mb-3 text-red-700 tracking-tight drop-shadow">
            Échec du paiement
          </h1>
          <p className="text-gray-700 mb-8 text-lg">Votre paiement n'a pas pu être traité.<br/>Veuillez réessayer ou contacter le support si le problème persiste.</p>
          <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
            <button
              onClick={() => navigate('/subscribe')}
              className="px-6 py-3 bg-red-600 text-white rounded-lg font-semibold shadow hover:bg-red-700 transition text-base flex items-center justify-center gap-2"
            >
              Réessayer
            </button>
            <a
              href="mailto:support@cureliah.fr"
              className="px-6 py-3 bg-gray-100 text-red-700 rounded-lg font-semibold shadow hover:bg-gray-200 transition text-base flex items-center justify-center gap-2"
            >
              <LifeBuoy className="w-5 h-5" />
              Contacter le support
            </a>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PaymentFailure;
