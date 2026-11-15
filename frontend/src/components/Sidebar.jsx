import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  CalendarDays,
  UsersRound,
  ClipboardList,
  X,
  HeartHandshake,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import Brand from "./Brand";
import { useApp } from "../context/AppContext";
const menu = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/agendamentos", label: "Agendamentos", icon: CalendarDays },
  { to: "/usuarios", label: "Usuários e pacientes", icon: UsersRound },
  { to: "/prontuarios", label: "Prontuários", icon: ClipboardList },
];
export default function Sidebar({ open, onClose }) {
  const { logout } = useApp();
  return (
    <>
      {open && (
        <button
          type="button"
          className="sidebar-scrim"
          onClick={onClose}
          aria-label="Fechar menu"
        />
      )}
      <aside className={`sidebar ${open ? "sidebar-open" : ""}`}>
        <div className="sidebar-top">
          <Brand />
          <button
            type="button"
            className="sidebar-close icon-button"
            aria-label="Fechar menu"
            onClick={onClose}
          >
            <X size={19} />
          </button>
        </div>
        <div className="sidebar-section-label">MENU PRINCIPAL</div>
        <nav className="sidebar-nav" aria-label="Navegação principal">
          {menu.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? "active" : ""}`
              }
            >
              <Icon size={19} strokeWidth={1.9} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-help">
            <div className="help-symbol">
              <HeartHandshake size={28} />
            </div>
            <strong>Cuidar é conectar.</strong>
            <p>Uma experiência mais clara para a gestão da sua clínica.</p>
            <span>Projeto Integrador V</span>
          </div>
          <div className="sidebar-divider" />
          <div className="sidebar-footnote">
            <ShieldCheck size={17} />
            <span>Acesso autenticado · Dados de demonstração</span>
          </div>
          <button
            type="button"
            onClick={logout}
            className="sidebar-link sidebar-logout"
          >
            <LogOut size={18} /> Sair da plataforma
          </button>
        </div>
      </aside>
    </>
  );
}
