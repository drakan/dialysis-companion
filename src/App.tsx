import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from './contexts/SimpleAuthContext';
import { SimpleProtectedRoute } from './components/SimpleProtectedRoute';
import { DashboardLayout } from './components/layout/DashboardLayout';
import Index from "./pages/Index";
import SimpleAuth from './pages/SimpleAuth';
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import PatientForm from './pages/PatientForm';
import PatientDetails from './pages/PatientDetails';
import SimpleAdmin from './pages/SimpleAdmin';
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<SimpleAuth />} />
            <Route 
              path="/dashboard" 
              element={
                <SimpleProtectedRoute>
                  <DashboardLayout>
                    <Dashboard />
                  </DashboardLayout>
                </SimpleProtectedRoute>
              } 
            />
            <Route 
              path="/patients" 
              element={
                <SimpleProtectedRoute>
                  <DashboardLayout>
                    <Patients />
                  </DashboardLayout>
                </SimpleProtectedRoute>
              } 
            />
            <Route 
              path="/patients/new" 
              element={
                <SimpleProtectedRoute>
                  <DashboardLayout>
                    <PatientForm />
                  </DashboardLayout>
                </SimpleProtectedRoute>
              } 
            />
            <Route 
              path="/patients/:id" 
              element={
                <SimpleProtectedRoute>
                  <DashboardLayout>
                    <PatientDetails />
                  </DashboardLayout>
                </SimpleProtectedRoute>
              } 
            />
            <Route 
              path="/patients/:id/edit" 
              element={
                <SimpleProtectedRoute>
                  <DashboardLayout>
                    <PatientForm />
                  </DashboardLayout>
                </SimpleProtectedRoute>
              } 
            />
            <Route 
              path="/admin"
              element={
                <SimpleProtectedRoute>
                  <DashboardLayout>
                    <SimpleAdmin />
                  </DashboardLayout>
                </SimpleProtectedRoute>
              } 
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
