import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/SimpleAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Trash2 } from 'lucide-react';

interface SimpleUser {
  id: string;
  username: string;
  nom_complet: string;
  role: string;
  created_at: string;
}

const Admin = () => {
  const [passwordForm, setPasswordForm] = useState({ newPassword: '', confirmPassword: '' });
  const [userForm, setUserForm] = useState({ username: '', password: '', nom_complet: '', role: 'user' });
  const [users, setUsers] = useState<SimpleUser[]>([]);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const { user, updatePassword, createUser } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
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
    
    if (!userForm.username || !userForm.password || !userForm.nom_complet) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Tous les champs sont obligatoires",
      });
      return;
    }

    setIsCreatingUser(true);

    try {
      const { error } = await createUser(
        userForm.username, 
        userForm.password, 
        userForm.nom_complet, 
        userForm.role
      );

      if (error) throw error;

      toast({
        title: "Utilisateur créé",
        description: `L'utilisateur ${userForm.username} a été créé avec succès`,
      });
      setUserForm({ username: '', password: '', nom_complet: '', role: 'user' });
      fetchUsers(); // Refresh the user list
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
          Gestion du compte administrateur et des utilisateurs
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informations du compte</CardTitle>
          <CardDescription>
            Utilisateur connecté : {user?.username} ({user?.nom_complet})
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="password" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="password">Changer le mot de passe</TabsTrigger>
          <TabsTrigger value="users">Gérer les utilisateurs</TabsTrigger>
          <TabsTrigger value="create">Créer un utilisateur</TabsTrigger>
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
                        <th className="text-left p-2">Nom complet</th>
                        <th className="text-left p-2">Rôle</th>
                        <th className="text-left p-2">Date de création</th>
                        <th className="text-left p-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => (
                        <tr key={u.id} className="border-b">
                          <td className="p-2 font-medium">{u.username}</td>
                          <td className="p-2">{u.nom_complet}</td>
                          <td className="p-2">
                            <span className={`px-2 py-1 rounded text-xs ${
                              u.role === 'admin' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                            }`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="p-2">{new Date(u.created_at).toLocaleDateString('fr-FR')}</td>
                          <td className="p-2">
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
                  <Label htmlFor="username">Nom d'utilisateur</Label>
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
                  <Label htmlFor="userPassword">Mot de passe</Label>
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
                  <Label htmlFor="nom_complet">Nom complet</Label>
                  <Input
                    id="nom_complet"
                    type="text"
                    value={userForm.nom_complet}
                    onChange={(e) => setUserForm({ ...userForm, nom_complet: e.target.value })}
                    required
                    disabled={isCreatingUser}
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
      </Tabs>
    </div>
  );
};

export default Admin;