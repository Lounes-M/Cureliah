
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const HeroSection = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <section className="bg-gradient-to-br from-blue-50 to-indigo-100 py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            La plateforme inversée pour les{" "}
            <span className="text-blue-600">vacations médicales</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Les médecins publient leurs disponibilités, les établissements de santé 
            réservent en ligne. Simple, transparent, efficace.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {user ? (
              <Button 
                size="lg" 
                className="text-lg px-8 py-4"
                onClick={() => navigate("/dashboard")}
              >
                Accéder au Dashboard
              </Button>
            ) : (
              <>
                <Button 
                  size="lg" 
                  className="text-lg px-8 py-4"
                  onClick={() => navigate("/register")}
                >
                  Commencer gratuitement
                </Button>
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="text-lg px-8 py-4"
                  onClick={() => navigate("/login")}
                >
                  Se connecter
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
