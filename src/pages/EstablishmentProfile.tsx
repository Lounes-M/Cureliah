import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Building, MapPin, Phone, Mail, FileText, Calendar, Users, TrendingUp, ArrowLeft, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client.browser';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';

interface EstablishmentProfile {
  id: string;
  name: string;
  establishment_type?: string;
  description?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  siret?: string;
  logo_url?: string;
  is_verified: boolean;
}

interface ProfileStats {
  totalBookings: number;
  activeBookings: number;
  completedBookings: number;
  totalSpent: number;
}

const EstablishmentProfile = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [establishmentProfile, setEstablishmentProfile] = useState<EstablishmentProfile | null>(null);
  const [stats, setStats] = useState<ProfileStats>({
    totalBookings: 0,
    activeBookings: 0,
    completedBookings: 0,
    totalSpent: 0
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    establishment_type: '',
    description: '',
    address: '',
    city: '',
    postal_code: '',
    siret: ''
  });
  const [bookings, setBookings] = useState<any[]>([]);

  useEffect(() => {
    if (!user || !profile) {
      navigate('/auth?type=establishment');
      return;
    }

    if (profile.user_type !== 'establishment') {
      navigate('/doctor/dashboard');
      return;
    }

    fetchEstablishmentProfile();
    fetchStats();
  }, [user, profile, navigate]);

  const fetchEstablishmentProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('establishment_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setEstablishmentProfile(data);
        setFormData({
          name: data.name || '',
          establishment_type: data.establishment_type || '',
          description: data.description || '',
          address: data.address || '',
          city: data.city || '',
          postal_code: data.postal_code || '',
          siret: data.siret || ''
        });
      }
    } catch (error: any) {
      logger.error('Error fetching establishment profile:', error, {}, 'Auto', 'todo_replaced');
      toast({
        title: "Erreur",
        description: "Impossible de charger le profil",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    if (!user) return;

    try {
      const { data: bookingsData, error } = await supabase
        .from('vacation_bookings')
        .select('id, status, start_date, end_date, vacation_title')
        .eq('establishment_id', user.id)
        .order('start_date', { ascending: false });

      if (error) throw error;

      setBookings(bookingsData || []);

      const stats = {
        totalBookings: bookingsData?.length || 0,
        activeBookings: bookingsData?.filter(b => b.status === 'booked').length || 0,
        completedBookings: bookingsData?.filter(b => b.status === 'completed').length || 0,
        totalSpent: 0
      };

      setStats(stats);
    } catch (error: any) {
      logger.error('Error fetching stats:', error, {}, 'Auto', 'todo_replaced');
      toast({
        title: "Erreur",
        description: "Impossible de charger les réservations",
        variant: "destructive"
      });
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('establishment_profiles')
        .upsert({
          id: user.id,
          ...formData
        });

      if (error) throw error;

      toast({
        title: "Profil mis à jour",
        description: "Vos informations ont été sauvegardées avec succès",
      });

      await fetchEstablishmentProfile();
    } catch (error: any) {
      logger.error('Error saving profile:', error, {}, 'Auto', 'todo_replaced');
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder le profil",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="flex items-center justify-center h-96">
          <div className="text-lg">Chargement du profil...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/establishment/dashboard')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour au tableau de bord
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Profil Établissement</h1>
          <p className="text-gray-600">Gérez les informations de votre établissement</p>
        </div>

        <div className="space-y-6">
          {/* Statistiques */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5 text-medical-blue" />
                  <div>
                    <p className="text-sm text-gray-600">Total réservations</p>
                    <p className="text-2xl font-bold">{stats.totalBookings}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Users className="w-5 h-5 text-medical-green" />
                  <div>
                    <p className="text-sm text-gray-600">Actives</p>
                    <p className="text-2xl font-bold">{stats.activeBookings}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-medical-green" />
                  <div>
                    <p className="text-sm text-gray-600">Terminées</p>
                    <p className="text-2xl font-bold">{stats.completedBookings}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Building className="w-5 h-5 text-yellow-600" />
                  <div>
                    <p className="text-sm text-gray-600">Total dépensé</p>
                    <p className="text-2xl font-bold">{stats.totalSpent}€</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Statut de vérification */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <Building className="w-5 h-5" />
                  <span>Statut du profil</span>
                </CardTitle>
                {establishmentProfile?.is_verified ? (
                  <Badge className="bg-green-100 text-green-800">
                    Vérifié
                  </Badge>
                ) : (
                  <Badge variant="secondary">
                    En attente de vérification
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {establishmentProfile?.is_verified ? (
                <p className="text-green-700">
                  Votre établissement a été vérifié et peut recevoir toutes les fonctionnalités de la plateforme.
                </p>
              ) : (
                <div className="space-y-2">
                  <p className="text-amber-700">
                    Votre profil est en cours de vérification. Complétez toutes les informations pour accélérer le processus.
                  </p>
                  <p className="text-sm text-gray-600">
                    Les établissements vérifiés ont plus de chances d'obtenir des réponses positives de la part des médecins.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Informations de base */}
          <Card>
            <CardHeader>
              <CardTitle>Informations générales</CardTitle>
              <CardDescription>
                Informations principales de votre établissement
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom de l'établissement *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => updateFormData('name', e.target.value)}
                    placeholder="Nom de votre établissement"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="establishment_type">Type d'établissement</Label>
                  <Input
                    id="establishment_type"
                    value={formData.establishment_type}
                    onChange={(e) => updateFormData('establishment_type', e.target.value)}
                    placeholder="Ex: Clinique, Hôpital, Cabinet..."
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => updateFormData('description', e.target.value)}
                  placeholder="Décrivez votre établissement, vos spécialités, votre équipe..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Adresse */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MapPin className="w-5 h-5" />
                <span>Adresse</span>
              </CardTitle>
              <CardDescription>
                Localisation de votre établissement
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="address">Adresse</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => updateFormData('address', e.target.value)}
                  placeholder="Numéro et nom de rue"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">Ville</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => updateFormData('city', e.target.value)}
                    placeholder="Ville"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="postal_code">Code postal</Label>
                  <Input
                    id="postal_code"
                    value={formData.postal_code}
                    onChange={(e) => updateFormData('postal_code', e.target.value)}
                    placeholder="Code postal"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Informations légales */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="w-5 h-5" />
                <span>Informations légales</span>
              </CardTitle>
              <CardDescription>
                Informations administratives et légales
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="siret">Numéro SIRET</Label>
                <Input
                  id="siret"
                  value={formData.siret}
                  onChange={(e) => updateFormData('siret', e.target.value)}
                  placeholder="Numéro SIRET de l'établissement"
                />
                <p className="text-xs text-gray-500">
                  Le SIRET est requis pour la vérification de votre établissement
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Réservations récentes */}
          <Card>
            <CardHeader>
              <CardTitle>Réservations récentes</CardTitle>
              <CardDescription>
                Historique des dernières réservations de l’établissement
              </CardDescription>
            </CardHeader>
            <CardContent>
              {bookings.length === 0 ? (
                <div className="text-gray-500">Aucune réservation pour le moment.</div>
              ) : (
                <div className="space-y-2">
                  {bookings.slice(0, 5).map((booking) => (
                    <div key={booking.id} className="flex flex-col md:flex-row md:items-center md:justify-between border-b py-2 gap-2">
                      <div>
                        <div className="font-medium">{booking.vacation_title || 'Vacance'}</div>
                        <div className="text-xs text-gray-500">
                          {booking.start_date ? new Date(booking.start_date).toLocaleDateString('fr-FR') : ''}
                          {booking.end_date ? ' - ' + new Date(booking.end_date).toLocaleDateString('fr-FR') : ''}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={
                          booking.status === 'booked' ? 'bg-blue-100 text-blue-800' :
                          booking.status === 'completed' ? 'bg-green-100 text-green-800' :
                          booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }>
                          {booking.status === 'booked' ? 'Active' :
                           booking.status === 'completed' ? 'Terminée' :
                           booking.status === 'pending' ? 'En attente' :
                           booking.status === 'cancelled' ? 'Annulée' :
                           booking.status}
                        </Badge>
                        {/* Paiement géré en dehors de Cureliah */}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end space-x-4">
            <Button variant="outline" onClick={() => navigate('/establishment/dashboard')}>
              Annuler
            </Button>
            <Button 
              onClick={handleSave}
              disabled={saving || !formData.name}
              className="bg-medical-green hover:bg-medical-green-dark"
            >
              {saving ? 'Sauvegarde...' : 'Sauvegarder'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EstablishmentProfile;
