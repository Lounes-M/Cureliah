import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import PricingSection from '@/components/landing/PricingSection';

export default function Landing() {
  return (
    <div>
      <header className="bg-white shadow">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Projet Med</h1>
            <div className="space-x-4">
              <Button variant="outline" asChild>
                <Link to="/auth?type=doctor">Je suis médecin</Link>
              </Button>
              <Button asChild>
                <Link to="/auth?type=establishment">Je suis un établissement</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main>
        <PricingSection />
      </main>
    </div>
  );
} 