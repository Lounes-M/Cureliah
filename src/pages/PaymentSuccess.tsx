import React from 'react';
import Confetti from 'react-confetti';
import Footer from '@/components/Footer';
import { CheckCircle2, CalendarCheck2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const { isSubscribed, subscriptionLoading } = useAuth();
  const [width, setWidth] = React.useState(window.innerWidth);
  const [height, setHeight] = React.useState(window.innerHeight);

  // Reload automatique tant que l'abonnement n'est pas actif
  React.useEffect(() => {
    if (!isSubscribed() && !subscriptionLoading) {
      const timeout = setTimeout(() => {
        window.location.reload();
      }, 2000); // 2 secondes
      return () => clearTimeout(timeout);
    }
  }, [isSubscribed, subscriptionLoading]);

  React.useEffect(() => {
    const handleResize = () => {
      setWidth(window.innerWidth);
      setHeight(window.innerHeight);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-medical-blue-light/30 via-white to-medical-green-light/30">
      <Confetti width={width} height={height} numberOfPieces={250} recycle={false} />
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-24 sm:py-32">
        <div className="max-w-lg w-full bg-white rounded-3xl shadow-2xl p-12 flex flex-col items-center text-center animate-fade-in">
          <CheckCircle2 className="w-20 h-20 text-medical-green-light mb-6 animate-bounce-in" />
          <h1 className="text-4xl font-extrabold mb-3 text-green-700 tracking-tight drop-shadow">Paiement réussi !</h1>
          <p className="text-gray-700 mb-8 text-lg">Merci pour votre paiement. Votre transaction a été traitée avec succès.<br/>Vous pouvez maintenant profiter de toutes les fonctionnalités de Cureliah.</p>
          <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
            <button
              onClick={() => navigate('/doctor/dashboard')}
              className="px-6 py-3 bg-medical-blue text-white rounded-lg font-semibold shadow hover:bg-medical-blue-dark transition text-base flex items-center justify-center gap-2"
            >
              <CalendarCheck2 className="w-5 h-5" />
              Retour au tableau de bord
            </button>
            <button
              onClick={() => navigate('/bookings')}
              className="px-6 py-3 bg-emerald-500 text-white rounded-lg font-semibold shadow hover:bg-medical-green transition text-base flex items-center justify-center gap-2"
            >
              Voir mes réservations
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PaymentSuccess;
