import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
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
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  useEffect(() => {
    fetchPatients();
    // Set type filter from URL params if present
    const typeFromUrl = searchParams.get('type');
    if (typeFromUrl) {
      setTypeFilter(typeFromUrl);
    }
  }, [searchParams]);

  useEffect(() => {
    filterPatients();
  }, [patients, searchTerm, sexeFilter, gsFilter, typeFilter]);

  const fetchPatients = async () => {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .order('nom_complet');

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
            Gérez les informations des patients
          </p>
        </div>
        <Button asChild>
          <Link to="/patients/new">
            <Plus className="h-4 w-4 mr-2" />
            Nouveau patient
          </Link>
        </Button>
      </div>

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
                        <Button
                          size="sm"
                          variant="outline"
                          asChild
                        >
                          <Link to={`/patients/${patient.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          asChild
                        >
                          <Link to={`/patients/${patient.id}/edit`}>
                            <Edit className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredPatients.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Aucun patient trouvé
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Patients;