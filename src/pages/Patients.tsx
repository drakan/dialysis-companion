import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/SimpleAuthContext';
import { Plus, Search, Eye, Edit, Trash } from 'lucide-react';

interface Patient {
  id: string;
  nom_complet: string;
  cin: string;
  date_naiss: string;
  sexe: string;
  gs: string;
  type: string;
  tele: string;
}

const Patients = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sexeFilter, setSexeFilter] = useState('all');
  const [gsFilter, setGsFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [userPermissions, setUserPermissions] = useState<any>(null);
  const [createdPatients, setCreatedPatients] = useState<string[]>([]);
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchUserPermissions().then(() => {
        // Fetch patients after permissions are loaded
        fetchPatients();
      });
    }
    // Set type filter from URL params if present
    const typeFromUrl = searchParams.get('type');
    if (typeFromUrl) {
      setTypeFilter(typeFromUrl);
    }
  }, [searchParams, user]);

  useEffect(() => {
    filterPatients();
  }, [patients, searchTerm, sexeFilter, gsFilter, typeFilter]);

  const fetchUserPermissions = async () => {
    try {
      // Set current user context
      await supabase.rpc('set_current_user', { username_value: user?.username || '' });
      
      const { data, error } = await supabase
        .from('user_permissions')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      setUserPermissions(data);

      // If user is creator, fetch created patients in current session
      if (data?.permission_type === 'creator') {
        const sessionId = localStorage.getItem('dialyse_session_id');
        const { data: createdData, error: createdError } = await supabase
          .from('user_created_patients')
          .select('patient_id')
          .eq('user_id', user?.id)
          .eq('session_id', sessionId);

        if (createdError) throw createdError;
        setCreatedPatients(createdData?.map(p => p.patient_id) || []);
      }
      
      return data; // Return the permissions data
    } catch (error: any) {
      console.error('Error fetching permissions:', error);
      return null;
    }
  };

  const fetchPatients = async () => {
    if (!user) return;
    
    try {
      // Always set current user context for RLS before any operation
      await supabase.rpc('set_current_user', { username_value: user.username });
      
      // Also ensure session is set for creator permissions
      const sessionId = localStorage.getItem('dialyse_session_id');
      if (sessionId) {
        await supabase.rpc('set_session_id', { session_value: sessionId });
      }
      
      let data, error;
      
      if (user?.role === 'admin') {
        // Admin can see all patients
        const result = await supabase
          .from('patients')
          .select('*')
          .order('nom_complet');
        data = result.data;
        error = result.error;
      } else if (userPermissions?.can_view_all_patients) {
        // User can view all patients
        const result = await supabase
          .from('patients')
          .select('*')
          .order('nom_complet');
        data = result.data;
        error = result.error;
      } else {
        // User can only view specific patients they have access to
        const result = await supabase
          .from('patient_access')
          .select(`
            patient:patients(*)
          `)
          .eq('user_id', user?.id)
          .eq('can_view', true);
        
        if (result.error) {
          error = result.error;
          data = null;
        } else {
          // Extract patient data from the joined result
          data = result.data?.map(access => access.patient).filter(Boolean) || [];
          error = null;
        }
      }

      if (error) throw error;
      setPatients(data || []);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de charger les patients',
      });
    } finally {
      setLoading(false);
    }
  };

  const filterPatients = () => {
    let filtered = patients;

    if (searchTerm) {
      filtered = filtered.filter(patient =>
        patient.nom_complet.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (sexeFilter && sexeFilter !== 'all') {
      filtered = filtered.filter(patient => patient.sexe === sexeFilter);
    }

    if (gsFilter && gsFilter !== 'all') {
      filtered = filtered.filter(patient => patient.gs === gsFilter);
    }

    if (typeFilter && typeFilter !== 'all') {
      filtered = filtered.filter(patient => patient.type === typeFilter);
    }

    setFilteredPatients(filtered);
  };

  const handleDelete = async (patientId: string, patientName: string) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer le patient "${patientName}" ?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('patients')
        .delete()
        .eq('id', patientId);

      if (error) throw error;
      
      toast({ title: 'Patient supprimé avec succès' });
      fetchPatients(); // Recharger la liste
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer le patient',
        variant: 'destructive'
      });
    }
  };

  const getTypeBadgeVariant = (type: string) => {
    switch (type) {
      case 'permanent':
        return 'default';
      case 'vacancier':
        return 'secondary';
      case 'transféré':
        return 'outline';
      case 'décédé':
        return 'destructive';
      case 'greffé':
        return 'default';
      default:
        return 'secondary';
    }
  };

  const uniqueGS = Array.from(new Set(patients.map(p => p.gs).filter(Boolean)));

  // Fonction pour déterminer si un utilisateur peut effectuer une action sur un patient
  const canPerformAction = (action: 'view' | 'edit' | 'delete', patientId: string) => {
    if (user?.role === 'admin') return true;
    
    if (action === 'view') {
      // Viewers peuvent voir seulement les patients assignés
      if (userPermissions?.permission_type === 'viewer') {
        return false; // RLS policies handle this at DB level
      }
      // Creators peuvent voir tous les patients
      if (userPermissions?.permission_type === 'creator') {
        return true;
      }
    }
    
    if (action === 'edit') {
      // Seuls les creators peuvent modifier les patients qu'ils ont créés dans cette session
      if (userPermissions?.permission_type === 'creator') {
        return createdPatients.includes(patientId);
      }
    }
    
    if (action === 'delete') {
      // Seuls les admins peuvent supprimer
      return false;
    }
    
    return false;
  };

  // Fonction pour déterminer si le bouton "Nouveau patient" doit être affiché
  const canCreatePatient = () => {
    return user?.role === 'admin' || 
           (userPermissions?.permission_type === 'creator' && userPermissions?.can_create_new_patients);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">
            {typeFilter && typeFilter !== 'all' ? `Patients ${typeFilter}s` : 'Liste des patients'}
          </h1>
          <p className="text-muted-foreground">
            {user?.role === 'admin' ? 'Gérez les informations des patients' : 
             userPermissions?.permission_type === 'viewer' ? 'Consultez les patients assignés' :
             userPermissions?.permission_type === 'creator' ? 'Consultez les patients et créez de nouveaux patients' :
             'Accès aux patients'}
          </p>
        </div>
        {canCreatePatient() && (
          <Button asChild>
            <Link to="/patients/new">
              <Plus className="h-4 w-4 mr-2" />
              Nouveau patient
            </Link>
          </Button>
        )}
      </div>

      {/* Masquer les filtres pour les viewers qui ne peuvent voir qu'un patient spécifique */}
      {user?.role === 'admin' || userPermissions?.permission_type === 'creator' || 
       (userPermissions?.permission_type === 'viewer' && userPermissions?.can_view_all_patients) ? (
        <Card>
          <CardHeader>
            <CardTitle>Filtres de recherche</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par nom..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>

              <Select value={sexeFilter} onValueChange={setSexeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Sexe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="M">Masculin</SelectItem>
                  <SelectItem value="F">Féminin</SelectItem>
                </SelectContent>
              </Select>

              <Select value={gsFilter} onValueChange={setGsFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Groupe sanguin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  {uniqueGS.map(gs => (
                    <SelectItem key={gs} value={gs}>{gs}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {!searchParams.get('type') && (
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="permanent">Permanent</SelectItem>
                    <SelectItem value="vacancier">Vacancier</SelectItem>
                    <SelectItem value="transféré">Transféré</SelectItem>
                    <SelectItem value="décédé">Décédé</SelectItem>
                    <SelectItem value="greffé">Greffé</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b">
                <tr>
                  <th className="text-left p-4 font-medium">Nom complet</th>
                  <th className="text-left p-4 font-medium">CIN</th>
                  <th className="text-left p-4 font-medium">Date naissance</th>
                  <th className="text-left p-4 font-medium">Sexe</th>
                  <th className="text-left p-4 font-medium">GS</th>
                  <th className="text-left p-4 font-medium">Type</th>
                  <th className="text-left p-4 font-medium">Téléphone</th>
                  <th className="text-left p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPatients.map((patient) => (
                  <tr key={patient.id} className="border-b hover:bg-muted/50">
                    <td className="p-4 font-medium">{patient.nom_complet}</td>
                    <td className="p-4">{patient.cin}</td>
                    <td className="p-4">
                      {patient.date_naiss ? new Date(patient.date_naiss).toLocaleDateString('fr-FR') : '-'}
                    </td>
                    <td className="p-4">{patient.sexe}</td>
                    <td className="p-4">{patient.gs}</td>
                    <td className="p-4">
                      <Badge variant={getTypeBadgeVariant(patient.type)}>
                        {patient.type}
                      </Badge>
                    </td>
                    <td className="p-4">{patient.tele}</td>
                    <td className="p-4">
                      <div className="flex space-x-2">
                        {/* Bouton Consulter - toujours visible pour les patients accessibles */}
                        <Button
                          size="sm"
                          variant="outline"
                          asChild
                        >
                          <Link to={`/patients/${patient.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        
                        {/* Bouton Modifier - seulement pour admin ou creators qui ont créé ce patient */}
                        {canPerformAction('edit', patient.id) && (
                          <Button
                            size="sm"
                            variant="outline"
                            asChild
                          >
                            <Link to={`/patients/${patient.id}/edit`}>
                              <Edit className="h-4 w-4" />
                            </Link>
                          </Button>
                        )}
                        
                        {/* Bouton Supprimer - seulement pour admin */}
                        {canPerformAction('delete', patient.id) && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDelete(patient.id, patient.nom_complet)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredPatients.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                {user?.role !== 'admin' && userPermissions?.permission_type === 'viewer' 
                  ? 'Aucun patient assigné' 
                  : 'Aucun patient trouvé'}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Patients;