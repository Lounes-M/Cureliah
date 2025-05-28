
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const Header = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <Link to="/" className="flex items-center">
            <h1 className="text-2xl font-bold text-blue-600">Projet Med</h1>
          </Link>
          
          <nav className="hidden md:flex space-x-8">
            <a href="#probleme" className="text-gray-600 hover:text-gray-900">
              Problème
            </a>
            <a href="#solution" className="text-gray-600 hover:text-gray-900">
              Solution
            </a>
            <a href="#avantages" className="text-gray-600 hover:text-gray-900">
              Avantages
            </a>
            <a href="#temoignages" className="text-gray-600 hover:text-gray-900">
              Témoignages
            </a>
          </nav>
          
          <div className="flex space-x-4">
            {user ? (
              <Button onClick={() => navigate("/dashboard")}>
                Dashboard
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={() => navigate("/login")}>
                  Se connecter
                </Button>
                <Button onClick={() => navigate("/register")}>
                  S'inscrire
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
