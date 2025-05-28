
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/hooks/useAuth';
import { Toaster } from '@/components/ui/toaster';
import Index from '@/pages/Index';
import Auth from '@/pages/Auth';
import DoctorDashboard from '@/pages/DoctorDashboard';
import EstablishmentDashboard from '@/pages/EstablishmentDashboard';
import ProfileComplete from '@/pages/ProfileComplete';
import CreateVacation from '@/pages/CreateVacation';
import VacationSearch from '@/pages/VacationSearch';
import MyBookings from '@/pages/MyBookings';
import NotFound from '@/pages/NotFound';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-white">
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/profile/complete" element={<ProfileComplete />} />
            <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
            <Route path="/doctor/create-vacation" element={<CreateVacation />} />
            <Route path="/establishment/dashboard" element={<EstablishmentDashboard />} />
            <Route path="/search" element={<VacationSearch />} />
            <Route path="/bookings" element={<MyBookings />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
        <Toaster />
      </AuthProvider>
    </Router>
  );
}

export default App;
