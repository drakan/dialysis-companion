import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/SimpleAuthContext';

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50">
      <div className="text-center space-y-6 max-w-md">
        <h1 className="text-4xl font-bold">Centre de Dialyse</h1>
        <p className="text-xl text-muted-foreground">
          Système de gestion des patients
        </p>
        <Button asChild size="lg">
          <Link to="/auth">Se connecter</Link>
        </Button>
      </div>
    </div>
  );
};

export default Index;
