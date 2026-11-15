import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Bell, Menu, Search, ChevronDown, Sparkles } from "lucide-react";
import Sidebar from "../components/Sidebar";
import { useApp } from "../context/AppContext";
import { initials } from "../utils/format";
const titles = {
  "/dashboard": "Dashboard",
  "/usuarios": "Usuários e pacientes",
  "/agendamentos": "Agendamentos",
  "/prontuarios": "Prontuários",
};
export default function DashboardLayout() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const { session, toast, notify } = useApp();
  return (
    <div className="app-shell">
      <Sidebar open={open} onClose={() => setOpen(false)} />
      <div className="app-workspace">
        <header className="topbar">
          <div className="topbar-start">
            <button
              type="button"
              aria-label="Abrir menu"
              className="icon-button mobile-menu"
              onClick={() => setOpen(true)}
            >
              <Menu size={21} />
            </button>
            <div className="top-search">
              <Search size={19} />
              <input
                aria-label="Busca global"
                placeholder="Busque pacientes, agendamentos..."
                onKeyDown={(e) => {
                  if (e.key === "Enter")
                    notify("Use a busca disponível em cada página.");
                }}
              />
              <span className="search-shortcut">⌘ K</span>
            </div>
          </div>
          <div className="top-actions">
            <span className="demo-tag">
              <Sparkles size={13} /> Autenticado · Dados de exemplo
            </span>
            <button
              type="button"
              aria-label="Notificações"
              className="notification-button"
              onClick={() => notify("Você não possui novas notificações.")}
            >
              <Bell size={19} />
              <i />
            </button>
            <div className="profile-pill">
              <div className="avatar avatar-primary">
                {initials(session?.nome)}
              </div>
              <div className="profile-meta">
                <strong>{session?.nome}</strong>
                <small>{({ ADMINISTRADOR: "Administrador", PROFISSIONAL_SAUDE: "Profissional de saúde", RECEPCAO: "Recepção" }[session?.perfil] || session?.perfil || "Usuário")}</small>
              </div>
              <ChevronDown size={15} />
            </div>
          </div>
        </header>
        <main className="page-content">
          <div className="page-breadcrumb">
            LUMERA / <span>{titles[location.pathname] || "Painel"}</span>
          </div>
          <Outlet />
        </main>
        <footer className="footer-note">
          Lumera · Projeto Integrador V · Dados fictícios para demonstração
        </footer>
      </div>
      {toast && (
        <div className="toast-message" role="status">
          {toast}
        </div>
      )}
    </div>
  );
}
