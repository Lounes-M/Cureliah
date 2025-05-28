
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import DoctorDashboard from "./pages/DoctorDashboard";
import EstablishmentDashboard from "./pages/EstablishmentDashboard";
import CreateVacation from "./pages/CreateVacation";
import VacationSearch from "./pages/VacationSearch";
import MyBookings from "./pages/MyBookings";
import ProfileComplete from "./pages/ProfileComplete";
import PaymentSuccess from "./pages/PaymentSuccess";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
          <Route path="/establishment/dashboard" element={<EstablishmentDashboard />} />
          <Route path="/doctor/create-vacation" element={<CreateVacation />} />
          <Route path="/search" element={<VacationSearch />} />
          <Route path="/bookings" element={<MyBookings />} />
          <Route path="/profile/complete" element={<ProfileComplete />} />
          <Route path="/payment-success" element={<PaymentSuccess />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
