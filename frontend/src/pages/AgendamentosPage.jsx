import { useMemo, useState } from "react";
import { Plus, Search, CalendarDays, Clock3, CheckCircle2, CalendarX2 } from "lucide-react";
import { useApp } from "../context/AppContext";
import Modal from "../components/Modal";
import EmptyState from "../components/EmptyState";
import StatusBadge from "../components/StatusBadge";
import { brDate, todayISO, initials } from "../utils/format";
// LUMERA_PACIENTES_RECEPCAO_DEMO_V1: lista carregada do Auth Service via AppContext

// LUMERA_AGENDAMENTO_REAL_V1 — dados reais no MySQL, nomes de pacientes fictícios.
const dia = (v) => String(v || "").slice(0, 10);
const hora = (v) => String(v || "").slice(11, 16);

export default function AgendamentosPage() {
  const {
    appointments, agendas, disponibilidades, pacientes, usersLoading, usersError, appointmentsLoading,
    appointmentsError, createAppointment, cancelAppointment,
  } = useApp();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("Todos");
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ pacienteId: "", disponibilidadeId: "", data: todayISO(), hora: "09:00" });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [cancelling, setCancelling] = useState(null);

  const disponiveis = useMemo(() => disponibilidades
    .filter((d) => agendas.some((a) => a.id === d.agendaId && a.ativa))
    .sort((a, b) => String(a.inicio).localeCompare(String(b.inicio))),
  [disponibilidades, agendas]);

  const filtered = useMemo(() => appointments.filter((a) =>
    `${a.paciente} ${a.medico} ${a.especialidade} ${a.pacienteId}`
      .toLowerCase().includes(q.toLowerCase()) &&
    (filter === "Todos" || a.status === filter)
  ).sort((a, b) => a.data.localeCompare(b.data) || a.hora.localeCompare(b.hora)),
  [appointments, q, filter]);

  const openNew = () => {
    const primeira = disponiveis.find((d) => dia(d.fim) >= todayISO()) || disponiveis[0];
    setSaveError("");
    setForm({
      pacienteId: pacientes[0]?.id || "",
      disponibilidadeId: primeira?.id || "",
      data: primeira ? dia(primeira.inicio) : todayISO(),
      hora: primeira ? hora(primeira.inicio) : "09:00",
    });
    setModal(true);
  };

  const changeDisponibilidade = (id) => {
    const selecionada = disponiveis.find((d) => d.id === id);
    setForm((old) => ({
      ...old,
      disponibilidadeId: id,
      data: selecionada ? dia(selecionada.inicio) : old.data,
      hora: selecionada ? hora(selecionada.inicio) : old.hora,
    }));
  };

  const save = async (e) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setSaveError("");
    try {
      const result = await createAppointment(form);
      if (result.ok) setModal(false);
      else setSaveError(result.message || "Não foi possível agendar.");
    } finally { setSaving(false); }
  };

  const cancelar = async (a) => {
    if (cancelling || a.status === "Cancelada") return;
    if (!window.confirm("Cancelar este agendamento no MySQL?")) return;
    setCancelling(a.id);
    try {
      const result = await cancelAppointment(a.id);
      if (!result.ok) window.alert(result.message || "Não foi possível cancelar.");
    } finally { setCancelling(null); }
  };

  return (
    <div className="module-page">
      <div className="module-heading">
        <div>
          <div className="eyebrow">ORGANIZAÇÃO DA CLÍNICA</div>
          <h1>Agendamentos</h1>
          <p>Consulte e organize as consultas registradas no MySQL.</p>
        </div>
        <button className="primary-button" type="button" onClick={openNew} disabled={appointmentsLoading}>
          <Plus size={18} /> Novo agendamento
        </button>
      </div>
      <div className="module-stats">
        <div className="simple-stat">
          <div className="metric-icon blue"><CalendarDays size={20} /></div>
          <span>Total de consultas</span><strong>{appointments.length}</strong>
        </div>
        <div className="simple-stat">
          <div className="metric-icon aqua"><CheckCircle2 size={20} /></div>
          <span>Agendadas</span>
          <strong>{appointments.filter((a) => a.status === "Agendado").length}</strong>
        </div>
        <div className="simple-stat">
          <div className="metric-icon orange"><Clock3 size={20} /></div>
          <span>Canceladas</span>
          <strong>{appointments.filter((a) => a.status === "Cancelada").length}</strong>
        </div>
      </div>
      <section className="panel module-panel">
        <div className="panel-heading"><div>
          <h3>Agenda de consultas</h3>
          <p>Registros persistidos no banco MySQL · duração de 30 minutos</p>
        </div></div>
        <div className="filterbar">
          <div className="filter-search"><Search size={18}/>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar paciente ou agendamento" />
          </div>
          <select aria-label="Filtrar status" value={filter} onChange={(e) => setFilter(e.target.value)}>
            {["Todos", "Agendado", "Cancelada"].map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
        {appointmentsError && <p className="form-error" role="alert">{appointmentsError}</p>}
        {appointmentsLoading ? <p role="status">Carregando agendamentos do MySQL...</p> : filtered.length ? (
          <div className="table-scroll"><table className="data-table">
            <thead><tr><th>Paciente</th><th>Atendimento / profissional</th><th>Data</th><th>Horário</th><th>Status</th><th>Ações</th></tr></thead>
            <tbody>{filtered.map((a) => <tr key={a.id}>
              <td><div className="table-person">
                <div className="avatar avatar-soft">{initials(a.paciente)}</div>
                <div><strong>{a.paciente}</strong><small>{a.id.slice(0, 8)}</small></div>
              </div></td>
              <td><strong className="table-main-text">{a.especialidade}</strong>
                <small className="table-subtext">{a.medico}</small></td>
              <td>{brDate(a.data)}</td>
              <td>{a.hora}</td>
              <td><StatusBadge value={a.status} /></td>
              <td><div className="table-actions">
                <button type="button" className="icon-button danger-hover"
                  aria-label="Cancelar agendamento" title="Cancelar no MySQL (para remarcar, crie outro)"
                  disabled={a.status === "Cancelada" || cancelling === a.id}
                  onClick={() => cancelar(a)}><CalendarX2 size={17}/></button>
              </div></td>
            </tr>)}</tbody>
          </table></div>
        ) : <EmptyState />}
      </section>
      {modal && <Modal title="Novo agendamento" subtitle="Selecione um cadastro ativo com perfil Recepção (MySQL)"
        onClose={() => { if (!saving) setModal(false); }}>
        <form className="modal-form" onSubmit={save}>
          {saveError && <p className="form-error" role="alert">{saveError}</p>}
          <label>Paciente (cadastro Recepção do MySQL)
            <select required value={form.pacienteId} disabled={saving}
              onChange={(e) => setForm({ ...form, pacienteId: e.target.value })}>
              <option value="">Selecione o paciente</option>
              {pacientes.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
            </select>
          </label>
          <label>Agenda e horário de disponibilidade
            <select required value={form.disponibilidadeId} disabled={saving}
              onChange={(e) => changeDisponibilidade(e.target.value)}>
              <option value="">Selecione uma disponibilidade</option>
              {disponiveis.map((d) => <option key={d.id} value={d.id}>
                {brDate(dia(d.inicio))} · {hora(d.inicio)}–{hora(d.fim)} · agenda {d.agendaId.slice(0, 8)}
              </option>)}
            </select>
          </label>
          <div className="form-row">
            <label>Data
              <input required type="date" value={form.data} disabled={saving}
                onChange={(e) => setForm({ ...form, data: e.target.value })}/>
            </label>
            <label>Horário (30 minutos)
              <input required type="time" step="1800" value={form.hora} disabled={saving}
                onChange={(e) => setForm({ ...form, hora: e.target.value })}/>
            </label>
          </div>
          <p className="form-note">O profissional é aquele vinculado à agenda no banco. A API verifica disponibilidade, bloqueios e conflitos. Para esta apresentação, as contas ativas com perfil Recepção são usadas como pacientes. O vínculo é feito por identificador estável; um sistema real precisa de cadastro próprio de pacientes.</p>
          {!disponiveis.length && <p className="form-error" role="alert">Não há agendas ativas com disponibilidades cadastradas no MySQL.</p>}
          {usersLoading && <p role="status">Carregando cadastros do MySQL...</p>}
          {usersError && <p className="form-error" role="alert">{usersError}</p>}
          {!usersLoading && !pacientes.length && <p className="form-error" role="alert">Nenhum usuário ativo com perfil Recepção foi encontrado. Acesse Usuários da equipe e verifique o perfil cadastrado (é necessário estar como administrador).</p>}
          <div className="modal-actions">
            <button type="button" className="secondary-button" disabled={saving} onClick={() => setModal(false)}>Cancelar</button>
            <button className="primary-button" type="submit" disabled={saving || !disponiveis.length || !pacientes.length}>
              {saving ? "Salvando..." : "Salvar agendamento"}
            </button>
          </div>
        </form>
      </Modal>}
    </div>
  );
}
