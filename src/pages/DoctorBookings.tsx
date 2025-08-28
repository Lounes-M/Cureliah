import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client.browser";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { logger } from "@/services/logger";
import { logger } from "@/services/logger";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Users,
  MessageSquare,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
  Filter,
  Search,
  Download,
  BarChart3,
  Phone,
  Mail,
  Building2,
  CreditCard,
  FileText,
  Send,
  Star,
  TrendingUp,
} from "lucide-react";

interface Booking {
  id: string;
  status: "pending" | "confirmed" | "cancelled" | "completed" | "in_progress";
  created_at: string;
  start_date: string;
  end_date: string;
  establishment_name: string;
  establishment_avatar: string;
  establishment_email: string;
  establishment_phone?: string;
  vacation_title: string;
  vacation_location: string;
  vacation_speciality: string;
  notes?: string;
  establishment_id: string;
}

interface BookingStats {
  total: number;
  pending: number;
  confirmed: number;
  completed: number;
  cancelled: number;
  averageRating: number;
  responseTime: string;
}

const DoctorBookings = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState<BookingStats>({
    total: 0,
    pending: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0,
    averageRating: 0,
    responseTime: "2h",
  });
  
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [responseMessage, setResponseMessage] = useState("");
  const [actionType, setActionType] = useState<"accept" | "reject" | null>(null);

  useEffect(() => {
    if (!user || profile?.user_type !== "doctor") {
      navigate("/auth?type=doctor");
      return;
    }
    fetchBookings();
  }, [user, profile, navigate]);

  useEffect(() => {
    filterBookings();
  }, [bookings, activeTab, searchTerm]);

  const fetchBookings = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data: bookingsData, error } = await supabase
        .from("bookings")
        .select(`
          id,
          status,
          created_at,
          start_date,
          end_date,
          notes,
          vacation_posts!inner (
            title,
            location,
            speciality,
            doctor_id
          ),
          establishment_profiles!inner (
            id,
            name,
            avatar_url,
            email,
            phone
          )
        `)
        .eq("vacation_posts.doctor_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const formattedBookings: Booking[] = (bookingsData || []).map((booking: any) => ({
        id: booking.id,
        status: booking.status,
        created_at: booking.created_at,
        start_date: booking.start_date,
        end_date: booking.end_date,
        establishment_name: booking.establishment_profiles.name,
        establishment_avatar: booking.establishment_profiles.avatar_url,
        establishment_email: booking.establishment_profiles.email,
        establishment_phone: booking.establishment_profiles.phone,
        vacation_title: booking.vacation_posts.title,
        vacation_location: booking.vacation_posts.location,
        vacation_speciality: booking.vacation_posts.speciality,
        notes: booking.notes,
        establishment_id: booking.establishment_profiles.id,
      }));

      setBookings(formattedBookings);
      calculateStats(formattedBookings);
    } catch (error) {
      logger.error("Error fetching bookings:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les réservations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (bookingsData: Booking[]) => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const stats = {
      total: bookingsData.length,
      pending: bookingsData.filter(b => b.status === "pending").length,
      confirmed: bookingsData.filter(b => b.status === "confirmed").length,
      completed: bookingsData.filter(b => b.status === "completed").length,
      cancelled: bookingsData.filter(b => b.status === "cancelled").length,
      weeklyRevenue: 0,
      monthlyRevenue: 0,
      averageRating: 4.8, // À calculer depuis les reviews
      responseTime: "2h",
    };

    setStats(stats);
  };

  const filterBookings = () => {
    let filtered = bookings;

    // Filtrer par onglet
    if (activeTab !== "all") {
      filtered = filtered.filter(booking => booking.status === activeTab);
    }

    // Filtrer par recherche
    if (searchTerm) {
      filtered = filtered.filter(booking =>
        booking.establishment_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.vacation_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.vacation_location.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredBookings(filtered);
  };

  const handleBookingAction = async (bookingId: string, action: "accept" | "reject", message?: string) => {
    try {
      const newStatus = action === "accept" ? "confirmed" : "cancelled";
      
      const { error } = await supabase
        .from("bookings")
        .update({ 
          status: newStatus,
          response_message: message || null,
          responded_at: new Date().toISOString()
        })
        .eq("id", bookingId);

      if (error) throw error;

      // Mettre à jour localement
      setBookings(prev => prev.map(booking => 
        booking.id === bookingId 
          ? { ...booking, status: newStatus as any }
          : booking
      ));

      toast({
        title: "Succès",
        description: `Réservation ${action === "accept" ? "acceptée" : "refusée"} avec succès`,
      });

      setShowResponseModal(false);
      setResponseMessage("");
      setSelectedBooking(null);
      setActionType(null);
    } catch (error) {
      logger.error("Error updating booking:", error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour la réservation",
        variant: "destructive",
      });
    }
  };

  const openResponseModal = (booking: Booking, action: "accept" | "reject") => {
    setSelectedBooking(booking);
    setActionType(action);
    setShowResponseModal(true);
    setResponseMessage("");
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("fr-FR", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "confirmed":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      case "in_progress":
        return "bg-purple-100 text-purple-800 border-purple-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return "⏳ En attente";
      case "confirmed":
        return "✅ Confirmée";
      case "completed":
        return "✔️ Terminée";
      case "cancelled":
        return "❌ Annulée";
      case "in_progress":
        return "🔄 En cours";
      default:
        return "❓ Inconnu";
    }
  };

  if (!user || profile?.user_type !== "doctor") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* En-tête */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/doctor/dashboard")}
            className="mb-4 hover:bg-white/50"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour au dashboard
          </Button>

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Mes réservations
              </h1>
              <p className="text-gray-600">
                Gérez les demandes de réservation de vos vacations
              </p>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="border-gray-300 hover:bg-gray-50">
                <Download className="w-4 h-4 mr-2" />
                Exporter
              </Button>
              <Button variant="outline" className="border-gray-300 hover:bg-gray-50">
                <BarChart3 className="w-4 h-4 mr-2" />
                Rapports
              </Button>
            </div>
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-4 mb-8">
          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Total
                </CardTitle>
                <Calendar className="w-4 h-4 text-medical-blue" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold text-gray-900">
                {loading ? "..." : stats.total}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">
                  En attente
                </CardTitle>
                <AlertCircle className="w-4 h-4 text-yellow-600" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold text-yellow-600">
                {loading ? "..." : stats.pending}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Confirmées
                </CardTitle>
                <CheckCircle2 className="w-4 h-4 text-medical-blue" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold text-medical-blue">
                {loading ? "..." : stats.confirmed}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Terminées
                </CardTitle>
                <CheckCircle2 className="w-4 h-4 text-medical-green" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold text-medical-green">
                {loading ? "..." : stats.completed}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Revenus (mois)
                </CardTitle>
                
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold text-medical-green">
                {loading ? "..." : "-"}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Revenus (semaine)
                </CardTitle>
                <TrendingUp className="w-4 h-4 text-medical-green" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold text-medical-green">
                {loading ? "..." : "-"}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Note moyenne
                </CardTitle>
                <Star className="w-4 h-4 text-yellow-600" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold text-yellow-600">
                {loading ? "..." : stats.averageRating}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Temps réponse
                </CardTitle>
                <Clock className="w-4 h-4 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold text-purple-600">
                {loading ? "..." : stats.responseTime}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Contenu principal */}
        <Card className="shadow-sm">
          <CardHeader className="border-b border-gray-100">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <CardTitle className="text-xl font-bold text-gray-900">
                Liste des réservations
              </CardTitle>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Rechercher une réservation..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
                <Button variant="outline" size="sm">
                  <Filter className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full justify-start bg-gray-50/50 p-1 m-6 mb-0">
              <TabsTrigger value="all" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Toutes ({stats.total})
              </TabsTrigger>
              <TabsTrigger value="pending" className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                En attente ({stats.pending})
              </TabsTrigger>
              <TabsTrigger value="confirmed" className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Confirmées ({stats.confirmed})
              </TabsTrigger>
              <TabsTrigger value="completed" className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Terminées ({stats.completed})
              </TabsTrigger>
              <TabsTrigger value="cancelled" className="flex items-center gap-2">
                <XCircle className="w-4 h-4" />
                Annulées ({stats.cancelled})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="p-6 pt-4">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-medical-blue"></div>
                </div>
              ) : filteredBookings.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📅</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Aucune réservation trouvée
                  </h3>
                  <p className="text-gray-600">
                    {activeTab === "all" 
                      ? "Vous n'avez pas encore reçu de demande de réservation."
                      : `Aucune réservation avec le statut "${activeTab}".`
                    }
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredBookings.map((booking) => (
                    <Card 
                      key={booking.id} 
                      className="transition-all duration-200 hover:shadow-md border border-gray-200 bg-gradient-to-r from-white to-gray-50/30"
                    >
                      <CardContent className="p-6">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-4 mb-4">
                              <Avatar className="h-12 w-12">
                                <AvatarImage src={booking.establishment_avatar} />
                                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                                  {booking.establishment_name.slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h3 className="font-bold text-lg text-gray-900">
                                    {booking.establishment_name}
                                  </h3>
                                  <Badge className={getStatusColor(booking.status)}>
                                    {getStatusLabel(booking.status)}
                                  </Badge>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600">
                                  <div className="flex items-center gap-1">
                                    <Calendar className="w-4 h-4" />
                                    <span>{formatDate(booking.start_date)} → {formatDate(booking.end_date)}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <MapPin className="w-4 h-4" />
                                    <span>{booking.vacation_location}</span>
                                  </div>
                                  {/* Aucun tarif affiché */}
                                  <div className="flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    <span>Demandé le {formatDateTime(booking.created_at)}</span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="bg-gray-50 rounded-lg p-4 mb-4">
                              <h4 className="font-medium text-gray-900 mb-2">📋 {booking.vacation_title}</h4>
                              <p className="text-sm text-gray-600">Spécialité: {booking.vacation_speciality}</p>
                              {booking.notes && (
                                <div className="mt-2">
                                  <p className="text-sm font-medium text-gray-700">Note de l'établissement:</p>
                                  <p className="text-sm text-gray-600 italic">"{booking.notes}"</p>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex flex-col gap-2 min-w-[200px]">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                setSelectedBooking(booking);
                                setShowDetailsModal(true);
                              }}
                              className="w-full border-gray-300 hover:bg-gray-50"
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              Voir détails
                            </Button>
                            
                            {booking.status === "pending" && (
                              <>
                                <Button 
                                  size="sm"
                                  onClick={() => openResponseModal(booking, "accept")}
                                  className="w-full bg-medical-green hover:bg-medical-green-dark text-white"
                                >
                                  <CheckCircle2 className="w-4 h-4 mr-2" />
                                  Accepter
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="destructive"
                                  onClick={() => openResponseModal(booking, "reject")}
                                  className="w-full"
                                >
                                  <XCircle className="w-4 h-4 mr-2" />
                                  Refuser
                                </Button>
                              </>
                            )}
                            
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="w-full border-blue-300 hover:bg-blue-50 text-medical-blue"
                            >
                              <MessageSquare className="w-4 h-4 mr-2" />
                              Contacter
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </Card>
      </div>

      {/* Modal de détails */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Détails de la réservation</DialogTitle>
            <DialogDescription>
              Informations complètes sur cette demande de réservation
            </DialogDescription>
          </DialogHeader>
          
          {selectedBooking && (
            <div className="space-y-6">
              {/* Informations establishment */}
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Établissement demandeur
                </h4>
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={selectedBooking.establishment_avatar} />
                    <AvatarFallback>
                      {selectedBooking.establishment_name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h5 className="font-medium">{selectedBooking.establishment_name}</h5>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Mail className="w-4 h-4" />
                        <span>{selectedBooking.establishment_email}</span>
                      </div>
                      {selectedBooking.establishment_phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="w-4 h-4" />
                          <span>{selectedBooking.establishment_phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Informations vacation */}
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Vacation concernée
                </h4>
                <div className="space-y-2">
                  <p><span className="font-medium">Titre:</span> {selectedBooking.vacation_title}</p>
                  <p><span className="font-medium">Spécialité:</span> {selectedBooking.vacation_speciality}</p>
                  <p><span className="font-medium">Lieu:</span> {selectedBooking.vacation_location}</p>
                  <p><span className="font-medium">Période:</span> {formatDate(selectedBooking.start_date)} → {formatDate(selectedBooking.end_date)}</p>
                </div>
              </div>

              {/* Informations financières */}
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Informations financières
                </h4>
                <div className="space-y-2">
                  {/* Montant géré en dehors de la plateforme */}
                  <p><span className="font-medium">Statut paiement:</span> 
                    {/* Statut de paiement non géré */}
                  </p>
                </div>
              </div>

              {/* Notes */}
              {selectedBooking.notes && (
                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Message de l'établissement
                  </h4>
                  <p className="text-gray-700 italic">"{selectedBooking.notes}"</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de réponse */}
      <Dialog open={showResponseModal} onOpenChange={setShowResponseModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "accept" ? "Accepter la réservation" : "Refuser la réservation"}
            </DialogTitle>
            <DialogDescription>
              {actionType === "accept" 
                ? "Vous êtes sur le point d'accepter cette demande de réservation."
                : "Veuillez indiquer la raison du refus pour informer l'établissement."
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="response">
                {actionType === "accept" ? "Message de confirmation (optionnel)" : "Raison du refus"}
              </Label>
              <Textarea
                id="response"
                placeholder={actionType === "accept" 
                  ? "Ajouter un message pour l'établissement..." 
                  : "Expliquez pourquoi vous refusez cette demande..."
                }
                value={responseMessage}
                onChange={(e) => setResponseMessage(e.target.value)}
                rows={4}
              />
            </div>
            
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setShowResponseModal(false)}>
                Annuler
              </Button>
              <Button 
                onClick={() => handleBookingAction(selectedBooking?.id || "", actionType || "accept", responseMessage)}
                className={actionType === "accept" ? "bg-medical-green hover:bg-medical-green-dark" : ""}
                variant={actionType === "reject" ? "destructive" : "default"}
              >
                <Send className="w-4 h-4 mr-2" />
                {actionType === "accept" ? "Accepter" : "Refuser"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DoctorBookings;
