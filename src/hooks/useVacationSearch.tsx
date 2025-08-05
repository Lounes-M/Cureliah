import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useLogger } from '@/utils/logger';
import { supabase } from "@/integrations/supabase/client.browser";
import { VacationPost } from "@/types/database";
import { useGeolocation, LocationCoords } from "@/hooks/useGeolocation";

export interface SearchFilters {
  speciality: string;
  location: string;
  minRate: string;
  maxRate: string;
  startDate: string;
  endDate: string;
  radius: string; // Rayon de recherche en km
  sortBy: 'date' | 'price' | 'distance' | 'rating';
}

const useVacationSearch = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const logger = useLogger();
  const [vacations, setVacations] = useState<VacationPost[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchLoading, setSearchLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<SearchFilters>({
    speciality: "",
    location: "",
    minRate: "",
    maxRate: "",
    startDate: "",
    endDate: "",
    radius: "50", // 50km par défaut
    sortBy: "date"
  });

  const fetchVacations = useCallback(async () => {
    try {
      setSearchLoading(true);
      let query = supabase.from("vacation_posts").select(`
          *,
          time_slots(*),
          doctor_profiles(*),
          profiles(*)
        `);

      // Si l'utilisateur est un médecin, ne montrer que ses vacations
      if (user && profile?.user_type === "doctor") {
        query = query.eq("doctor_id", user.id);
      } else {
        // Sinon, ne montrer que les vacations disponibles
        query = query.eq("status", "available");
      }

      // Appliquer les filtres
      if (filters.speciality) {
        query = query.eq("speciality", filters.speciality);
      }

      if (filters.location) {
        query = query.ilike("location", `%${filters.location}%`);
      }

      if (filters.minRate) {
        query = query.gte("hourly_rate", parseFloat(filters.minRate));
      }

      if (filters.maxRate) {
        query = query.lte("hourly_rate", parseFloat(filters.maxRate));
      }

      if (filters.startDate) {
        query = query.gte("start_date", filters.startDate);
      }

      if (filters.endDate) {
        query = query.lte("end_date", filters.endDate);
      }

      // Trier par date de création
      query = query.order("created_at", { ascending: false });

      const { data, error } = await query;

      if (error) throw error;

      setVacations(data || []);
      setError(null);
    } catch (error: any) {
      logger.error("Error fetching vacations", error as Error, { filters }, 'useVacationSearch', 'fetch_error');
      setError(error instanceof Error ? error.message : String(error));
      toast({
        title: "Erreur",
        description:
          "Une erreur est survenue lors de la recherche des vacations.",
        variant: "destructive",
      });
    } finally {
      setSearchLoading(false);
      setLoading(false);
    }
  }, [filters, user, profile, toast]);

  // Mettre à jour les vacations quand les filtres changent
  useEffect(() => {
    fetchVacations();
  }, [filters, fetchVacations]);

  const handleSearch = useCallback(() => {
    fetchVacations();
  }, [fetchVacations]);

  const handleBookVacation = async (vacationId: string) => {
    if (!user) {
      toast({
        title: "Connexion requise",
        description: "Vous devez être connecté pour réserver une vacation.",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }

    try {
      const { data: vacation, error: vacationError } = await supabase
        .from("vacation_posts")
        .select("*")
        .eq("id", vacationId)
        .single();

      if (vacationError) throw vacationError;

      if (vacation.status !== "available") {
        toast({
          title: "Vacation non disponible",
          description: "Cette vacation n'est plus disponible.",
          variant: "destructive",
        });
        return;
      }

      navigate(`/vacations/${vacationId}/book`);
    } catch (error: any) {
      logger.error("Error booking vacation", error as Error, { vacationId, userId: user?.id }, 'useVacationSearch', 'booking_error');
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la réservation.",
        variant: "destructive",
      });
    }
  };

  const clearFilters = () => {
    setFilters({
      speciality: "",
      location: "",
      minRate: "",
      maxRate: "",
      startDate: "",
      endDate: "",
      radius: "50",
      sortBy: "date"
    });
  };

  return {
    vacations,
    loading,
    searchLoading,
    error,
    filters,
    setFilters,
    handleSearch,
    handleBookVacation,
    clearFilters,
  };
};

export { useVacationSearch };
