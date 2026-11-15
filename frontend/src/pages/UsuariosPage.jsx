import { useMemo, useState } from "react";
import {
  Plus,
  Search,
  UsersRound,
  UserRoundPlus,
  ShieldCheck,
  Mail,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import Modal from "../components/Modal";
import EmptyState from "../components/EmptyState";
import StatusBadge from "../components/StatusBadge";
import { initials } from "../utils/format";

const roles = [
  { codigo: "ADMINISTRADOR", nome: "Gestor / Administrador" },
  { codigo: "PROFISSIONAL_SAUDE", nome: "Profissional de Saúde" },
  { codigo: "RECEPCAO", nome: "Recepção / Coordenação" },
];

const emptyForm = { nome: "", email: "", senha: "" };

export default function UsuariosPage() {
  const { users, usersLoading, usersError, session, createUser } = useApp();
  const [q, setQ] = useState("");
  const [role, setRole] = useState("Todos");
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const isAdmin = session?.perfil === "ADMINISTRADOR";
  const ativos = users.filter((u) => u.ativo).length;
  const filtered = useMemo(
    () => users.filter((u) =>
      `${u.nome} ${u.email}`.toLowerCase().includes(q.toLowerCase()) &&
      (role === "Todos" || u.role === role)
    ),
    [users, q, role]
  );

  function closeModal() {
    if (saving) return;
    setModal(false);
    setError("");
    setForm(emptyForm);
  }

  async function submit(event) {
    event.preventDefault();
    if (saving) return;
    setError("");
    setSaving(true);
    try {
      const result = await createUser(form);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setModal(false);
      setForm(emptyForm);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="module-page">
      <div className="module-heading">
        <div>
          <div className="eyebrow">CADASTROS E ACESSOS</div>
          <h1>Usuários da equipe</h1>
          <p>Contas de acesso cadastradas no MySQL do Senac.</p>
        </div>
        {isAdmin && (
          <button
            className="primary-button"
            type="button"
            onClick={() => { setError(""); setModal(true); }}
          >
            <Plus size={18} /> Novo usuário
          </button>
        )}
      </div>

      <div className="module-stats">
        <div className="simple-stat">
          <div className="metric-icon blue"><UsersRound size={20} /></div>
          <span>Total de usuários</span>
          <strong>{users.length}</strong>
        </div>
        <div className="simple-stat">
          <div className="metric-icon aqua"><UserRoundPlus size={20} /></div>
          <span>Usuários ativos</span>
          <strong>{ativos}</strong>
        </div>
        <div className="simple-stat">
          <div className="metric-icon purple"><ShieldCheck size={20} /></div>
          <span>Perfis disponíveis</span>
          <strong>{roles.length}</strong>
        </div>
      </div>

      <section className="panel module-panel">
        <div className="panel-heading">
          <div>
            <h3>Usuários cadastrados</h3>
            <p>Listagem real da API de autenticação</p>
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
            <option value="Todos">Todos</option>
            {roles.map((r) => (
              <option key={r.codigo} value={r.codigo}>{r.nome}</option>
            ))}
          </select>
        </div>

        {!isAdmin ? (
          <p className="form-error" role="alert">A listagem de usuários está disponível apenas para administradores.</p>
        ) : usersLoading ? (
          <p role="status">Carregando usuários do banco de dados...</p>
        ) : usersError ? (
          <p className="form-error" role="alert">{usersError}</p>
        ) : filtered.length ? (
          <div className="table-scroll">
            <table className="data-table">
              <thead><tr>
                <th>Usuário</th>
                <th>Contato</th>
                <th>Perfil</th>
                <th>Status</th>
              </tr></thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div className="table-person">
                        <div className="avatar avatar-soft">{initials(u.nome)}</div>
                        <div><strong>{u.nome}</strong><small>{u.id}</small></div>
                      </div>
                    </td>
                    <td><span className="contact-line"><Mail size={14} /> {u.email}</span></td>
                    <td><span className="role-chip">{u.perfil || u.role}</span></td>
                    <td><StatusBadge value={u.ativo ? "Ativo" : "Inativo"} /></td>
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
          subtitle="Crie uma conta de acesso para um funcionário da equipe."
          onClose={closeModal}
        >
          <form className="modal-form" onSubmit={submit}>
            <label>
              Nome completo
              <input
                required
                minLength={3}
                maxLength={120}
                autoComplete="name"
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                placeholder="Ex.: Maria Oliveira"
                disabled={saving}
              />
            </label>
            <label>
              E-mail
              <input
                required
                type="email"
                maxLength={150}
                autoComplete="off"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="nome@exemplo.com"
                disabled={saving}
              />
            </label>
            <label>
              Senha inicial
              <input
                required
                type="password"
                minLength={8}
                maxLength={72}
                autoComplete="new-password"
                value={form.senha}
                onChange={(e) => setForm({ ...form, senha: e.target.value })}
                placeholder="Mínimo de 8 caracteres"
                disabled={saving}
              />
            </label>
            <p className="form-note">
              O novo usuário receberá o perfil <strong>Recepção / Coordenação</strong>.
              O administrador é o único perfil que pode criar contas nesta etapa.
              Cadastre somente dados de teste ou contas autorizadas.
            </p>
            {error && <p className="form-error" role="alert">{error}</p>}
            <div className="modal-actions">
              <button className="secondary-button" type="button" onClick={closeModal} disabled={saving}>
                Cancelar
              </button>
              <button className="primary-button" type="submit" disabled={saving}>
                {saving ? "Salvando..." : "Salvar usuário"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
