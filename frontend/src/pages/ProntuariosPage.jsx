import { useMemo, useState } from "react";
import {
  Plus,
  Search,
  ClipboardList,
  FileCheck2,
  Eye,
  Pencil,
  ShieldCheck,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import Modal from "../components/Modal";
import EmptyState from "../components/EmptyState";
import StatusBadge from "../components/StatusBadge";
import { brDate, todayISO, initials } from "../utils/format";
const empty = {
  paciente: "",
  medico: "",
  data: todayISO(),
  tipo: "Consulta de rotina",
  observacoes: "",
};
export default function ProntuariosPage() {
  // LUMERA_REAL_PRONTUARIOS_V1
  const { records, pacientes, usersLoading, usersError, createRecord, updateRecord, recordsLoading, recordsError, professionals, professionalsLoading, professionalsError } = useApp();
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [q, setQ] = useState("");
  const [modal, setModal] = useState(false);
  const [edit, setEdit] = useState(null);
  const [view, setView] = useState(null);
  const [form, setForm] = useState(empty);
  const filtered = useMemo(
    () =>
      records.filter((r) =>
        `${r.paciente} ${r.medico} ${r.tipo}`
          .toLowerCase()
          .includes(q.toLowerCase()),
      ),
    [records, q],
  );
  const openNew = () => {
    setEdit(null);
    setSaveError("");
    setForm({ ...empty });
    setModal(true);
  };
  const openEdit = (r) => {
    setEdit(r.id);
    setSaveError("");
    setForm({ ...r });
    setModal(true);
  };
  const save = async (e) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setSaveError("");
    try {
      const result = edit ? await updateRecord(edit, form) : await createRecord(form);
      if (result.ok) setModal(false);
      else setSaveError(result.message || "Nao foi possivel salvar o prontuario.");
    } finally {
      setSaving(false);
    }
  };
  return (
    <div className="module-page">
      <div className="module-heading">
        <div>
          <div className="eyebrow">HISTÓRICO DE CUIDADO</div>
          <h1>Prontuários médicos</h1>
          <p>Registros organizados para o acompanhamento de atendimentos.</p>
        </div>
        <button className="primary-button" type="button" onClick={openNew}>
          <Plus size={18} /> Novo prontuário
        </button>
      </div>
      <div className="privacy-banner">
        <div className="privacy-icon">
          <ShieldCheck size={23} />
        </div>
        <div>
          <strong>Dados fictícios, ambiente de aprendizado</strong>
          <p>
            Use apenas dados fictícios. Os registros de teste são armazenados
            no PostgreSQL e a API exige autenticação.
          </p>
        </div>
      </div>
      <div className="module-stats">
        <div className="simple-stat">
          <div className="metric-icon blue">
            <ClipboardList size={20} />
          </div>
          <span>Registros totais</span>
          <strong>{records.length}</strong>
        </div>
        <div className="simple-stat">
          <div className="metric-icon aqua">
            <FileCheck2 size={20} />
          </div>
          <span>Finalizados</span>
          <strong>
            {records.filter((r) => r.status === "Finalizado").length}
          </strong>
        </div>
        <div className="simple-stat">
          <div className="metric-icon purple">
            <Eye size={20} />
          </div>
          <span>Em análise</span>
          <strong>
            {records.filter((r) => r.status === "Em análise").length}
          </strong>
        </div>
      </div>
      <section className="panel module-panel">
        <div className="panel-heading">
          <div>
            <h3>Histórico de atendimentos</h3>
            <p>Consulte os prontuários cadastrados no PostgreSQL</p>
          </div>
        </div>
        <div className="filterbar">
          <div className="filter-search">
            <Search size={18} />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar paciente, médico ou tipo"
            />
          </div>
        </div>
        {recordsError && <p role="alert" style={{ color: "#b42318", margin: "12px 0" }}>{recordsError}</p>}
        {recordsLoading ? <p>Carregando prontuários...</p> : filtered.length ? (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Paciente</th>
                  <th>Atendimento</th>
                  <th>Profissional</th>
                  <th>Data</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <div className="table-person">
                        <div className="avatar avatar-soft">
                          {initials(r.paciente)}
                        </div>
                        <div>
                          <strong>{r.paciente}</strong>
                          <small>{r.id}</small>
                        </div>
                      </div>
                    </td>
                    <td>{r.tipo}</td>
                    <td>{r.medico}</td>
                    <td>{brDate(r.data)}</td>
                    <td>
                      <StatusBadge value={r.status} />
                    </td>
                    <td>
                      <div className="table-actions">
                        <button
                          className="icon-button"
                          type="button"
                          onClick={() => setView(r)}
                          aria-label="Visualizar prontuário"
                        >
                          <Eye size={17} />
                        </button>
                        <button
                          className="icon-button"
                          type="button"
                          onClick={() => openEdit(r)}
                          aria-label="Editar prontuário"
                        >
                          <Pencil size={16} />
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
      {view && (
        <Modal
          title={`Prontuário ${view.id}`}
          subtitle={`${view.paciente} · ${brDate(view.data)}`}
          onClose={() => setView(null)}
        >
          <div className="record-detail">
            <div>
              <span>Médico</span>
              <strong>{view.medico}</strong>
            </div>
            <div>
              <span>Tipo</span>
              <strong>{view.tipo}</strong>
            </div>
            <div>
              <span>Status</span>
              <StatusBadge value={view.status} />
            </div>
            <div className="record-observations">
              <span>Observações do atendimento fictício</span>
              <p>{view.observacoes}</p>
            </div>
          </div>
          <div className="modal-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={() => setView(null)}
            >
              Fechar
            </button>
          </div>
        </Modal>
      )}
      {modal && (
        <Modal
          title={edit ? "Editar prontuário" : "Novo prontuário"}
          subtitle="Use apenas informações fictícias"
          onClose={() => setModal(false)}
        >
          <form className="modal-form" onSubmit={save}>
            {saveError && <p role="alert" style={{ color: "#b42318" }}>{saveError}</p>}
            {/* LUMERA_PRONTUARIO_PACIENTES_MYSQL_V1: pacientes cadastrados ativos no MySQL, mesma lista de Agendamentos */}
            <label>
              Paciente (cadastro Recepcao do MySQL)
              <select
                required
                value={form.paciente}
                onChange={(e) => setForm({ ...form, paciente: e.target.value })}
                disabled={saving || usersLoading || !pacientes.length}
              >
                <option value="">Selecione um paciente cadastrado</option>
                {pacientes.map((p) => (
                  <option key={p.id} value={p.nome}>{p.nome}</option>
                ))}
              </select>
              {usersLoading && <small>Carregando cadastros do MySQL...</small>}
              {usersError && <small className="form-error">{usersError}</small>}
              {!usersLoading && !usersError && !pacientes.length && (
                <small className="form-error">Nenhum cadastro ativo com perfil Recepcao encontrado no MySQL.</small>
              )}
            </label>
            <div className="form-row">
              <label>
                Profissional
                <select
                required
                value={form.medico}
                onChange={(e) => setForm({ ...form, medico: e.target.value })}
                disabled={professionalsLoading}
              >
                <option value="">Selecione um profissional cadastrado</option>
                {form.medico && !professionals.some(p => p.nome === form.medico) && (
                  <option value={form.medico}>{form.medico} (registro anterior)</option>
                )}
                {professionals.map(p => <option key={p.id} value={p.nome}>{p.nome}</option>)}
              </select>
              {professionalsError && <small className="form-error">{professionalsError}</small>}
              {!professionalsLoading && !professionalsError && professionals.length === 0 && (
                <small>Cadastre ou habilite um usuario do perfil Profissional de Saude na tela Usuarios.</small>
              )}
              </label>
              <label>
                Data
                <input
                  required
                  type="date"
                  value={form.data}
                  onChange={(e) => setForm({ ...form, data: e.target.value })}
                />
              </label>
            </div>
            <label>
              Tipo de atendimento
              <input
                required
                value={form.tipo}
                onChange={(e) => setForm({ ...form, tipo: e.target.value })}
              />
            </label>
            <label>
              Observações
              <textarea
                required
                rows={5}
                maxLength={2000}
                value={form.observacoes}
                onChange={(e) =>
                  setForm({ ...form, observacoes: e.target.value })
                }
                placeholder="Descreva um exemplo fictício de atendimento..."
              />
            </label>
            {edit && (
              <label>
                Status
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  <option>Em análise</option>
                  <option>Finalizado</option>
                </select>
              </label>
            )}
            <div className="modal-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setModal(false)}
              >
                Cancelar
              </button>
              <button type="submit" className="primary-button" disabled={saving}>
                {saving ? "Salvando..." : "Salvar prontuário"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
