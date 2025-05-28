
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Plus, Eye, Pencil, Trash2, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import { VacationPost } from '@/types/database';
import { getSpecialityInfo } from '@/utils/specialities';

const ManageVacations = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [vacations, setVacations] = useState<VacationPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!user || profile?.user_type !== 'doctor') {
      navigate('/auth');
      return;
    }
    fetchVacations();
  }, [user, profile]);

  const fetchVacations = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('vacation_posts')
        .select('*')
        .eq('doctor_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVacations(data || []);
    } catch (error: any) {
      console.error('Error fetching vacations:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger vos vacations",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (vacationId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette vacation ?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('vacation_posts')
        .delete()
        .eq('id', vacationId)
        .eq('doctor_id', user?.id);

      if (error) throw error;

      toast({
        title: "Vacation supprimée",
        description: "La vacation a été supprimée avec succès",
      });

      await fetchVacations();
    } catch (error: any) {
      console.error('Error deleting vacation:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la vacation",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'booked': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available': return 'Disponible';
      case 'booked': return 'Réservé';
      case 'completed': return 'Terminé';
      case 'cancelled': return 'Annulé';
      default: return 'En attente';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const filteredVacations = vacations.filter(vacation =>
    vacation.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vacation.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vacation.speciality?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="flex items-center justify-center h-96">
          <div className="text-lg">Chargement...</div>
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
            onClick={() => navigate('/doctor/dashboard')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour au dashboard
          </Button>

          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Gérer mes vacations
              </h1>
              <p className="text-gray-600">
                {vacations.length} vacation{vacations.length > 1 ? 's' : ''} au total
              </p>
            </div>
            <Button onClick={() => navigate('/doctor/create-vacation')}>
              <Plus className="w-4 h-4 mr-2" />
              Nouvelle vacation
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Mes vacations</CardTitle>
                <CardDescription>
                  Gérez toutes vos vacations publiées
                </CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <Search className="w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredVacations.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-500 mb-4">
                  {searchTerm ? 'Aucune vacation trouvée pour cette recherche' : 'Aucune vacation publiée'}
                </div>
                {!searchTerm && (
                  <Button onClick={() => navigate('/doctor/create-vacation')}>
                    <Plus className="w-4 h-4 mr-2" />
                    Créer ma première vacation
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Titre</TableHead>
                      <TableHead>Spécialité</TableHead>
                      <TableHead>Période</TableHead>
                      <TableHead>Tarif</TableHead>
                      <TableHead>Lieu</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredVacations.map((vacation) => {
                      const specialityInfo = getSpecialityInfo(vacation.speciality || '');
                      return (
                        <TableRow key={vacation.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{vacation.title}</div>
                              {vacation.description && (
                                <div className="text-sm text-gray-500 truncate max-w-xs">
                                  {vacation.description}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={specialityInfo.color}>
                              {specialityInfo.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>Du {formatDate(vacation.start_date)}</div>
                              <div>Au {formatDate(vacation.end_date)}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium">{vacation.hourly_rate}€/h</span>
                          </TableCell>
                          <TableCell>
                            {vacation.location || <span className="text-gray-400">-</span>}
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(vacation.status)}>
                              {getStatusText(vacation.status)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => navigate(`/doctor/vacation/${vacation.id}`)}
                              >
                                <Eye className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => navigate(`/doctor/vacation/${vacation.id}/edit`)}
                              >
                                <Pencil className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDelete(vacation.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ManageVacations;
