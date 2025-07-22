import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SimpleLoginForm } from '@/components/auth/SimpleLoginForm';
import { useAuth } from '@/contexts/SimpleAuthContext';

const SimpleAuth = () => {
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
      <SimpleLoginForm />
    </div>
  );
};

export default SimpleAuth;