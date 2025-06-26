import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client.browser';
import { useToast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Search, Plus, Calendar as CalendarIcon, Clock, MapPin, User, Building2 } from 'lucide-react';

interface Vacation {
  id: string;
  doctor_id: string;
  establishment_id: string;
  start_date: string;
  end_date: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  created_at: string;
  doctor: {
    first_name: string;
    last_name: string;
    specialty: string;
  };
  establishment: {
    name: string;
    address: string;
  };
}

export default function VacationManagement() {
  const [vacations, setVacations] = useState<Vacation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [selectedEstablishment, setSelectedEstablishment] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState('');
  const [doctors, setDoctors] = useState<Array<{ id: string; name: string }>>([]);
  const [establishments, setEstablishments] = useState<Array<{ id: string; name: string }>>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchVacations();
    fetchDoctors();
    fetchEstablishments();
  }, []);

  const fetchVacations = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('vacations')
        .select(`
          *,
          doctor:profiles!doctor_id(first_name, last_name, specialty),
          establishment:profiles!establishment_id(name, address)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setVacations(data || []);
    } catch (error) {
      console.error('Error fetching vacations:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les vacations",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctors = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .eq('user_type', 'doctor')
        .eq('is_active', true);

      if (error) throw error;

      setDoctors(data.map(doctor => ({
        id: doctor.id,
        name: `${doctor.first_name} ${doctor.last_name}`
      })));
    } catch (error) {
      console.error('Error fetching doctors:', error);
    }
  };

  const fetchEstablishments = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name')
        .eq('user_type', 'establishment')
        .eq('is_active', true);

      if (error) throw error;

      setEstablishments(data.map(establishment => ({
        id: establishment.id,
        name: establishment.name
      })));
    } catch (error) {
      console.error('Error fetching establishments:', error);
    }
  };

  const handleStatusChange = async (vacationId: string, newStatus: Vacation['status']) => {
    try {
      const { error } = await supabase
        .from('vacations')
        .update({ status: newStatus })
        .eq('id', vacationId);

      if (error) throw error;

      setVacations(vacations.map(vacation =>
        vacation.id === vacationId ? { ...vacation, status: newStatus } : vacation
      ));

      toast({
        title: "Succès",
        description: "Statut de la vacation mis à jour",
      });
    } catch (error) {
      console.error('Error updating vacation status:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut",
        variant: "destructive"
      });
    }
  };

  const handleAddVacation = async () => {
    if (!selectedDoctor || !selectedEstablishment || !selectedDate || !selectedTime) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs",
        variant: "destructive"
      });
      return;
    }

    try {
      const [hours, minutes] = selectedTime.split(':');
      const startDate = new Date(selectedDate);
      startDate.setHours(parseInt(hours), parseInt(minutes));

      const { error } = await supabase
        .from('vacations')
        .insert({
          doctor_id: selectedDoctor,
          establishment_id: selectedEstablishment,
          start_date: startDate.toISOString(),
          end_date: new Date(startDate.getTime() + 4 * 60 * 60 * 1000).toISOString(), // 4 heures par défaut
          status: 'pending'
        });

      if (error) throw error;

      setShowAddDialog(false);
      fetchVacations();
      toast({
        title: "Succès",
        description: "Vacation ajoutée avec succès",
      });
    } catch (error) {
      console.error('Error adding vacation:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter la vacation",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: Vacation['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: Vacation['status']) => {
    switch (status) {
      case 'pending':
        return 'En attente';
      case 'confirmed':
        return 'Confirmée';
      case 'cancelled':
        return 'Annulée';
      case 'completed':
        return 'Terminée';
      default:
        return status;
    }
  };

  const filteredVacations = vacations.filter(vacation => {
    const searchLower = searchQuery.toLowerCase();
    return (
      vacation.doctor.first_name.toLowerCase().includes(searchLower) ||
      vacation.doctor.last_name.toLowerCase().includes(searchLower) ||
      vacation.establishment.name.toLowerCase().includes(searchLower) ||
      vacation.establishment.address.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher une vacation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
          />
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter une vacation
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ajouter une nouvelle vacation</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Médecin</label>
                <Select value={selectedDoctor} onValueChange={setSelectedDoctor}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un médecin" />
                  </SelectTrigger>
                  <SelectContent>
                    {doctors.map(doctor => (
                      <SelectItem key={doctor.id} value={doctor.id}>
                        {doctor.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Établissement</label>
                <Select value={selectedEstablishment} onValueChange={setSelectedEstablishment}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un établissement" />
                  </SelectTrigger>
                  <SelectContent>
                    {establishments.map(establishment => (
                      <SelectItem key={establishment.id} value={establishment.id}>
                        {establishment.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Date</label>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  locale={fr}
                  className="rounded-md border"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Heure</label>
                <Input
                  type="time"
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                />
              </div>
              <Button onClick={handleAddVacation} className="w-full">
                Ajouter
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Médecin</TableHead>
              <TableHead>Spécialité</TableHead>
              <TableHead>Établissement</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  Chargement...
                </TableCell>
              </TableRow>
            ) : filteredVacations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  Aucune vacation trouvée
                </TableCell>
              </TableRow>
            ) : (
              filteredVacations.map((vacation) => (
                <TableRow key={vacation.id}>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>{`${vacation.doctor.first_name} ${vacation.doctor.last_name}`}</span>
                    </div>
                  </TableCell>
                  <TableCell>{vacation.doctor.specialty}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div>{vacation.establishment.name}</div>
                        <div className="text-sm text-muted-foreground flex items-center">
                          <MapPin className="h-3 w-3 mr-1" />
                          {vacation.establishment.address}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div>{format(new Date(vacation.start_date), 'dd MMM yyyy', { locale: fr })}</div>
                        <div className="text-sm text-muted-foreground flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {format(new Date(vacation.start_date), 'HH:mm', { locale: fr })}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(vacation.status)}`}>
                      {getStatusText(vacation.status)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={vacation.status}
                      onValueChange={(value: Vacation['status']) => handleStatusChange(vacation.id, value)}
                    >
                      <SelectTrigger className="w-[130px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">En attente</SelectItem>
                        <SelectItem value="confirmed">Confirmée</SelectItem>
                        <SelectItem value="cancelled">Annulée</SelectItem>
                        <SelectItem value="completed">Terminée</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}