import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/SimpleAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Trash2, Settings, Users } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface SimpleUser {
  id: string;
  username: string;
  role: string;
  created_at: string;
}

interface Patient {
  id: string;
  nom_complet: string;
}

interface UserPermissions {
  id?: string;
  user_id: string;
  can_create_patients: boolean;
  can_modify_existing_patients: boolean;
}

interface PatientAccess {
  id?: string;
  user_id: string;
  patient_id: string;
  can_view: boolean;
  can_edit: boolean;
  patient?: Patient;
}

const Admin = () => {
  const [passwordForm, setPasswordForm] = useState({ newPassword: '', confirmPassword: '' });
  const [userForm, setUserForm] = useState({ username: '', password: '', role: 'user' });
  const [users, setUsers] = useState<SimpleUser[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedUser, setSelectedUser] = useState<SimpleUser | null>(null);
  const [userPermissions, setUserPermissions] = useState<UserPermissions>({
    user_id: '',
    can_create_patients: false,
    can_modify_existing_patients: false
  });
  const [patientAccess, setPatientAccess] = useState<PatientAccess[]>([]);
  const [newPatientAccess, setNewPatientAccess] = useState({
    patient_id: '',
    can_view: true,
    can_edit: false
  });

  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(false);
  const [isSavingPermissions, setIsSavingPermissions] = useState(false);

  const { user, updatePassword, createUser } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
    fetchPatients();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('simple_users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de charger la liste des utilisateurs',
      });
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const fetchPatients = async () => {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('id, nom_complet')
        .order('nom_complet');

      if (error) throw error;
      setPatients(data || []);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de charger la liste des patients',
      });
    }
  };

  const fetchUserPermissions = async (userId: string) => {
    setIsLoadingPermissions(true);
    try {
      // Fetch general permissions
      const { data: permData, error: permError } = await supabase
        .from('user_permissions')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (permError && permError.code !== 'PGRST116') throw permError;

      setUserPermissions(permData || {
        user_id: userId,
        can_create_patients: false,
        can_modify_existing_patients: false
      });

      // Fetch patient access
      const { data: accessData, error: accessError } = await supabase
        .from('patient_access')
        .select(`
          *,
          patient:patients(id, nom_complet)
        `)
        .eq('user_id', userId);

      if (accessError) throw accessError;
      setPatientAccess(accessData || []);

    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de charger les permissions',
      });
    } finally {
      setIsLoadingPermissions(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Les mots de passe ne correspondent pas",
      });
      return;
    }

    if (passwordForm.newPassword.length < 3) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Le mot de passe doit contenir au moins 3 caractères",
      });
      return;
    }

    setIsUpdatingPassword(true);

    try {
      const { error } = await updatePassword(passwordForm.newPassword);
      if (error) throw error;

      toast({
        title: "Mot de passe mis à jour",
        description: "Votre mot de passe a été mis à jour avec succès",
      });
      setPasswordForm({ newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message || "Impossible de mettre à jour le mot de passe",
      });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userForm.username || !userForm.password) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Nom d'utilisateur et mot de passe sont obligatoires",
      });
      return;
    }

    setIsCreatingUser(true);

    try {
      const { error } = await createUser(
        userForm.username, 
        userForm.password, 
        userForm.role
      );

      if (error) throw error;

      toast({
        title: "Utilisateur créé",
        description: `L'utilisateur ${userForm.username} a été créé avec succès`,
      });
      setUserForm({ username: '', password: '', role: 'user' });
      fetchUsers();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message || "Impossible de créer l'utilisateur",
      });
    } finally {
      setIsCreatingUser(false);
    }
  };

  const savePermissions = async () => {
    if (!selectedUser) return;

    setIsSavingPermissions(true);
    try {
      // Save general permissions
      const { error: permError } = await supabase
        .from('user_permissions')
        .upsert({
          user_id: selectedUser.id,
          can_create_patients: userPermissions.can_create_patients,
          can_modify_existing_patients: userPermissions.can_modify_existing_patients
        });

      if (permError) throw permError;

      toast({
        title: "Permissions mises à jour",
        description: "Les permissions ont été sauvegardées avec succès",
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de sauvegarder les permissions',
      });
    } finally {
      setIsSavingPermissions(false);
    }
  };

  const addPatientAccess = async () => {
    if (!selectedUser || !newPatientAccess.patient_id) return;

    try {
      const { error } = await supabase
        .from('patient_access')
        .insert({
          user_id: selectedUser.id,
          patient_id: newPatientAccess.patient_id,
          can_view: newPatientAccess.can_view,
          can_edit: newPatientAccess.can_edit
        });

      if (error) throw error;

      toast({
        title: "Accès ajouté",
        description: "L'accès au patient a été ajouté avec succès",
      });
      
      setNewPatientAccess({ patient_id: '', can_view: true, can_edit: false });
      fetchUserPermissions(selectedUser.id);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible d\'ajouter l\'accès au patient',
      });
    }
  };

  const removePatientAccess = async (accessId: string) => {
    try {
      const { error } = await supabase
        .from('patient_access')
        .delete()
        .eq('id', accessId);

      if (error) throw error;

      toast({
        title: "Accès supprimé",
        description: "L'accès au patient a été supprimé",
      });
      
      if (selectedUser) {
        fetchUserPermissions(selectedUser.id);
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de supprimer l\'accès au patient',
      });
    }
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="text-center py-8">
        <h1 className="text-2xl font-bold text-destructive">Accès refusé</h1>
        <p className="text-muted-foreground">Seuls les administrateurs peuvent accéder à cette page</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Administration</h1>
        <p className="text-muted-foreground">
          Gestion des utilisateurs et des permissions
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informations du compte</CardTitle>
          <CardDescription>
            Utilisateur connecté : {user?.username}
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="password" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="password">Mot de passe</TabsTrigger>
          <TabsTrigger value="users">Utilisateurs</TabsTrigger>
          <TabsTrigger value="create">Créer utilisateur</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
        </TabsList>

        <TabsContent value="password" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Modifier le mot de passe</CardTitle>
              <CardDescription>
                Changez votre mot de passe de connexion
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordUpdate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    required
                    disabled={isUpdatingPassword}
                    minLength={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmer le nouveau mot de passe</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    required
                    disabled={isUpdatingPassword}
                    minLength={3}
                  />
                </div>
                <Button type="submit" disabled={isUpdatingPassword}>
                  {isUpdatingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Mettre à jour le mot de passe
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Liste des utilisateurs</CardTitle>
              <CardDescription>
                Gérez les utilisateurs du système
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingUsers ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b">
                      <tr>
                        <th className="text-left p-2">Nom d'utilisateur</th>
                        <th className="text-left p-2">Rôle</th>
                        <th className="text-left p-2">Date de création</th>
                        <th className="text-left p-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => (
                        <tr key={u.id} className="border-b">
                          <td className="p-2 font-medium">{u.username}</td>
                          <td className="p-2">
                            <span className={`px-2 py-1 rounded text-xs ${
                              u.role === 'admin' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                            }`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="p-2">{new Date(u.created_at).toLocaleDateString('fr-FR')}</td>
                          <td className="p-2 flex gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedUser(u);
                                    fetchUserPermissions(u.id);
                                  }}
                                >
                                  <Settings className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                  <DialogTitle>Permissions de {u.username}</DialogTitle>
                                  <DialogDescription>
                                    Gérer les permissions et accès aux patients
                                  </DialogDescription>
                                </DialogHeader>
                                
                                {isLoadingPermissions ? (
                                  <div className="flex justify-center py-4">
                                    <Loader2 className="h-6 w-6 animate-spin" />
                                  </div>
                                ) : (
                                  <div className="space-y-6">
                                    <div>
                                      <h4 className="font-medium mb-3">Permissions générales</h4>
                                      <div className="space-y-2">
                                        <div className="flex items-center space-x-2">
                                          <Checkbox
                                            id="can_create"
                                            checked={userPermissions.can_create_patients}
                                            onCheckedChange={(checked) => 
                                              setUserPermissions(prev => ({ ...prev, can_create_patients: !!checked }))
                                            }
                                          />
                                          <label htmlFor="can_create">Peut créer de nouveaux patients</label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                          <Checkbox
                                            id="can_modify"
                                            checked={userPermissions.can_modify_existing_patients}
                                            onCheckedChange={(checked) => 
                                              setUserPermissions(prev => ({ ...prev, can_modify_existing_patients: !!checked }))
                                            }
                                          />
                                          <label htmlFor="can_modify">Peut modifier les patients existants</label>
                                        </div>
                                      </div>
                                      <Button 
                                        onClick={savePermissions} 
                                        disabled={isSavingPermissions}
                                        className="mt-3"
                                      >
                                        {isSavingPermissions && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Sauvegarder les permissions
                                      </Button>
                                    </div>

                                    <div>
                                      <h4 className="font-medium mb-3">Accès spécifique aux patients</h4>
                                      
                                      <div className="flex gap-2 mb-4">
                                        <Select value={newPatientAccess.patient_id} onValueChange={(value) => 
                                          setNewPatientAccess(prev => ({ ...prev, patient_id: value }))
                                        }>
                                          <SelectTrigger className="flex-1">
                                            <SelectValue placeholder="Sélectionner un patient" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {patients.map((patient) => (
                                              <SelectItem key={patient.id} value={patient.id}>
                                                {patient.nom_complet}
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                        <Button onClick={addPatientAccess} disabled={!newPatientAccess.patient_id}>
                                          Ajouter
                                        </Button>
                                      </div>

                                      <div className="space-y-2">
                                        {patientAccess.map((access) => (
                                          <div key={access.id} className="flex items-center justify-between p-2 border rounded">
                                            <span>{access.patient?.nom_complet}</span>
                                            <div className="flex items-center gap-2">
                                              <span className="text-sm text-muted-foreground">
                                                {access.can_view ? 'Lecture' : ''} 
                                                {access.can_edit ? ' • Écriture' : ''}
                                              </span>
                                              <Button 
                                                size="sm" 
                                                variant="outline" 
                                                onClick={() => access.id && removePatientAccess(access.id)}
                                              >
                                                <Trash2 className="h-4 w-4" />
                                              </Button>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </DialogContent>
                            </Dialog>
                            
                            {u.username !== 'admin' && (
                              <Button size="sm" variant="outline" className="text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="create" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Créer un nouvel utilisateur</CardTitle>
              <CardDescription>
                Ajoutez un nouvel utilisateur au système
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Nom d'utilisateur *</Label>
                  <Input
                    id="username"
                    type="text"
                    value={userForm.username}
                    onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                    required
                    disabled={isCreatingUser}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="userPassword">Mot de passe *</Label>
                  <Input
                    id="userPassword"
                    type="password"
                    value={userForm.password}
                    onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                    required
                    disabled={isCreatingUser}
                    minLength={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Rôle</Label>
                  <Select value={userForm.role} onValueChange={(value) => setUserForm({ ...userForm, role: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">Utilisateur</SelectItem>
                      <SelectItem value="admin">Administrateur</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" disabled={isCreatingUser}>
                  {isCreatingUser && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Créer l'utilisateur
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permissions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gestion des permissions</CardTitle>
              <CardDescription>
                Cliquez sur le bouton paramètres d'un utilisateur dans l'onglet "Utilisateurs" pour gérer ses permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border rounded p-4">
                    <h4 className="font-medium mb-2">Permissions générales</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Peut créer de nouveaux patients</li>
                      <li>• Peut modifier les patients existants</li>
                    </ul>
                  </div>
                  <div className="border rounded p-4">
                    <h4 className="font-medium mb-2">Accès spécifique</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Accès en lecture à des patients spécifiques</li>
                      <li>• Accès en écriture à des patients spécifiques</li>
                      <li>• Idéal pour les centres temporaires</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Admin;