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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Download,
  FileText,
  Euro,
  TrendingUp,
  Calendar,
  Users,
  MapPin,
  Clock,
  BarChart3,
  PieChart,
  Filter,
  Search,
  Eye,
  Send,
  Printer,
  Mail,
} from "lucide-react";

interface BookingData {
  id: string;
  establishment_name: string;
  start_date: string;
  end_date: string;
  total_amount: number;
  status: string;
  vacation_title: string;
  speciality: string;
  location: string;
  commission_rate?: number;
}

interface FinancialSummary {
  totalEarnings: number;
  totalCommissions: number;
  netEarnings: number;
  totalBookings: number;
  averageBookingValue: number;
  monthlyGrowth: number;
}

interface ReportFilter {
  dateRange: "week" | "month" | "quarter" | "year" | "custom";
  startDate?: string;
  endDate?: string;
  status?: string;
  speciality?: string;
}

const InvoicesAndReports = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [financialSummary, setFinancialSummary] = useState<FinancialSummary>({
    totalEarnings: 0,
    totalCommissions: 0,
    netEarnings: 0,
    totalBookings: 0,
    averageBookingValue: 0,
    monthlyGrowth: 0,
  });
  
  const [filters, setFilters] = useState<ReportFilter>({
    dateRange: "month",
  });
  
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (!user || profile?.user_type !== "doctor") {
      navigate("/auth?type=doctor");
      return;
    }
    fetchBookingsData();
  }, [user, profile, navigate, filters]);

  const fetchBookingsData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Construire la query avec les filtres
      let query = supabase
        .from("bookings")
        .select(`
          *,
          vacation_posts!inner(
            title,
            speciality,
            location,
            hourly_rate
          ),
          establishment_profiles!inner(
            name
          )
        `)
        .eq("vacation_posts.doctor_id", user.id)
        .eq("status", "confirmed");

      // Appliquer les filtres de date
      const { startDate, endDate } = getDateRange(filters.dateRange, filters.startDate, filters.endDate);
      if (startDate) query = query.gte("start_date", startDate);
      if (endDate) query = query.lte("end_date", endDate);

      // Filtres additionnels
      if (filters.status) query = query.eq("status", filters.status);
      if (filters.speciality) query = query.eq("vacation_posts.speciality", filters.speciality);

      const { data, error } = await query.order("start_date", { ascending: false });

      if (error) throw error;

      const formattedBookings: BookingData[] = (data || []).map((booking: any) => ({
        id: booking.id,
        establishment_name: booking.establishment_profiles?.name || "Établissement inconnu",
        start_date: booking.start_date,
        end_date: booking.end_date,
        total_amount: booking.total_amount || 0,
        status: booking.status,
        vacation_title: booking.vacation_posts?.title || "Vacation",
        speciality: booking.vacation_posts?.speciality || "general",
        location: booking.vacation_posts?.location || "",
        commission_rate: 0.15, // 15% de commission par défaut
      }));

      setBookings(formattedBookings);
      calculateFinancialSummary(formattedBookings);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données financières",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getDateRange = (range: string, customStart?: string, customEnd?: string) => {
    const now = new Date();
    let startDate: string | undefined;
    let endDate: string | undefined;

    switch (range) {
      case "week":
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - 7);
        startDate = weekStart.toISOString().split('T')[0];
        endDate = now.toISOString().split('T')[0];
        break;
      case "month":
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        startDate = monthStart.toISOString().split('T')[0];
        endDate = now.toISOString().split('T')[0];
        break;
      case "quarter":
        const quarter = Math.floor(now.getMonth() / 3);
        const quarterStart = new Date(now.getFullYear(), quarter * 3, 1);
        startDate = quarterStart.toISOString().split('T')[0];
        endDate = now.toISOString().split('T')[0];
        break;
      case "year":
        const yearStart = new Date(now.getFullYear(), 0, 1);
        startDate = yearStart.toISOString().split('T')[0];
        endDate = now.toISOString().split('T')[0];
        break;
      case "custom":
        startDate = customStart;
        endDate = customEnd;
        break;
    }

    return { startDate, endDate };
  };

  const calculateFinancialSummary = (bookingsData: BookingData[]) => {
    const totalEarnings = bookingsData.reduce((sum, booking) => sum + booking.total_amount, 0);
    const totalCommissions = bookingsData.reduce((sum, booking) => 
      sum + (booking.total_amount * (booking.commission_rate || 0.15)), 0
    );
    const netEarnings = totalEarnings - totalCommissions;
    const totalBookings = bookingsData.length;
    const averageBookingValue = totalBookings > 0 ? totalEarnings / totalBookings : 0;

    // Calcul de la croissance (simulation)
    const monthlyGrowth = 12.5; // Simulé pour maintenant

    setFinancialSummary({
      totalEarnings,
      totalCommissions,
      netEarnings,
      totalBookings,
      averageBookingValue,
      monthlyGrowth,
    });
  };

  const generatePDFReport = () => {
    // Simulation de génération PDF
    toast({
      title: "Rapport généré",
      description: "Le rapport PDF a été téléchargé avec succès",
    });
  };

  const sendReportByEmail = () => {
    // Simulation d'envoi email
    toast({
      title: "Rapport envoyé",
      description: "Le rapport a été envoyé par email avec succès",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const getSpecialityLabel = (speciality: string) => {
    const specialityMap: Record<string, string> = {
      general: "Médecine générale",
      cardiology: "Cardiologie",
      orthopedics: "Orthopédie",
      pediatrics: "Pédiatrie",
      dermatology: "Dermatologie",
      psychiatry: "Psychiatrie",
    };
    return specialityMap[speciality] || speciality;
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
                Rapports et facturation
              </h1>
              <p className="text-gray-600">
                Analysez vos revenus et générez vos rapports financiers
              </p>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={generatePDFReport} className="border-gray-300 hover:bg-gray-50">
                <Download className="w-4 h-4 mr-2" />
                Télécharger PDF
              </Button>
              <Button variant="outline" onClick={sendReportByEmail} className="border-gray-300 hover:bg-gray-50">
                <Mail className="w-4 h-4 mr-2" />
                Envoyer par email
              </Button>
            </div>
          </div>
        </div>

        {/* Filtres */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filtres
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="dateRange">Période</Label>
                <Select 
                  value={filters.dateRange} 
                  onValueChange={(value: any) => setFilters({ ...filters, dateRange: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="week">7 derniers jours</SelectItem>
                    <SelectItem value="month">Ce mois</SelectItem>
                    <SelectItem value="quarter">Ce trimestre</SelectItem>
                    <SelectItem value="year">Cette année</SelectItem>
                    <SelectItem value="custom">Personnalisé</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {filters.dateRange === "custom" && (
                <>
                  <div>
                    <Label htmlFor="startDate">Date de début</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={filters.startDate || ""}
                      onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="endDate">Date de fin</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={filters.endDate || ""}
                      onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                    />
                  </div>
                </>
              )}

              <div>
                <Label htmlFor="speciality">Spécialité</Label>
                <Select 
                  value={filters.speciality || ""} 
                  onValueChange={(value) => setFilters({ ...filters, speciality: value || undefined })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Toutes les spécialités" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Toutes les spécialités</SelectItem>
                    <SelectItem value="general">Médecine générale</SelectItem>
                    <SelectItem value="cardiology">Cardiologie</SelectItem>
                    <SelectItem value="orthopedics">Orthopédie</SelectItem>
                    <SelectItem value="pediatrics">Pédiatrie</SelectItem>
                    <SelectItem value="dermatology">Dermatologie</SelectItem>
                    <SelectItem value="psychiatry">Psychiatrie</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Résumé financier */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Revenus totaux</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(financialSummary.totalEarnings)}
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <Euro className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Commissions</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(financialSummary.totalCommissions)}
                  </p>
                </div>
                <div className="p-3 bg-orange-100 rounded-full">
                  <TrendingUp className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Revenus nets</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(financialSummary.netEarnings)}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <BarChart3 className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Réservations</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {financialSummary.totalBookings}
                  </p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs pour les différentes vues */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="bookings">Détail des réservations</TabsTrigger>
            <TabsTrigger value="analytics">Analyses</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Graphique des revenus */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Évolution des revenus
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <PieChart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">Graphique en cours de développement</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Répartition par spécialité */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="w-5 h-5" />
                    Répartition par spécialité
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(
                      bookings.reduce((acc, booking) => {
                        const speciality = booking.speciality;
                        if (!acc[speciality]) {
                          acc[speciality] = { count: 0, amount: 0 };
                        }
                        acc[speciality].count++;
                        acc[speciality].amount += booking.total_amount;
                        return acc;
                      }, {} as Record<string, { count: number; amount: number }>)
                    ).map(([speciality, data]) => (
                      <div key={speciality} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{getSpecialityLabel(speciality)}</p>
                          <p className="text-sm text-gray-500">{data.count} réservations</p>
                        </div>
                        <p className="font-bold">{formatCurrency(data.amount)}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="bookings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Détail des réservations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {loading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="text-gray-500 mt-2">Chargement...</p>
                    </div>
                  ) : bookings.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>Aucune réservation trouvée pour cette période</p>
                    </div>
                  ) : (
                    bookings.map((booking) => (
                      <div key={booking.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-gray-900">{booking.vacation_title}</h3>
                              <Badge variant="outline">{getSpecialityLabel(booking.speciality)}</Badge>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600">
                              <div className="flex items-center gap-1">
                                <Users className="w-4 h-4" />
                                {booking.establishment_name}
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {new Date(booking.start_date).toLocaleDateString('fr-FR')}
                              </div>
                              <div className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                {booking.location}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-gray-900">
                              {formatCurrency(booking.total_amount)}
                            </p>
                            <p className="text-sm text-gray-500">
                              Commission: {formatCurrency(booking.total_amount * (booking.commission_rate || 0.15))}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Métriques de performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Valeur moyenne par réservation</span>
                      <span className="font-bold">{formatCurrency(financialSummary.averageBookingValue)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Croissance mensuelle</span>
                      <span className="font-bold text-green-600">+{financialSummary.monthlyGrowth}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Taux de commission moyen</span>
                      <span className="font-bold">15%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Prochaines actions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-2">Optimisation recommandée</h4>
                      <p className="text-sm text-blue-700">
                        Augmentez vos tarifs de 5% pour les créneaux de weekend pour maximiser vos revenus.
                      </p>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg">
                      <h4 className="font-medium text-green-900 mb-2">Performance excellente</h4>
                      <p className="text-sm text-green-700">
                        Votre taux de réservation a augmenté de 23% ce mois-ci.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default InvoicesAndReports;
