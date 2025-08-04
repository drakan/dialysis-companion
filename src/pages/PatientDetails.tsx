import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/SimpleAuthContext';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';

interface Patient {
  id: string;
  nom_complet: string;
  cin: string;
  ass_cnss: string;
  date_naiss: string;
  sexe: string;
  gs: string;
  tele: string;
  tele_urg: string;
  adresse: string;
  profession: string;
  situa_fami: string;
  type: string;
  created_at: string;
  updated_at: string;
}

const PatientDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [canEdit, setCanEdit] = useState(false);
  const [canDelete, setCanDelete] = useState(false);

  useEffect(() => {
    if (user) {
      fetchPatient();
    }
  }, [id, user]);

  const fetchPatient = async () => {
    if (!user) return;
    
    try {
      // Set current user context for RLS
      await supabase.rpc('set_current_user', { username_value: user.username });
      
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setPatient(data);
      
      // Check permissions for this patient
      await checkPermissions();
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les détails du patient ou accès non autorisé',
        variant: 'destructive'
      });
      navigate('/patients');
    } finally {
      setLoading(false);
    }
  };

  const checkPermissions = async () => {
    if (!user || !id) return;
    
    try {
      // Check if user is admin
      if (user.role === 'admin') {
        setCanEdit(true);
        setCanDelete(true);
        return;
      }
      
      // Check if user created this patient in current session
      const sessionId = localStorage.getItem('dialyse_session_id');
      if (sessionId) {
        const { data: createdPatients } = await supabase
          .from('user_created_patients')
          .select('patient_id')
          .eq('user_id', user.id)
          .eq('session_id', sessionId)
          .eq('patient_id', id);
          
        if (createdPatients && createdPatients.length > 0) {
          setCanEdit(true);
        }
      }
      
      // Only admins can delete
      setCanDelete(user.role === 'admin');
    } catch (error) {
      console.error('Erreur lors de la vérification des permissions:', error);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce patient ?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('patients')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({ title: 'Patient supprimé avec succès' });
      navigate('/patients');
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer le patient',
        variant: 'destructive'
      });
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'permanent': return 'bg-green-500';
      case 'vacancier': return 'bg-blue-500';
      case 'transféré': return 'bg-yellow-500';
      case 'décédé': return 'bg-red-500';
      case 'greffé': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">Chargement...</div>;
  }

  if (!patient) {
    return <div className="flex justify-center p-8">Patient non trouvé</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" onClick={() => navigate('/patients')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>
        <h1 className="text-2xl font-bold">Détails du patient</h1>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-xl">{patient.nom_complet}</CardTitle>
              <Badge className={`mt-2 ${getTypeColor(patient.type)} text-white`}>
                {patient.type}
              </Badge>
            </div>
            <div className="flex gap-2">
              {canEdit && (
                <Button onClick={() => navigate(`/patients/${id}/edit`)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Modifier
                </Button>
              )}
              {canDelete && (
                <Button variant="destructive" onClick={handleDelete}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">CIN</label>
                <p className="text-base">{patient.cin || 'Non renseigné'}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Assurance CNSS</label>
                <p className="text-base">{patient.ass_cnss || 'Non renseigné'}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Date de naissance</label>
                <p className="text-base">
                  {patient.date_naiss ? new Date(patient.date_naiss).toLocaleDateString('fr-FR') : 'Non renseigné'}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Sexe</label>
                <p className="text-base">{patient.sexe === 'M' ? 'Masculin' : patient.sexe === 'F' ? 'Féminin' : 'Non renseigné'}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Groupe sanguin</label>
                <p className="text-base">{patient.gs || 'Non renseigné'}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Téléphone</label>
                <p className="text-base">{patient.tele || 'Non renseigné'}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Téléphone urgence</label>
                <p className="text-base">{patient.tele_urg || 'Non renseigné'}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Adresse</label>
                <p className="text-base">{patient.adresse || 'Non renseigné'}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Profession</label>
                <p className="text-base">{patient.profession || 'Non renseigné'}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Situation familiale</label>
                <p className="text-base">{patient.situa_fami || 'Non renseigné'}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Créé le</label>
                <p className="text-base">
                  {new Date(patient.created_at).toLocaleDateString('fr-FR')}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Modifié le</label>
                <p className="text-base">
                  {new Date(patient.updated_at).toLocaleDateString('fr-FR')}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PatientDetails;