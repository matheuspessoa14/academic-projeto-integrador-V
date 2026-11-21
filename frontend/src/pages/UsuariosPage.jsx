import { useMemo, useState } from "react";
import { Plus, Search, UsersRound, UserRoundPlus, ShieldCheck, Mail, Pencil, UserX, UserCheck } from "lucide-react";
import { useApp } from "../context/AppContext";
import Modal from "../components/Modal";
import EmptyState from "../components/EmptyState";
import StatusBadge from "../components/StatusBadge";
import { initials } from "../utils/format";

// LUMERA_GESTAO_V2 - administracao de usuarios reais com historico preservado.
const roles = [
  { codigo: "ADMINISTRADOR", nome: "Gestor / Administrador" },
  { codigo: "PROFISSIONAL_SAUDE", nome: "Profissional de Saúde" },
  { codigo: "RECEPCAO", nome: "Recepção / Coordenação" },
];
const emptyForm = { nome: "", email: "", senha: "", role: "RECEPCAO" };

export default function UsuariosPage() {
  const { users, usersLoading, usersError, session, createUser, updateUser, toggleUserActive } = useApp();
  const [q, setQ] = useState("");
  const [role, setRole] = useState("Todos");
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [workingId, setWorkingId] = useState(null);
  const isAdmin = session?.perfil === "ADMINISTRADOR";
  const ativos = users.filter(u => u.ativo).length;
  const filtered = useMemo(() => users.filter(u =>
    (u.nome + " " + u.email).toLowerCase().includes(q.toLowerCase()) &&
    (role === "Todos" || u.role === role)), [users, q, role]);

  function openNew() {
    setEditing(null); setError(""); setForm({ ...emptyForm }); setModal(true);
  }
  function openEdit(user) {
    setEditing(user.id); setError("");
    setForm({ nome: user.nome, email: user.email, role: user.role, senha: "" });
    setModal(true);
  }
  function closeModal() {
    if (saving) return;
    setModal(false); setEditing(null); setError(""); setForm({ ...emptyForm });
  }
  async function submit(event) {
    event.preventDefault();
    if (saving) return;
    setError(""); setSaving(true);
    try {
      const result = editing
        ? await updateUser(editing, { nome: form.nome, email: form.email, role: form.role })
        : await createUser(form);
      if (!result.ok) { setError(result.message); return; }
      closeAfterSave();
    } finally { setSaving(false); }
  }
  function closeAfterSave() {
    setModal(false); setEditing(null); setForm({ ...emptyForm }); setError("");
  }
  async function changeAccess(user) {
    if (workingId) return;
    const proximo = !user.ativo;
    const msg = proximo
      ? 'Reativar o acesso desta conta?'
      : 'Desativar o acesso desta conta? O cadastro e o historico serao preservados.';
    if (!window.confirm(msg)) return;
    setWorkingId(user.id);
    const result = await toggleUserActive(user.id, proximo);
    setWorkingId(null);
    if (!result.ok) window.alert(result.message || 'Nao foi possivel alterar o acesso.');
  }

  return (
    <div className="module-page">
      <div className="module-heading">
        <div>
          <div className="eyebrow">CADASTROS E ACESSOS</div>
          <h1>Usuários da equipe</h1>
          <p>Contas de acesso cadastradas no MySQL do Senac.</p>
        </div>
        {isAdmin && <button className="primary-button" type="button" onClick={openNew}>
          <Plus size={18} /> Novo usuário
        </button>}
      </div>
      <div className="module-stats">
        <div className="simple-stat"><div className="metric-icon blue"><UsersRound size={20} /></div>
          <span>Total de usuários</span><strong>{users.length}</strong></div>
        <div className="simple-stat"><div className="metric-icon aqua"><UserRoundPlus size={20} /></div>
          <span>Usuários ativos</span><strong>{ativos}</strong></div>
        <div className="simple-stat"><div className="metric-icon purple"><ShieldCheck size={20} /></div>
          <span>Perfis disponíveis</span><strong>{roles.length}</strong></div>
      </div>
      <section className="panel module-panel">
        <div className="panel-heading"><div><h3>Usuários cadastrados</h3>
          <p>Listagem real da API de autenticação</p></div></div>
        <div className="filterbar">
          <div className="filter-search"><Search size={18} />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar por nome ou e-mail" aria-label="Buscar usuários" />
          </div>
          <select aria-label="Filtrar por perfil" value={role} onChange={e => setRole(e.target.value)}>
            <option value="Todos">Todos</option>
            {roles.map(r => <option key={r.codigo} value={r.codigo}>{r.nome}</option>)}
          </select>
        </div>
        {!isAdmin ? <p className="form-error">Acesso permitido apenas a administradores.</p>
          : usersLoading ? <p>Carregando usuários do MySQL...</p>
          : usersError ? <p className="form-error" role="alert">{usersError}</p>
          : filtered.length ? <div className="table-scroll"><table className="data-table">
            <thead><tr><th>Usuário</th><th>Contato</th><th>Perfil</th><th>Status</th><th>Ações</th></tr></thead>
            <tbody>{filtered.map(u => <tr key={u.id}>
              <td><div className="table-person"><div className="avatar avatar-soft">{initials(u.nome)}</div>
                <div><strong>{u.nome}</strong><small>{u.id}</small></div></div></td>
              <td><span className="contact-line"><Mail size={14} /> {u.email}</span></td>
              <td><span className="role-chip">{u.perfil || u.role}</span></td>
              <td><StatusBadge value={u.ativo ? "Ativo" : "Inativo"} /></td>
              <td><div className="table-actions">
                <button className="icon-button" type="button" aria-label={'Editar ' + u.nome} title="Editar usuário" onClick={() => openEdit(u)}>
                  <Pencil size={16} /></button>
                <button className="icon-button" type="button" disabled={workingId === u.id || (u.id === session?.usuario?.id && u.ativo)}
                  aria-label={(u.ativo ? 'Desativar ' : 'Reativar ') + u.nome}
                  title={u.ativo ? "Desativar usuário (preserva histórico)" : "Reativar usuário"} onClick={() => changeAccess(u)}>
                  {u.ativo ? <UserX size={17} /> : <UserCheck size={17} />}
                </button>
              </div></td>
            </tr>)}</tbody>
          </table></div> : <EmptyState />}
      </section>
      {modal && <Modal title={editing ? "Editar usuário" : "Cadastrar usuário"}
        subtitle={editing ? "Atualize os dados e as permissões da conta." : "Cadastre uma conta autorizada para a equipe."}
        onClose={closeModal}>
        <form className="modal-form" onSubmit={submit}>
          <label>Nome completo<input required minLength={3} maxLength={120} autoComplete="name" value={form.nome}
            onChange={e => setForm({ ...form, nome: e.target.value })} disabled={saving} /></label>
          <label>E-mail<input required type="email" maxLength={150} autoComplete="off" value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })} disabled={saving} /></label>
          {!editing && <label>Senha inicial<input required type="password" minLength={8} maxLength={72}
            autoComplete="new-password" value={form.senha} onChange={e => setForm({ ...form, senha: e.target.value })}
            placeholder="Mínimo de 8 caracteres" disabled={saving} /></label>}
          <label>Perfil<select required value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} disabled={saving}>
            {roles.map(r => <option key={r.codigo} value={r.codigo}>{r.nome}</option>)}
          </select></label>
          <p className="form-note">Apenas administradores podem alterar permissões. Desativar uma conta bloqueia novos logins e preserva o histórico.</p>
          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="modal-actions">
            <button className="secondary-button" type="button" onClick={closeModal} disabled={saving}>Cancelar</button>
            <button className="primary-button" type="submit" disabled={saving}>{saving ? "Salvando..." : (editing ? "Salvar alterações" : "Salvar usuário")}</button>
          </div>
        </form>
      </Modal>}
    </div>
  );
}
