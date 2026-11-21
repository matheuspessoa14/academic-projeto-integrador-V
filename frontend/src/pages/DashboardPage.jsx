import { Link } from "react-router-dom";
import {
  CalendarDays,
  UsersRound,
  ClipboardList,
  Activity,
  ArrowUpRight,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Plus,
  Stethoscope,
  CalendarCheck2,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import StatusBadge from "../components/StatusBadge";
import { brDate, todayISO, initials } from "../utils/format";
// LUMERA_AGENDAMENTO_REAL_V1 — contagem real por dia da semana.
const startWeek = () => {
  const d = new Date(); d.setHours(12,0,0,0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d;
};
const dateAt = (d) => d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
function Metric({ icon: Icon, title, value, sub, color }) {
  return (
    <div className="metric-card">
      <div className="metric-top">
        <div className={`metric-icon ${color}`}>
          <Icon size={20} />
        </div>
        <ArrowUpRight size={17} className="muted-icon" />
      </div>
      <div className="metric-value">{value}</div>
      <div className="metric-title">{title}</div>
      <small>{sub}</small>
    </div>
  );
}
function Gauge({ count, completed }) {
  const percent = count ? Math.round((completed / count) * 100) : 0;
  return (
    <div className="gauge-wrap">
      <div
        className="gauge"
        style={{
          background: `conic-gradient(from 240deg,#5963f7 0% ${percent * 0.75}%,#e9eafd ${percent * 0.75}% 75%,transparent 75% 100%)`,
        }}
      >
        <div className="gauge-inner">
          <strong>{percent}%</strong>
          <span>agendadas</span>
        </div>
      </div>
      <div className="gauge-legend">
        <span>
          <i className="legend-blue" />
          Agendadas: {completed}
        </span>
        <span>
          <i className="legend-pale" />
          Demais: {count - completed}
        </span>
      </div>
    </div>
  );
}
export default function DashboardPage() {
  const { session, users, professionals, appointments, records } = useApp();
  const monday = startWeek();
  const weeklyCounts = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday); d.setDate(monday.getDate()+i);
    const date = dateAt(d);
    return appointments.filter(a => a.data === date && a.status !== 'Cancelada').length;
  });
  const maxDaily = Math.max(1, ...weeklyCounts);
  const weekly = weeklyCounts.map(n => Math.round(100*n/maxDaily));
  const completed = appointments.filter((a) => a.status === 'Agendado').length;
  const today = appointments.filter((a) => a.data === todayISO()).length;
  const recent = appointments.filter(a => a.status !== 'Cancelada' && a.data >= todayISO())
    .sort((a, b) => a.data.localeCompare(b.data))
    .slice(0, 5);
  const first = (session?.nome || "").split(" ")[0];
  return (
    <div className="dashboard-page">
      <div className="dashboard-intro">
        <div>
          <div className="eyebrow">SEU PAINEL DE GESTÃO</div>
          <h1>
            Olá, {first}! <span className="hello-emoji">✳</span>
          </h1>
          <p>Veja o que está acontecendo na sua clínica hoje.</p>
        </div>
        <div className="today-pill">
          <CalendarDays size={17} />
          {new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" }).format(
            new Date(),
          )}
        </div>
      </div>
      <div className="hero-banner">
        <div className="hero-content">
          <span className="hero-kicker">UMA ROTINA MAIS LEVE</span>
          <h2>Cuidar de pessoas começa com uma gestão eficiente.</h2>
          <p>Seus dados, atendimentos e equipes em um só lugar.</p>
          <Link className="hero-link" to="/agendamentos">
            Ver agendamentos <ArrowRight size={16} />
          </Link>
        </div>
        <div className="hero-orbit">
          <div className="orbit-circle orbit-one" />
          <div className="orbit-circle orbit-two" />
          <div className="hero-plus">+</div>
          <div className="hero-pulse">
            <Activity size={38} />
          </div>
        </div>
      </div>
      <div className="stats-grid">
        <Metric
          icon={UsersRound}
          title="Usuários cadastrados"
          value={session?.perfil === "ADMINISTRADOR" ? users.length : "—"}
          sub="Contas da equipe no MySQL"
          color="blue"
        />
        <Metric
          icon={CalendarDays}
          title="Consultas agendadas"
          value={appointments.length}
          sub="Consultas registradas no MySQL"
          color="purple"
        />
        <Metric
          icon={ClipboardList}
          title="Prontuários"
          value={session?.perfil === "RECEPCAO" ? "—" : records.length}
          sub={session?.perfil === "RECEPCAO" ? "Acesso restrito" : "Registros no PostgreSQL"}
          color="aqua"
        />
        <Metric
          icon={Activity}
          title="Consultas hoje"
          value={today}
          sub="Agendadas para esta data"
          color="orange"
        />
      </div>
      <div className="analytics-grid">
        <section className="panel analytics-panel">
          <div className="panel-heading">
            <div>
              <h3>Visão de atendimentos</h3>
              <p>Agendamentos por dia nesta semana</p>
            </div>
            <span className="subtle-pill">7 dias</span>
          </div>
          <div className="chart-legend">
            <span>
              <i className="legend-blue" />
              Agendamentos
            </span>
            <span>
              <i className="legend-pale" />
              Atendimentos
            </span>
          </div>
          <div className="chart-body">
            <div className="chart-y">
              <span>{maxDaily}</span>
              <span>{Math.round(maxDaily * 0.75)}</span>
              <span>{Math.round(maxDaily * 0.5)}</span>
              <span>{Math.round(maxDaily * 0.25)}</span>
              <span>0</span>
            </div>
            <div className="chart-main">
              <div className="chart-lines">
                <i />
                <i />
                <i />
                <i />
                <i />
              </div>
              <div className="chart-bars">
                {weekly.map((val, i) => (
                  <div key={i} className="chart-col">
                    <div className="bar-track">
                      <div className="bar-fill" style={{ height: `${val}%` }} />
                    </div>
                    <span>
                      {["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"][i]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
        <section className="panel status-panel">
          <div className="panel-heading">
            <div>
              <h3>Status das consultas</h3>
              <p>Progresso dos agendamentos</p>
            </div>
            <span className="tiny-circle">
              <CalendarCheck2 size={17} />
            </span>
          </div>
          <Gauge count={appointments.length} completed={completed} />
        </section>
      </div>
      <div className="lower-grid">
        <section className="panel appointments-panel">
          <div className="panel-heading">
            <div>
              <h3>Próximos agendamentos</h3>
              <p>Consultas registradas no sistema</p>
            </div>
            <Link className="text-link" to="/agendamentos">
              Ver todos <ArrowRight size={15} />
            </Link>
          </div>
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Paciente</th>
                  <th>Médico</th>
                  <th>Data e hora</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((a) => (
                  <tr key={a.id}>
                    <td>
                      <div className="table-person">
                        <div className="avatar avatar-soft">
                          {initials(a.paciente)}
                        </div>
                        <div>
                          <strong>{a.paciente}</strong>
                          <small>{a.id}</small>
                        </div>
                      </div>
                    </td>
                    <td>{a.medico}</td>
                    <td>
                      {brDate(a.data)} · {a.hora}
                    </td>
                    <td>
                      <StatusBadge value={a.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <section className="panel care-panel">
          <div className="panel-heading">
            <div>
              <h3>Equipe e cuidado</h3>
              <p>Profissionais cadastrados</p>
            </div>
            <div className="doctor-small-icon">
              <Stethoscope size={18} />
            </div>
          </div>
          <div className="doctor-feature">
            <div className="doctor-feature-art">
              <Stethoscope size={47} />
            </div>
            <div>
              <small>PROFISSIONAIS</small>
              <strong>
                {professionals.length} médicos
              </strong>
              <p>Disponíveis na base de demonstração</p>
            </div>
          </div>
          <div className="doctor-roster">
            {professionals
              .slice(0, 3)
              .map((u) => (
                <div className="doctor-row" key={u.id}>
                  <div className="avatar avatar-secondary">
                    {initials(u.nome)}
                  </div>
                  <div>
                    <strong>{u.nome}</strong>
                    <small>Profissional de saúde</small>
                  </div>
                  <span className="available">Ativo</span>
                </div>
              ))}
          </div>
          {session?.perfil === "ADMINISTRADOR" && (
            <Link to="/usuarios" className="doctor-bottom-link">Gerenciar usuários <ArrowRight size={15} /></Link>
          )}
        </section>
      </div>
      <p className="data-disclaimer">
        * Ambiente acadêmico demonstrativo. Os números e exemplos não
        representam dados clínicos reais.
      </p>
    </div>
  );
}
