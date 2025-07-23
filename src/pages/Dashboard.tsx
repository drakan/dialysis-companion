import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/SimpleAuthContext';
import { Users, UserPlus, UserX, Heart, Activity } from 'lucide-react';

interface PatientStats {
  permanent: number;
  vacancier: number;
  transféré: number;
  décédé: number;
  greffé: number;
  total: number;
}

const Dashboard = () => {
  const [stats, setStats] = useState<PatientStats>({
    permanent: 0,
    vacancier: 0,
    transféré: 0,
    décédé: 0,
    greffé: 0,
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchStats();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchStats = async () => {
    try {
      // Set current user context
      await supabase.rpc('set_current_user', { username_value: user?.username || '' });
      
      const { data, error } = await supabase
        .from('patients')
        .select('type');

      if (error) throw error;

      const statsCount: PatientStats = {
        permanent: 0,
        vacancier: 0,
        transféré: 0,
        décédé: 0,
        greffé: 0,
        total: data?.length || 0,
      };

      data?.forEach((patient) => {
        if (patient.type in statsCount) {
          statsCount[patient.type as keyof PatientStats]++;
        }
      });

      setStats(statsCount);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de charger les statistiques',
      });
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'permanent':
        return <Users className="h-6 w-6" />;
      case 'vacancier':
        return <UserPlus className="h-6 w-6" />;
      case 'transféré':
        return <Activity className="h-6 w-6" />;
      case 'décédé':
        return <UserX className="h-6 w-6" />;
      case 'greffé':
        return <Heart className="h-6 w-6" />;
      default:
        return <Users className="h-6 w-6" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'permanent':
        return 'text-blue-600 dark:text-blue-400';
      case 'vacancier':
        return 'text-green-600 dark:text-green-400';
      case 'transféré':
        return 'text-orange-600 dark:text-orange-400';
      case 'décédé':
        return 'text-red-600 dark:text-red-400';
      case 'greffé':
        return 'text-purple-600 dark:text-purple-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
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
      <div>
        <h1 className="text-3xl font-bold">Tableau de bord</h1>
        <p className="text-muted-foreground">
          {user?.role === 'admin' 
            ? 'Vue d\'ensemble des patients du centre de dialyse'
            : 'Accédez à vos patients autorisés'}
        </p>
      </div>

      {user?.role === 'admin' ? (
        // Dashboard complet pour les admins
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link to="/patients">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total des patients</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
                <p className="text-xs text-muted-foreground">
                  Cliquez pour voir la liste complète
                </p>
              </CardContent>
            </Card>
          </Link>

          {Object.entries(stats)
            .filter(([key]) => key !== 'total')
            .map(([type, count]) => (
              <Link key={type} to={`/patients?type=${type}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium capitalize">
                      {type === 'transféré' ? 'Transférés' : 
                       type === 'décédé' ? 'Décédés' : 
                       type === 'greffé' ? 'Greffés' :
                       type === 'vacancier' ? 'Vacanciers' :
                       'Permanents'}
                    </CardTitle>
                    <div className={getTypeColor(type)}>
                      {getTypeIcon(type)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{count}</div>
                    <p className="text-xs text-muted-foreground">
                      Cliquez pour voir la liste
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
        </div>
      ) : (
        // Dashboard simple pour les utilisateurs non-admin
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link to="/patients">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Mes patients</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">👥</div>
                <p className="text-xs text-muted-foreground">
                  Accéder à la liste des patients
                </p>
              </CardContent>
            </Card>
          </Link>
          
          <Link to="/admin">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Administration</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">⚙️</div>
                <p className="text-xs text-muted-foreground">
                  Gérer les utilisateurs et permissions
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>
      )}
    </div>
  );
};

export default Dashboard;