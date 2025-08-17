import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client.browser';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Search, Building2, MoreHorizontal, Mail, Phone, MapPin, Shield, Ban, Check } from 'lucide-react';
import { logger } from "@/services/logger";

interface Establishment {
  id: string;
  email: string;
  establishment_name: string;
  address: string;
  phone?: string;
  website?: string;
  description?: string;
  created_at: string;
  is_active: boolean;
  is_verified: boolean;
  establishment_type?: string;
  contact_person?: string;
  license_number?: string;
}

export default function EstablishmentManagement() {
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedEstablishment, setSelectedEstablishment] = useState<Establishment | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [newEstablishment, setNewEstablishment] = useState({
    email: '',
    password: '',
    establishment_name: '',
    address: '',
    phone: '',
    website: '',
    description: '',
    establishment_type: '',
    contact_person: '',
    license_number: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchEstablishments();
  }, []);

  const fetchEstablishments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          establishment_profiles(
            establishment_name,
            establishment_type,
            address,
            phone,
            website,
            description,
            contact_person,
            license_number
          )
        `)
        .eq('user_type', 'establishment')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const formattedEstablishments = data?.map(profile => ({
        ...profile,
        establishment_name: profile.establishment_profiles?.[0]?.establishment_name || '',
        establishment_type: profile.establishment_profiles?.[0]?.establishment_type || '',
        address: profile.establishment_profiles?.[0]?.address || '',
        phone: profile.establishment_profiles?.[0]?.phone || '',
        website: profile.establishment_profiles?.[0]?.website || '',
        description: profile.establishment_profiles?.[0]?.description || '',
        contact_person: profile.establishment_profiles?.[0]?.contact_person || '',
        license_number: profile.establishment_profiles?.[0]?.license_number || ''
      })) || [];
      
      setEstablishments(formattedEstablishments);
    } catch (error: any) {
      logger.error('Error fetching establishments:', error);
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
    establishment.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    establishment.contact_person?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddEstablishment = async () => {
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newEstablishment.email,
        password: newEstablishment.password,
      });

      if (authError) throw authError;

      if (authData.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([{
            id: authData.user.id,
            email: newEstablishment.email,
            user_type: 'establishment',
            is_active: true,
            is_verified: false
          }]);

        if (profileError) throw profileError;

        const { error: establishmentError } = await supabase
          .from('establishment_profiles')
          .insert([{
            id: authData.user.id,
            establishment_name: newEstablishment.establishment_name,
            establishment_type: newEstablishment.establishment_type,
            address: newEstablishment.address,
            phone: newEstablishment.phone,
            website: newEstablishment.website,
            description: newEstablishment.description,
            contact_person: newEstablishment.contact_person,
            license_number: newEstablishment.license_number
          }]);

        if (establishmentError) throw establishmentError;

        toast({
          title: "Succès",
          description: "Établissement ajouté avec succès"
        });

        setShowAddDialog(false);
        setNewEstablishment({
          email: '',
          password: '',
          establishment_name: '',
          address: '',
          phone: '',
          website: '',
          description: '',
          establishment_type: '',
          contact_person: '',
          license_number: ''
        });
        fetchEstablishments();
      }
    } catch (error: any) {
      logger.error('Error adding establishment:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'ajouter l'établissement",
        variant: "destructive"
      });
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Succès",
        description: `Établissement ${!currentStatus ? 'activé' : 'désactivé'} avec succès`
      });

      fetchEstablishments();
    } catch (error: any) {
      logger.error('Error toggling establishment status:', error);
      toast({
        title: "Erreur",
        description: "Impossible de modifier le statut",
        variant: "destructive"
      });
    }
  };

  const handleVerify = async (id: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_verified: true })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Établissement vérifié avec succès"
      });

      fetchEstablishments();
    } catch (error: any) {
      logger.error('Error verifying establishment:', error);
      toast({
        title: "Erreur",
        description: "Impossible de vérifier l'établissement",
        variant: "destructive"
      });
    }
  };

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
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button>
              <Building2 className="w-4 h-4 mr-2" />
              Ajouter un établissement
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Ajouter un nouvel établissement</DialogTitle>
              <DialogDescription>
                Créer un compte pour un nouvel établissement de santé
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newEstablishment.email}
                  onChange={(e) => setNewEstablishment({...newEstablishment, email: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="password">Mot de passe</Label>
                <Input
                  id="password"
                  type="password"
                  value={newEstablishment.password}
                  onChange={(e) => setNewEstablishment({...newEstablishment, password: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="establishment_name">Nom de l'établissement</Label>
                <Input
                  id="establishment_name"
                  value={newEstablishment.establishment_name}
                  onChange={(e) => setNewEstablishment({...newEstablishment, establishment_name: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="establishment_type">Type d'établissement</Label>
                <Input
                  id="establishment_type"
                  value={newEstablishment.establishment_type}
                  onChange={(e) => setNewEstablishment({...newEstablishment, establishment_type: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="contact_person">Personne de contact</Label>
                <Input
                  id="contact_person"
                  value={newEstablishment.contact_person}
                  onChange={(e) => setNewEstablishment({...newEstablishment, contact_person: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="phone">Téléphone</Label>
                <Input
                  id="phone"
                  value={newEstablishment.phone}
                  onChange={(e) => setNewEstablishment({...newEstablishment, phone: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="website">Site web</Label>
                <Input
                  id="website"
                  value={newEstablishment.website}
                  onChange={(e) => setNewEstablishment({...newEstablishment, website: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="license_number">Numéro de licence</Label>
                <Input
                  id="license_number"
                  value={newEstablishment.license_number}
                  onChange={(e) => setNewEstablishment({...newEstablishment, license_number: e.target.value})}
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="address">Adresse</Label>
                <Input
                  id="address"
                  value={newEstablishment.address}
                  onChange={(e) => setNewEstablishment({...newEstablishment, address: e.target.value})}
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newEstablishment.description}
                  onChange={(e) => setNewEstablishment({...newEstablishment, description: e.target.value})}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                Annuler
              </Button>
              <Button onClick={handleAddEstablishment}>
                Ajouter l'établissement
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Adresse</TableHead>
              <TableHead>Date d'inscription</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  Chargement...
                </TableCell>
              </TableRow>
            ) : filteredEstablishments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  Aucun établissement trouvé
                </TableCell>
              </TableRow>
            ) : (
              filteredEstablishments.map((establishment) => (
                <TableRow key={establishment.id}>
                  <TableCell className="font-medium">{establishment.establishment_name}</TableCell>
                  <TableCell>{establishment.email}</TableCell>
                  <TableCell>{establishment.establishment_type}</TableCell>
                  <TableCell>{establishment.address}</TableCell>
                  <TableCell>
                    {new Date(establishment.created_at).toLocaleDateString('fr-FR')}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        establishment.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {establishment.is_active ? 'Actif' : 'Inactif'}
                      </span>
                      {establishment.is_verified && (
                        <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700">
                          Vérifié
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => {
                          setSelectedEstablishment(establishment);
                          setShowDetailsDialog(true);
                        }}>
                          Voir les détails
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleActive(establishment.id, establishment.is_active)}>
                          {establishment.is_active ? (
                            <>
                              <Ban className="h-4 w-4 mr-2" />
                              Désactiver
                            </>
                          ) : (
                            <>
                              <Check className="h-4 w-4 mr-2" />
                              Activer
                            </>
                          )}
                        </DropdownMenuItem>
                        {!establishment.is_verified && (
                          <DropdownMenuItem onClick={() => handleVerify(establishment.id)}>
                            <Shield className="h-4 w-4 mr-2" />
                            Vérifier
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Détails de l'établissement</DialogTitle>
          </DialogHeader>
          {selectedEstablishment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nom de l'établissement</Label>
                  <p className="text-sm text-gray-600">{selectedEstablishment.establishment_name}</p>
                </div>
                <div>
                  <Label>Type</Label>
                  <p className="text-sm text-gray-600">{selectedEstablishment.establishment_type}</p>
                </div>
                <div>
                  <Label>Email</Label>
                  <p className="text-sm text-gray-600">{selectedEstablishment.email}</p>
                </div>
                <div>
                  <Label>Téléphone</Label>
                  <p className="text-sm text-gray-600">{selectedEstablishment.phone || 'Non renseigné'}</p>
                </div>
                <div>
                  <Label>Personne de contact</Label>
                  <p className="text-sm text-gray-600">{selectedEstablishment.contact_person || 'Non renseigné'}</p>
                </div>
                <div>
                  <Label>Numéro de licence</Label>
                  <p className="text-sm text-gray-600">{selectedEstablishment.license_number || 'Non renseigné'}</p>
                </div>
                <div className="col-span-2">
                  <Label>Adresse</Label>
                  <p className="text-sm text-gray-600">{selectedEstablishment.address}</p>
                </div>
                <div className="col-span-2">
                  <Label>Site web</Label>
                  <p className="text-sm text-gray-600">{selectedEstablishment.website || 'Non renseigné'}</p>
                </div>
                <div className="col-span-2">
                  <Label>Description</Label>
                  <p className="text-sm text-gray-600">{selectedEstablishment.description || 'Non renseignée'}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setShowDetailsDialog(false)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}