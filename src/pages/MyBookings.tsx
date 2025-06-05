import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Calendar,
  Clock,
  DollarSign,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Loader2,
  BarChart3,
  TrendingUp,
  Star,
  Download,
} from "lucide-react";
import BookingManagement from "@/components/BookingManagement";
import EstablishmentBookingManagement from "@/components/EstablishmentBookingManagement";
import Header from "@/components/Header";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface BookingStats {
  active: number;
  pending: number;
  completed: number;
  cancelled: number;
  totalRevenue: number;
  monthlyRevenue: number;
  averageRating: number;
}

const MyBookings = () => {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("active");
  const [stats, setStats] = useState<BookingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadBookingStats();
    }
  }, [user]);

  const loadBookingStats = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      let query;
      if (profile?.user_type === "doctor") {
        // Pour les médecins : récupérer les bookings via vacation_posts.doctor_id
        query = supabase
          .from("vacation_bookings")
          .select(
            `
            status,
            total_amount,
            created_at,
            vacation_posts!vacation_bookings_vacation_post_id_fkey(
              doctor_id
            )
          `
          )
          .eq("vacation_posts.doctor_id", user.id);
      } else {
        // Pour les établissements : récupérer les bookings via vacation_posts.establishment_id
        query = supabase
          .from("vacation_bookings")
          .select(
            `
            status,
            total_amount,
            created_at,
            vacation_posts!vacation_bookings_vacation_post_id_fkey(
              establishment_id
            )
          `
          )
          .eq("vacation_posts.establishment_id", user.id);
      }

      const { data: bookings, error } = await query;

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }

      console.log("Bookings data:", bookings);

      // Calculer les statistiques
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const active =
        bookings?.filter(
          (b) => b.status === "confirmed" || b.status === "booked"
        ).length || 0;
      const pending =
        bookings?.filter((b) => b.status === "pending").length || 0;
      const completed =
        bookings?.filter((b) => b.status === "completed").length || 0;
      const cancelled =
        bookings?.filter((b) => b.status === "cancelled").length || 0;

      const totalRevenue =
        bookings
          ?.filter((b) => b.status === "completed" || b.status === "confirmed")
          .reduce((sum, b) => sum + (b.total_amount || 0), 0) || 0;

      const monthlyRevenue =
        bookings
          ?.filter(
            (b) =>
              (b.status === "completed" || b.status === "confirmed") &&
              new Date(b.created_at) >= startOfMonth
          )
          .reduce((sum, b) => sum + (b.total_amount || 0), 0) || 0;

      // Récupérer la note moyenne (pour les médecins)
      let averageRating = 0;
      if (profile?.user_type === "doctor") {
        const { data: reviews, error: reviewError } = await supabase
          .from("reviews")
          .select("rating")
          .eq("doctor_id", user.id);

        if (reviewError) {
          console.error("Error fetching reviews:", reviewError);
        } else if (reviews && reviews.length > 0) {
          averageRating =
            reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
        }
      }

      setStats({
        active,
        pending,
        completed,
        cancelled,
        totalRevenue,
        monthlyRevenue,
        averageRating,
      });
    } catch (error) {
      console.error("Error loading booking stats:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les statistiques",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadBookingStats();
    setRefreshing(false);
    toast({
      title: "Actualisé",
      description: "Les données ont été mises à jour",
    });
  };

  const getTabIcon = (tab: string) => {
    switch (tab) {
      case "active":
        return CheckCircle2;
      case "pending":
        return Clock;
      case "completed":
        return CheckCircle2;
      case "cancelled":
        return XCircle;
      default:
        return Calendar;
    }
  };

  const getTabColor = (tab: string) => {
    switch (tab) {
      case "active":
        return "text-green-600";
      case "pending":
        return "text-orange-600";
      case "completed":
        return "text-blue-600";
      case "cancelled":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  const exportBookings = () => {
    toast({
      title: "Export en cours",
      description: "Votre rapport sera téléchargé dans quelques instants",
    });
    // Logique d'export à implémenter
  };

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        <Header />
        <div className="flex items-center justify-center h-96">
          <Card className="p-8 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
            <div className="text-lg font-medium">
              Chargement de vos réservations...
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* En-tête avec navigation */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="hover:bg-white/50"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Mes Réservations
              </h1>
              <p className="text-gray-600">
                Gérez toutes vos réservations en un seul endroit
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw
                className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
              />
              Actualiser
            </Button>
            <Button variant="outline" size="sm" onClick={exportBookings}>
              <Download className="w-4 h-4 mr-2" />
              Exporter
            </Button>
          </div>
        </div>

        {/* Statistiques */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : stats ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-600 text-sm font-medium mb-1">
                      Réservations actives
                    </p>
                    <p className="text-3xl font-bold text-green-900">
                      {stats.active}
                    </p>
                    <p className="text-xs text-green-700">En cours</p>
                  </div>
                  <div className="bg-green-600 p-3 rounded-xl">
                    <CheckCircle2 className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-600 text-sm font-medium mb-1">
                      En attente
                    </p>
                    <p className="text-3xl font-bold text-orange-900">
                      {stats.pending}
                    </p>
                    <p className="text-xs text-orange-700">À confirmer</p>
                  </div>
                  <div className="bg-orange-600 p-3 rounded-xl">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-600 text-sm font-medium mb-1">
                      Revenus du mois
                    </p>
                    <p className="text-3xl font-bold text-blue-900">
                      {stats.monthlyRevenue.toFixed(0)}€
                    </p>
                    <p className="text-xs text-blue-700 flex items-center">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      Total: {stats.totalRevenue.toFixed(0)}€
                    </p>
                  </div>
                  <div className="bg-blue-600 p-3 rounded-xl">
                    <DollarSign className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-600 text-sm font-medium mb-1">
                      {profile.user_type === "doctor"
                        ? "Note moyenne"
                        : "Terminées"}
                    </p>
                    <p className="text-3xl font-bold text-purple-900 flex items-center">
                      {profile.user_type === "doctor" ? (
                        <>
                          {stats.averageRating.toFixed(1)}
                          <Star className="w-5 h-5 text-yellow-500 ml-1" />
                        </>
                      ) : (
                        stats.completed
                      )}
                    </p>
                    <p className="text-xs text-purple-700">
                      {profile.user_type === "doctor"
                        ? "satisfaction"
                        : "réalisées"}
                    </p>
                  </div>
                  <div className="bg-purple-600 p-3 rounded-xl">
                    {profile.user_type === "doctor" ? (
                      <Star className="w-6 h-6 text-white" />
                    ) : (
                      <BarChart3 className="w-6 h-6 text-white" />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}

        {/* Onglets des réservations */}
        <Card className="shadow-sm">
          <CardContent className="p-6">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-4 bg-gray-100/50 backdrop-blur-sm">
                {[
                  {
                    value: "active",
                    label: "Actives",
                    count: stats?.active || 0,
                  },
                  {
                    value: "pending",
                    label: "En attente",
                    count: stats?.pending || 0,
                  },
                  {
                    value: "completed",
                    label: "Terminées",
                    count: stats?.completed || 0,
                  },
                  {
                    value: "cancelled",
                    label: "Annulées",
                    count: stats?.cancelled || 0,
                  },
                ].map((tab) => {
                  const IconComponent = getTabIcon(tab.value);
                  return (
                    <TabsTrigger
                      key={tab.value}
                      value={tab.value}
                      className="flex items-center space-x-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
                    >
                      <IconComponent
                        className={`w-4 h-4 ${getTabColor(tab.value)}`}
                      />
                      <span className="hidden sm:inline">{tab.label}</span>
                      <Badge variant="secondary" className="ml-1 text-xs">
                        {tab.count}
                      </Badge>
                    </TabsTrigger>
                  );
                })}
              </TabsList>

              <div className="mt-6">
                <TabsContent value="active" className="mt-0">
                  {profile.user_type === "doctor" ? (
                    <BookingManagement status="booked" />
                  ) : (
                    <EstablishmentBookingManagement status="booked" />
                  )}
                </TabsContent>

                <TabsContent value="pending" className="mt-0">
                  {profile.user_type === "doctor" ? (
                    <BookingManagement status="pending" />
                  ) : (
                    <EstablishmentBookingManagement status="pending" />
                  )}
                </TabsContent>

                <TabsContent value="completed" className="mt-0">
                  {profile.user_type === "doctor" ? (
                    <BookingManagement status="completed" />
                  ) : (
                    <EstablishmentBookingManagement status="completed" />
                  )}
                </TabsContent>

                <TabsContent value="cancelled" className="mt-0">
                  {profile.user_type === "doctor" ? (
                    <BookingManagement status="cancelled" />
                  ) : (
                    <EstablishmentBookingManagement status="cancelled" />
                  )}
                </TabsContent>
              </div>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MyBookings;
