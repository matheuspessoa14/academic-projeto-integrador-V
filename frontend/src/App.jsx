import { Navigate, Route, Routes } from "react-router-dom";
import { useApp } from "./context/AppContext";
import DashboardLayout from "./layouts/DashboardLayout";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import UsuariosPage from "./pages/UsuariosPage";
import AgendamentosPage from "./pages/AgendamentosPage";
import ProntuariosPage from "./pages/ProntuariosPage";
function RequireDemo({ children }) {
  const { session } = useApp();
  return session ? children : <Navigate to="/login" replace />;
}
export default function App() {
  const { session } = useApp();
  return (
    <Routes>
      <Route
        path="/login"
        element={session ? <Navigate to="/dashboard" replace /> : <LoginPage />}
      />
      <Route
        path="/"
        element={
          <RequireDemo>
            <DashboardLayout />
          </RequireDemo>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="usuarios" element={<UsuariosPage />} />
        <Route path="agendamentos" element={<AgendamentosPage />} />
        <Route path="prontuarios" element={<ProntuariosPage />} />
      </Route>
      <Route
        path="*"
        element={<Navigate to={session ? "/dashboard" : "/login"} replace />}
      />
    </Routes>
  );
}
