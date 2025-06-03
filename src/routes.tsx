import { Routes, Route } from 'react-router-dom';
import Index from './pages/Index';
import Auth from './pages/Auth';
import DoctorDashboard from './pages/DoctorDashboard';
import EstablishmentDashboard from './pages/EstablishmentDashboard';
import EstablishmentSearch from './pages/EstablishmentSearch';
import EstablishmentProfile from './pages/EstablishmentProfile';
import CreateVacation from './pages/CreateVacation';
import ManageVacations from './pages/ManageVacations';
import VacationDetails from './pages/VacationDetails';
import VacationSearch from './pages/VacationSearch';
import MyBookings from './pages/MyBookings';
import ProfileComplete from './pages/ProfileComplete';
import PaymentSuccess from './pages/PaymentSuccess';
import NotFound from './pages/NotFound';
import AdminDashboard from './pages/admin/AdminDashboard';
import DoctorCreateProfile from './pages/doctor/CreateProfile';
import EstablishmentCreateProfile from './pages/establishment/CreateProfile';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
      <Route path="/establishment/dashboard" element={<EstablishmentDashboard />} />
      <Route path="/establishment/search" element={<EstablishmentSearch />} />
      <Route path="/establishment/profile" element={<EstablishmentProfile />} />
      <Route path="/doctor/create-vacation" element={<CreateVacation />} />
      <Route path="/doctor/manage-vacations" element={<ManageVacations />} />
      <Route path="/doctor/vacation/:vacationId" element={<VacationDetails />} />
      <Route path="/doctor/vacation/:vacationId/edit" element={<CreateVacation />} />
      <Route path="/search" element={<VacationSearch />} />
      <Route path="/vacation-search" element={<VacationSearch />} />
      <Route path="/bookings" element={<MyBookings />} />
      <Route path="/my-bookings" element={<MyBookings />} />
      <Route path="/profile/complete" element={<ProfileComplete />} />
      <Route path="/payment-success" element={<PaymentSuccess />} />
      <Route path="/admin/*" element={<AdminDashboard />} />
      <Route path="/doctor/create-profile" element={<DoctorCreateProfile />} />
      <Route path="/establishment/create-profile" element={<EstablishmentCreateProfile />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
} 