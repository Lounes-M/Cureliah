
import { Button } from "@/components/ui/button";
import { User, Building2, Calendar, Clock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

const HeroSection = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const getUserType = () => {
    // First check profile, then fallback to user metadata
    return profile?.user_type || user?.user_metadata?.user_type;
  };

  const handleDoctorClick = () => {
    console.log('Doctor button clicked - User type:', getUserType());
    
    if (user) {
      const userType = getUserType();
      
      if (userType === 'doctor') {
        console.log('Navigating to doctor dashboard');
        navigate('/doctor/dashboard');
      } else {
        console.log('User is not a doctor, navigating to establishment dashboard');
        navigate('/establishment/dashboard');
      }
    } else {
      console.log('User not authenticated, navigating to auth');
      navigate('/auth');
    }
  };

  const handleEstablishmentClick = () => {
    console.log('Establishment button clicked - User type:', getUserType());
    
    if (user) {
      const userType = getUserType();
      
      if (userType === 'establishment') {
        console.log('Navigating to establishment dashboard');
        navigate('/establishment/dashboard');
      } else {
        console.log('User is not an establishment, navigating to doctor dashboard');
        navigate('/doctor/dashboard');
      }
    } else {
      console.log('User not authenticated, navigating to auth');
      navigate('/auth');
    }
  };

  const userType = getUserType();

  return (
    <section className="bg-gradient-to-br from-medical-blue-light via-white to-medical-green-light min-h-[80vh] flex items-center">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="text-center lg:text-left animate-fade-in">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
              La plateforme qui{" "}
              <span className="text-medical-blue">révolutionne</span> les{" "}
              <span className="text-medical-green">vacations médicales</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Médecins, publiez vos disponibilités. Établissements, trouvez instantanément 
              le praticien qu'il vous faut. Simple, rapide, sécurisé.
            </p>

            {/* Dual CTA */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-8">
              <Button 
                size="lg" 
                onClick={handleDoctorClick}
                className="bg-medical-blue hover:bg-medical-blue-dark text-white px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <User className="w-5 h-5 mr-2" />
                {user && userType === 'doctor' ? 'Mon dashboard' : 'Je suis médecin'}
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                onClick={handleEstablishmentClick}
                className="border-medical-green text-medical-green hover:bg-medical-green hover:text-white px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Building2 className="w-5 h-5 mr-2" />
                {user && userType === 'establishment' ? 'Mon dashboard' : 'Je suis un établissement'}
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-6 pt-8 border-t border-gray-200">
              <div className="text-center lg:text-left">
                <div className="flex items-center justify-center lg:justify-start space-x-2 mb-2">
                  <Calendar className="w-5 h-5 text-medical-blue" />
                  <span className="text-2xl font-bold text-gray-900">500+</span>
                </div>
                <p className="text-gray-600">Médecins inscrits</p>
              </div>
              <div className="text-center lg:text-left">
                <div className="flex items-center justify-center lg:justify-start space-x-2 mb-2">
                  <Clock className="w-5 h-5 text-medical-green" />
                  <span className="text-2xl font-bold text-gray-900">2min</span>
                </div>
                <p className="text-gray-600">Temps de réservation</p>
              </div>
            </div>
          </div>

          {/* Right Content - Illustration */}
          <div className="relative">
            <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
              <div className="space-y-6">
                {/* Mock calendar */}
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Disponibilités</h3>
                  <span className="text-sm text-medical-blue font-medium">Novembre 2024</span>
                </div>
                
                <div className="grid grid-cols-7 gap-2 text-center text-sm">
                  {["L", "M", "M", "J", "V", "S", "D"].map((day, index) => (
                    <div key={index} className="text-gray-500 font-medium py-2">
                      {day}
                    </div>
                  ))}
                  {Array.from({ length: 35 }, (_, i) => {
                    const isAvailable = [5, 6, 12, 13, 19, 20, 26, 27].includes(i);
                    const day = i < 31 ? i + 1 : "";
                    return (
                      <div
                        key={i}
                        className={`h-8 flex items-center justify-center text-sm rounded ${
                          isAvailable
                            ? "bg-medical-green text-white font-medium"
                            : day
                            ? "text-gray-700 hover:bg-gray-100"
                            : ""
                        }`}
                      >
                        {day}
                      </div>
                    );
                  })}
                </div>

                <div className="border-t pt-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Dr. Martin - Cardiologue</span>
                    <span className="text-medical-blue font-semibold">120€/vacation</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating elements */}
            <div className="absolute -top-4 -right-4 bg-medical-green text-white p-3 rounded-full shadow-lg">
              <User className="w-6 h-6" />
            </div>
            <div className="absolute -bottom-4 -left-4 bg-medical-blue text-white p-3 rounded-full shadow-lg">
              <Building2 className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
