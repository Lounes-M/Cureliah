import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Search, Building2 } from 'lucide-react';

interface Establishment {
  id: string;
  email: string;
  establishment_name: string;
  address: string;
  created_at: string;
  is_active: boolean;
}

export default function EstablishmentManagement() {
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchEstablishments();
  }, []);

  const fetchEstablishments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_type', 'establishment')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEstablishments(data || []);
    } catch (error: any) {
      console.error('Error fetching establishments:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les établissements",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredEstablishments = establishments.filter(establishment => 
    establishment.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    establishment.establishment_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    establishment.address?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="relative w-72">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un établissement..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        <Button>
          <Building2 className="w-4 h-4 mr-2" />
          Ajouter un établissement
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Adresse</TableHead>
              <TableHead>Date d'inscription</TableHead>
              <TableHead>Statut</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  Chargement...
                </TableCell>
              </TableRow>
            ) : filteredEstablishments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  Aucun établissement trouvé
                </TableCell>
              </TableRow>
            ) : (
              filteredEstablishments.map((establishment) => (
                <TableRow key={establishment.id}>
                  <TableCell>{establishment.establishment_name}</TableCell>
                  <TableCell>{establishment.email}</TableCell>
                  <TableCell>{establishment.address}</TableCell>
                  <TableCell>
                    {new Date(establishment.created_at).toLocaleDateString('fr-FR')}
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      establishment.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {establishment.is_active ? 'Actif' : 'Inactif'}
                    </span>
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