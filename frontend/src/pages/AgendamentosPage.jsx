import { useMemo, useState } from "react";
import {
  Plus,
  Search,
  CalendarDays,
  Clock3,
  CheckCircle2,
  CalendarX2,
  Pencil,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import Modal from "../components/Modal";
import EmptyState from "../components/EmptyState";
import StatusBadge from "../components/StatusBadge";
import { brDate, todayISO, initials } from "../utils/format";
const empty = {
  paciente: "",
  medico: "",
  especialidade: "Clínica geral",
  data: todayISO(),
  hora: "09:00",
};
export default function AgendamentosPage() {
  const { appointments, users, createAppointment, updateAppointment } =
    useApp();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("Todos");
  const [modal, setModal] = useState(false);
  const [edit, setEdit] = useState(null);
  const [form, setForm] = useState(empty);
  const filtered = useMemo(
    () =>
      appointments
        .filter(
          (a) =>
            `${a.paciente} ${a.medico} ${a.especialidade}`
              .toLowerCase()
              .includes(q.toLowerCase()) &&
            (filter === "Todos" || a.status === filter),
        )
        .sort(
          (a, b) =>
            a.data.localeCompare(b.data) || a.hora.localeCompare(b.hora),
        ),
    [appointments, q, filter],
  );
  const openNew = () => {
    setEdit(null);
    setForm({ ...empty });
    setModal(true);
  };
  const openEdit = (a) => {
    setEdit(a.id);
    setForm({ ...a });
    setModal(true);
  };
  const save = (e) => {
    e.preventDefault();
    if (edit) updateAppointment(edit, form);
    else createAppointment(form);
    setModal(false);
  };
  return (
    <div className="module-page">
      <div className="module-heading">
        <div>
          <div className="eyebrow">ORGANIZAÇÃO DA CLÍNICA</div>
          <h1>Agendamentos</h1>
          <p>Visualize e organize a agenda de consultas com facilidade.</p>
        </div>
        <button className="primary-button" type="button" onClick={openNew}>
          <Plus size={18} /> Novo agendamento
        </button>
      </div>
      <div className="module-stats">
        <div className="simple-stat">
          <div className="metric-icon blue">
            <CalendarDays size={20} />
          </div>
          <span>Total de consultas</span>
          <strong>{appointments.length}</strong>
        </div>
        <div className="simple-stat">
          <div className="metric-icon aqua">
            <CheckCircle2 size={20} />
          </div>
          <span>Confirmadas</span>
          <strong>
            {appointments.filter((a) => a.status === "Confirmada").length}
          </strong>
        </div>
        <div className="simple-stat">
          <div className="metric-icon orange">
            <Clock3 size={20} />
          </div>
          <span>Pendentes</span>
          <strong>
            {appointments.filter((a) => a.status === "Pendente").length}
          </strong>
        </div>
      </div>
      <section className="panel module-panel">
        <div className="panel-heading">
          <div>
            <h3>Agenda de consultas</h3>
            <p>Cadastros locais para demonstração</p>
          </div>
        </div>
        <div className="filterbar">
          <div className="filter-search">
            <Search size={18} />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar paciente, médico ou especialidade"
            />
          </div>
          <select
            aria-label="Filtrar status"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            {[
              "Todos",
              "Confirmada",
              "Pendente",
              "Em andamento",
              "Concluída",
              "Cancelada",
            ].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </div>
        {filtered.length ? (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Paciente</th>
                  <th>Especialidade / médico</th>
                  <th>Data</th>
                  <th>Horário</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a) => (
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
                    <td>
                      <strong className="table-main-text">
                        {a.especialidade}
                      </strong>
                      <small className="table-subtext">{a.medico}</small>
                    </td>
                    <td>{brDate(a.data)}</td>
                    <td>{a.hora}</td>
                    <td>
                      <StatusBadge value={a.status} />
                    </td>
                    <td>
                      <div className="table-actions">
                        <button
                          type="button"
                          className="icon-button"
                          aria-label="Editar agendamento"
                          onClick={() => openEdit(a)}
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          type="button"
                          className="icon-button danger-hover"
                          title="Cancelar agendamento"
                          disabled={a.status === "Cancelada"}
                          onClick={() => {
                            if (
                              window.confirm(
                                "Cancelar esta consulta demonstrativa?",
                              )
                            )
                              updateAppointment(a.id, { status: "Cancelada" });
                          }}
                        >
                          <CalendarX2 size={17} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState />
        )}
      </section>
      {modal && (
        <Modal
          title={edit ? "Editar agendamento" : "Novo agendamento"}
          subtitle="As alterações ficam salvas apenas neste navegador"
          onClose={() => setModal(false)}
        >
          <form className="modal-form" onSubmit={save}>
            <label>
              Paciente
              <input
                required
                list="patients-list"
                value={form.paciente}
                onChange={(e) => setForm({ ...form, paciente: e.target.value })}
                placeholder="Selecione ou informe o paciente"
              />
              <datalist id="patients-list">
                {users
                  .filter((u) => u.perfil === "Paciente")
                  .map((u) => (
                    <option value={u.nome} key={u.id} />
                  ))}
              </datalist>
            </label>
            <div className="form-row">
              <label>
                Médico
                <input
                  required
                  list="doctors-list"
                  value={form.medico}
                  onChange={(e) => setForm({ ...form, medico: e.target.value })}
                  placeholder="Nome do profissional"
                />
                <datalist id="doctors-list">
                  {users
                    .filter((u) => u.perfil === "Médico")
                    .map((u) => (
                      <option value={u.nome} key={u.id} />
                    ))}
                </datalist>
              </label>
              <label>
                Especialidade
                <select
                  value={form.especialidade}
                  onChange={(e) =>
                    setForm({ ...form, especialidade: e.target.value })
                  }
                >
                  {[
                    "Clínica geral",
                    "Dermatologia",
                    "Cardiologia",
                    "Pediatria",
                    "Ortopedia",
                    "Outros",
                  ].map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </label>
            </div>
            <div className="form-row">
              <label>
                Data
                <input
                  required
                  type="date"
                  value={form.data}
                  onChange={(e) => setForm({ ...form, data: e.target.value })}
                />
              </label>
              <label>
                Horário
                <input
                  required
                  type="time"
                  value={form.hora}
                  onChange={(e) => setForm({ ...form, hora: e.target.value })}
                />
              </label>
            </div>
            {edit && (
              <label>
                Status
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  {[
                    "Pendente",
                    "Confirmada",
                    "Em andamento",
                    "Concluída",
                    "Cancelada",
                  ].map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </label>
            )}
            <div className="modal-actions">
              <button
                className="secondary-button"
                type="button"
                onClick={() => setModal(false)}
              >
                Cancelar
              </button>
              <button className="primary-button" type="submit">
                Salvar agendamento
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
