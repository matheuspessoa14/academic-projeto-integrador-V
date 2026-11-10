import { useMemo, useState } from "react";
import {
  Plus,
  Search,
  UsersRound,
  UserRoundPlus,
  Trash2,
  Mail,
  Phone,
  ShieldCheck,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import Modal from "../components/Modal";
import EmptyState from "../components/EmptyState";
import StatusBadge from "../components/StatusBadge";
import { initials } from "../utils/format";
const roles = ["Paciente", "Médico", "Recepcionista", "Administrador"];
export default function UsuariosPage() {
  const { users, createUser, removeUser } = useApp();
  const [q, setQ] = useState("");
  const [role, setRole] = useState("Todos");
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({
    nome: "",
    email: "",
    telefone: "",
    perfil: "Paciente",
  });
  const [error, setError] = useState("");
  const filtered = useMemo(
    () =>
      users.filter(
        (u) =>
          `${u.nome} ${u.email}`.toLowerCase().includes(q.toLowerCase()) &&
          (role === "Todos" || u.perfil === role),
      ),
    [users, q, role],
  );
  const submit = (e) => {
    e.preventDefault();
    const result = createUser(form);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setModal(false);
    setForm({ nome: "", email: "", telefone: "", perfil: "Paciente" });
    setError("");
  };
  return (
    <div className="module-page">
      <div className="module-heading">
        <div>
          <div className="eyebrow">CADASTROS E ACESSOS</div>
          <h1>Usuários e pacientes</h1>
          <p>Organize os perfis de acesso ao sistema em um só lugar.</p>
        </div>
        <button className="primary-button" onClick={() => setModal(true)}>
          <Plus size={18} /> Novo usuário
        </button>
      </div>
      <div className="module-stats">
        <div className="simple-stat">
          <div className="metric-icon blue">
            <UsersRound size={20} />
          </div>
          <span>Total de usuários</span>
          <strong>{users.length}</strong>
        </div>
        <div className="simple-stat">
          <div className="metric-icon aqua">
            <UserRoundPlus size={20} />
          </div>
          <span>Pacientes</span>
          <strong>{users.filter((u) => u.perfil === "Paciente").length}</strong>
        </div>
        <div className="simple-stat">
          <div className="metric-icon purple">
            <ShieldCheck size={20} />
          </div>
          <span>Equipe interna</span>
          <strong>{users.filter((u) => u.perfil !== "Paciente").length}</strong>
        </div>
      </div>
      <section className="panel module-panel">
        <div className="panel-heading">
          <div>
            <h3>Usuários cadastrados</h3>
            <p>Gerencie as contas do ambiente demonstrativo</p>
          </div>
        </div>
        <div className="filterbar">
          <div className="filter-search">
            <Search size={18} />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por nome ou e-mail"
              aria-label="Buscar usuários"
            />
          </div>
          <select
            aria-label="Filtrar por perfil"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option>Todos</option>
            {roles.map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </div>
        {filtered.length ? (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Usuário</th>
                  <th>Contato</th>
                  <th>Perfil</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div className="table-person">
                        <div className="avatar avatar-soft">
                          {initials(u.nome)}
                        </div>
                        <div>
                          <strong>{u.nome}</strong>
                          <small>{u.id}</small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="contact-line">
                        <Mail size={14} />
                        {u.email}
                      </span>
                      <span className="contact-line">
                        <Phone size={14} />
                        {u.telefone || "—"}
                      </span>
                    </td>
                    <td>
                      <span className="role-chip">{u.perfil}</span>
                    </td>
                    <td>
                      <StatusBadge value={u.ativo ? "Ativo" : "Inativo"} />
                    </td>
                    <td>
                      <button
                        className="icon-button danger-hover"
                        type="button"
                        onClick={() => {
                          if (
                            window.confirm(`Remover ${u.nome} da demonstração?`)
                          )
                            removeUser(u.id);
                        }}
                        aria-label={`Remover ${u.nome}`}
                      >
                        <Trash2 size={17} />
                      </button>
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
          title="Cadastrar usuário"
          subtitle="Novo registro demonstrativo, sem banco de dados"
          onClose={() => setModal(false)}
        >
          <form className="modal-form" onSubmit={submit}>
            <label>
              Nome completo
              <input
                required
                minLength={3}
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                placeholder="Ex.: Maria Oliveira"
              />
            </label>
            <label>
              E-mail
              <input
                required
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="nome@exemplo.com"
              />
            </label>
            <div className="form-row">
              <label>
                Telefone
                <input
                  value={form.telefone}
                  onChange={(e) =>
                    setForm({ ...form, telefone: e.target.value })
                  }
                  placeholder="(21) 99999-9999"
                />
              </label>
              <label>
                Perfil
                <select
                  value={form.perfil}
                  onChange={(e) => setForm({ ...form, perfil: e.target.value })}
                >
                  {roles.map((r) => (
                    <option key={r}>{r}</option>
                  ))}
                </select>
              </label>
            </div>
            <p className="form-note">
              No sistema real, perfis privilegiados só serão atribuídos por
              administradores autenticados.
            </p>
            {error && <p className="form-error">{error}</p>}
            <div className="modal-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setModal(false)}
              >
                Cancelar
              </button>
              <button type="submit" className="primary-button">
                Salvar usuário
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
