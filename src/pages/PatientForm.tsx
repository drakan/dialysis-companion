import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const PatientForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState({
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
    type: 'permanent' as const
  });

  const [loading, setLoading] = useState(false);

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

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>
            {isEdit ? 'Modifier le patient' : 'Nouveau patient'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
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
                  value={formData.tele}
                  onChange={(e) => handleChange('tele', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="tele_urg">Téléphone urgence</Label>
                <Input
                  id="tele_urg"
                  value={formData.tele_urg}
                  onChange={(e) => handleChange('tele_urg', e.target.value)}
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
                <Select value={formData.type} onValueChange={(value) => handleChange('type', value)}>
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