import { Navigate, Route, Routes } from "react-router-dom";
import { useApp } from "./context/AppContext";
import DashboardLayout from "./layouts/DashboardLayout";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import UsuariosPage from "./pages/UsuariosPage";
import AgendamentosPage from "./pages/AgendamentosPage";
import ProntuariosPage from "./pages/ProntuariosPage";
function RequireAuth({ children }) {
  const { session, authLoading } = useApp();
  if (authLoading) return <div className="auth-loading">Verificando sessão...</div>;
  return session ? children : <Navigate to="/login" replace />;
}
export default function App() {
  const { session, authLoading } = useApp();
  if (authLoading) return <div className="auth-loading">Carregando Lumera...</div>;
  return (
    <Routes>
      <Route
        path="/login"
        element={session ? <Navigate to="/dashboard" replace /> : <LoginPage />}
      />
      <Route
        path="/"
        element={
          <RequireAuth>
            <DashboardLayout />
          </RequireAuth>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="usuarios" element={session?.perfil === 'ADMINISTRADOR' ? <UsuariosPage/> : <Navigate to="/dashboard" replace/>} />
        <Route path="agendamentos" element={<AgendamentosPage />} />
        <Route path="prontuarios" element={['ADMINISTRADOR','PROFISSIONAL_SAUDE'].includes(session?.perfil) ? <ProntuariosPage/> : <Navigate to="/dashboard" replace/>} />
      </Route>
      <Route
        path="*"
        element={<Navigate to={session ? "/dashboard" : "/login"} replace />}
      />
    </Routes>
  );
}
