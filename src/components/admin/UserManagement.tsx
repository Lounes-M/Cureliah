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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MoreHorizontal, Search, UserPlus, UserX, Shield, Mail, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface User {
  id: string;
  email: string;
  user_type: 'doctor' | 'establishment' | 'admin';
  first_name?: string;
  last_name?: string;
  created_at: string;
  is_active: boolean;
  is_verified: boolean;
  specialty?: string;
  establishment_name?: string;
  establishment_type?: string;
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddUserDialog, setShowAddUserDialog] = useState(false);
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    user_type: 'doctor' as 'doctor' | 'establishment' | 'admin',
    first_name: '',
    last_name: '',
    specialty: '',
    establishment_name: '',
    establishment_type: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          doctor_profiles(specialty),
          establishment_profiles(establishment_name, establishment_type)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedUsers = data?.map(user => ({
        ...user,
        specialty: user.doctor_profiles?.[0]?.specialty,
        establishment_name: user.establishment_profiles?.[0]?.establishment_name,
        establishment_type: user.establishment_profiles?.[0]?.establishment_type
      })) || [];

      setUsers(formattedUsers);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les utilisateurs",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: !currentStatus })
        .eq('id', userId);

      if (error) throw error;

      setUsers(users.map(user => 
        user.id === userId ? { ...user, is_active: !currentStatus } : user
      ));

      toast({
        title: "Succès",
        description: `Utilisateur ${currentStatus ? 'désactivé' : 'activé'} avec succès`
      });
    } catch (error: any) {
      console.error('Error toggling user status:', error);
      toast({
        title: "Erreur",
        description: "Impossible de modifier le statut de l'utilisateur",
        variant: "destructive"
      });
    }
  };

  const handleChangeUserType = async (userId: string, newType: 'doctor' | 'establishment' | 'admin') => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ user_type: newType })
        .eq('id', userId);

      if (error) throw error;

      setUsers(users.map(user => 
        user.id === userId ? { ...user, user_type: newType } : user
      ));

      toast({
        title: "Succès",
        description: "Type d'utilisateur modifié avec succès"
      });
    } catch (error: any) {
      console.error('Error changing user type:', error);
      toast({
        title: "Erreur",
        description: "Impossible de modifier le type d'utilisateur",
        variant: "destructive"
      });
    }
  };

  const handleToggleVerification = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_verified: !currentStatus })
        .eq('id', userId);

      if (error) throw error;

      setUsers(users.map(user => 
        user.id === userId ? { ...user, is_verified: !currentStatus } : user
      ));

      toast({
        title: "Succès",
        description: `Utilisateur ${currentStatus ? 'non vérifié' : 'vérifié'} avec succès`
      });
    } catch (error: any) {
      console.error('Error toggling verification:', error);
      toast({
        title: "Erreur",
        description: "Impossible de modifier le statut de vérification",
        variant: "destructive"
      });
    }
  };

  const handleAddUser = async () => {
    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newUser.email,
        password: newUser.password,
        options: {
          data: {
            user_type: newUser.user_type
          }
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        // Create profile
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            {
              id: authData.user.id,
              email: newUser.email,
              user_type: newUser.user_type,
              first_name: newUser.first_name,
              last_name: newUser.last_name,
              is_active: true,
              is_verified: true
            }
          ]);

        if (profileError) throw profileError;

        // Create specific profile
        if (newUser.user_type === 'doctor') {
          const { error: doctorError } = await supabase
            .from('doctor_profiles')
            .insert([
              {
                user_id: authData.user.id,
                specialty: newUser.specialty
              }
            ]);

          if (doctorError) throw doctorError;
        } else if (newUser.user_type === 'establishment') {
          const { error: establishmentError } = await supabase
            .from('establishment_profiles')
            .insert([
              {
                user_id: authData.user.id,
                name: newUser.establishment_name,
                type: newUser.establishment_type
              }
            ]);

          if (establishmentError) throw establishmentError;
        }

        await fetchUsers();
        setShowAddUserDialog(false);
        setNewUser({
          email: '',
          password: '',
          user_type: 'doctor',
          first_name: '',
          last_name: '',
          specialty: '',
          establishment_name: '',
          establishment_type: ''
        });

        toast({
          title: "Succès",
          description: "Utilisateur créé avec succès"
        });
      }
    } catch (error: any) {
      console.error('Error adding user:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer l'utilisateur",
        variant: "destructive"
      });
    }
  };

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.specialty?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.establishment_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="relative w-72">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un utilisateur..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        <Dialog open={showAddUserDialog} onOpenChange={setShowAddUserDialog}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="w-4 h-4 mr-2" />
              Ajouter un utilisateur
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ajouter un nouvel utilisateur</DialogTitle>
              <DialogDescription>
                Remplissez les informations pour créer un nouveau compte utilisateur.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label>Email</label>
                  <Input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label>Mot de passe</label>
                  <Input
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label>Prénom</label>
                  <Input
                    value={newUser.first_name}
                    onChange={(e) => setNewUser({ ...newUser, first_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label>Nom</label>
                  <Input
                    value={newUser.last_name}
                    onChange={(e) => setNewUser({ ...newUser, last_name: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label>Type d'utilisateur</label>
                <Select
                  value={newUser.user_type}
                  onValueChange={(value: 'doctor' | 'establishment' | 'admin') => 
                    setNewUser({ ...newUser, user_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="doctor">Médecin</SelectItem>
                    <SelectItem value="establishment">Établissement</SelectItem>
                    <SelectItem value="admin">Administrateur</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {newUser.user_type === 'doctor' && (
                <div className="space-y-2">
                  <label>Spécialité</label>
                  <Input
                    value={newUser.specialty}
                    onChange={(e) => setNewUser({ ...newUser, specialty: e.target.value })}
                  />
                </div>
              )}
              {newUser.user_type === 'establishment' && (
                <>
                  <div className="space-y-2">
                    <label>Nom de l'établissement</label>
                    <Input
                      value={newUser.establishment_name}
                      onChange={(e) => setNewUser({ ...newUser, establishment_name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label>Type d'établissement</label>
                    <Input
                      value={newUser.establishment_type}
                      onChange={(e) => setNewUser({ ...newUser, establishment_type: e.target.value })}
                    />
                  </div>
                </>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddUserDialog(false)}>
                Annuler
              </Button>
              <Button onClick={handleAddUser}>
                Créer l'utilisateur
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
              <TableHead>Spécialité/Établissement</TableHead>
              <TableHead>Date d'inscription</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Vérification</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center">
                  Chargement...
                </TableCell>
              </TableRow>
            ) : filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center">
                  Aucun utilisateur trouvé
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    {user.first_name} {user.last_name}
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      user.user_type === 'admin' ? 'bg-purple-100 text-purple-700' :
                      user.user_type === 'doctor' ? 'bg-blue-100 text-blue-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {user.user_type === 'admin' ? 'Administrateur' :
                       user.user_type === 'doctor' ? 'Médecin' : 'Établissement'}
                    </span>
                  </TableCell>
                  <TableCell>
                    {user.user_type === 'doctor' ? user.specialty : user.establishment_name}
                  </TableCell>
                  <TableCell>
                    {format(new Date(user.created_at), 'dd MMMM yyyy', { locale: fr })}
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      user.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {user.is_active ? 'Actif' : 'Inactif'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      user.is_verified ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {user.is_verified ? 'Vérifié' : 'Non vérifié'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleToggleUserStatus(user.id, user.is_active)}>
                          {user.is_active ? (
                            <>
                              <UserX className="w-4 h-4 mr-2" />
                              Désactiver
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Activer
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleVerification(user.id, user.is_verified)}>
                          {user.is_verified ? (
                            <>
                              <XCircle className="w-4 h-4 mr-2" />
                              Révoquer la vérification
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Vérifier
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleChangeUserType(user.id, 'admin')}>
                          <Shield className="w-4 h-4 mr-2" />
                          Définir comme admin
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => window.location.href = `mailto:${user.email}`}>
                          <Mail className="w-4 h-4 mr-2" />
                          Envoyer un email
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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