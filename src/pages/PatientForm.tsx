import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface FormData {
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
  type: 'permanent' | 'vacancier' | 'transféré' | 'décédé' | 'greffé';
  date_debut_dialyse: string;
  date_fin_dialyse: string;
  cause_fin_dialyse: string;
}

const PatientForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState<FormData>({
    nom_complet: '',
    cin: '',
    ass_cnss: '',
    date_naiss: '',
    sexe: '',
    gs: '',
    tele: '',
    tele_urg: '',
    adresse: '',
    profession: '',
    situa_fami: '',
    type: 'permanent',
    date_debut_dialyse: '',
    date_fin_dialyse: '',
    cause_fin_dialyse: ''
  });

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEdit);

  useEffect(() => {
    if (isEdit && id) {
      fetchPatientData();
    }
  }, [id, isEdit]);

  const fetchPatientData = async () => {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      if (data) {
        setFormData({
          nom_complet: data.nom_complet || '',
          cin: data.cin || '',
          ass_cnss: data.ass_cnss || '',
          date_naiss: data.date_naiss || '',
          sexe: data.sexe || '',
          gs: data.gs || '',
          tele: data.tele || '',
          tele_urg: data.tele_urg || '',
          adresse: data.adresse || '',
          profession: data.profession || '',
          situa_fami: data.situa_fami || '',
          type: data.type || 'permanent',
          date_debut_dialyse: data.date_debut_dialyse || '',
          date_fin_dialyse: data.date_fin_dialyse || '',
          cause_fin_dialyse: data.cause_fin_dialyse || ''
        });
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les données du patient',
        variant: 'destructive'
      });
    } finally {
      setInitialLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isEdit) {
        const { error } = await supabase
          .from('patients')
          .update(formData)
          .eq('id', id);

        if (error) throw error;
        toast({ title: 'Patient modifié avec succès' });
      } else {
        const { error } = await supabase
          .from('patients')
          .insert([formData]);

        if (error) throw error;
        toast({ title: 'Patient ajouté avec succès' });
      }
      
      navigate('/patients');
    } catch (error) {
      console.error('Erreur:', error);
      toast({ 
        title: 'Erreur', 
        description: 'Une erreur est survenue',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (initialLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>
            {isEdit ? 'Modifier le patient' : 'Nouveau patient'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Informations personnelles */}
            <div>
              <h3 className="text-lg font-medium mb-4">Informations personnelles</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nom_complet">Nom complet *</Label>
                  <Input
                    id="nom_complet"
                    value={formData.nom_complet}
                    onChange={(e) => handleChange('nom_complet', e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="cin">CIN</Label>
                  <Input
                    id="cin"
                    value={formData.cin}
                    onChange={(e) => handleChange('cin', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="ass_cnss">Assurance CNSS</Label>
                  <Input
                    id="ass_cnss"
                    value={formData.ass_cnss}
                    onChange={(e) => handleChange('ass_cnss', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="date_naiss">Date de naissance</Label>
                  <Input
                    id="date_naiss"
                    type="date"
                    value={formData.date_naiss}
                    onChange={(e) => handleChange('date_naiss', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="sexe">Sexe</Label>
                  <Select value={formData.sexe} onValueChange={(value) => handleChange('sexe', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="M">Masculin</SelectItem>
                      <SelectItem value="F">Féminin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="gs">Groupe sanguin</Label>
                  <Select value={formData.gs} onValueChange={(value) => handleChange('gs', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="O Positif">O Positif</SelectItem>
                      <SelectItem value="O Negatif">O Négatif</SelectItem>
                      <SelectItem value="A Positif">A Positif</SelectItem>
                      <SelectItem value="A Negatif">A Négatif</SelectItem>
                      <SelectItem value="B Positif">B Positif</SelectItem>
                      <SelectItem value="B Negatif">B Négatif</SelectItem>
                      <SelectItem value="AB Positif">AB Positif</SelectItem>
                      <SelectItem value="AB Negatif">AB Négatif</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="tele">Téléphone</Label>
                  <Input
                    id="tele"
                    type="tel"
                    maxLength={8}
                    value={formData.tele}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      handleChange('tele', value);
                    }}
                    placeholder="12345678"
                  />
                </div>

                <div>
                  <Label htmlFor="tele_urg">Téléphone urgence</Label>
                  <Input
                    id="tele_urg"
                    type="tel"
                    maxLength={8}
                    value={formData.tele_urg}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      handleChange('tele_urg', value);
                    }}
                    placeholder="12345678"
                  />
                </div>

                <div>
                  <Label htmlFor="adresse">Adresse</Label>
                  <Input
                    id="adresse"
                    value={formData.adresse}
                    onChange={(e) => handleChange('adresse', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="profession">Profession</Label>
                  <Input
                    id="profession"
                    value={formData.profession}
                    onChange={(e) => handleChange('profession', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="situa_fami">Situation familiale</Label>
                  <Input
                    id="situa_fami"
                    value={formData.situa_fami}
                    onChange={(e) => handleChange('situa_fami', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="type">Type</Label>
                  <Select value={formData.type} onValueChange={(value) => handleChange('type', value as FormData['type'])}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="permanent">Permanent</SelectItem>
                      <SelectItem value="vacancier">Vacancier</SelectItem>
                      <SelectItem value="transféré">Transféré</SelectItem>
                      <SelectItem value="décédé">Décédé</SelectItem>
                      <SelectItem value="greffé">Greffé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Informations de dialyse */}
            <div>
              <h3 className="text-lg font-medium mb-4">Informations de dialyse</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date_debut_dialyse">Date début dialyse</Label>
                  <Input
                    id="date_debut_dialyse"
                    type="date"
                    value={formData.date_debut_dialyse}
                    onChange={(e) => handleChange('date_debut_dialyse', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="date_fin_dialyse">Date fin dialyse</Label>
                  <Input
                    id="date_fin_dialyse"
                    type="date"
                    value={formData.date_fin_dialyse}
                    onChange={(e) => handleChange('date_fin_dialyse', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="cause_fin_dialyse">Cause fin dialyse</Label>
                  <Select 
                    value={formData.cause_fin_dialyse} 
                    onValueChange={(value) => handleChange('cause_fin_dialyse', value)}
                    disabled={!formData.date_fin_dialyse}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une cause" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="deces">Décès</SelectItem>
                      <SelectItem value="guerie">Guérie</SelectItem>
                      <SelectItem value="greffe">Greffe</SelectItem>
                      <SelectItem value="transfert">Transfert à un autre centre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={loading}>
                {loading ? 'Enregistrement...' : (isEdit ? 'Modifier' : 'Ajouter')}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate('/patients')}>
                Annuler
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default PatientForm;