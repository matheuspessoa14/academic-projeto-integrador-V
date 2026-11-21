import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";


const AppContext = createContext(null);

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:3000"
).replace(/\/$/, "");

function read(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value === null ? fallback : JSON.parse(value);
  } catch {
    return fallback;
  }
}

const nextId = (prefix) =>
  `${prefix}${Date.now().toString(36).toUpperCase()}`;

const recordFromApi = (record) => ({
  ...record,
  data: String(record.data || "").slice(0, 10),
  status: record.status === "FINALIZADO" ? "Finalizado" : "Em análise",
});

const recordToApi = (record, updating = false) => ({
  paciente: String(record.paciente || "").trim(),
  medico: String(record.medico || "").trim(),
  data: String(record.data || "").slice(0, 10),
  tipo: String(record.tipo || "").trim(),
  observacoes: String(record.observacoes || "").trim(),
  ...(updating ? { status: record.status === "Finalizado" ? "FINALIZADO" : "EM_ANALISE" } : {}),
});

// Os UUIDs fictícios são estáveis entre sessões para a demonstração.
import { pacientesDemo } from '../data/pacientesDemo';
const nomePacienteDemo = (id) => pacientesDemo.find(p => p.id === id)?.nome || ('Paciente ID ' + String(id).slice(0,8));
const appointmentFromApi = (a) => ({
  ...a,
  paciente: nomePacienteDemo(a.pacienteId),
  medico: 'Profissional da agenda',
  especialidade: 'Atendimento clínico',
  data: String(a.inicio || '').slice(0,10),
  hora: String(a.inicio || '').slice(11,16),
  status: a.status === 'CANCELADO' ? 'Cancelada' : 'Agendado',
});

export function AppProvider({ children }) {
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Os usuários são obtidos exclusivamente do MySQL via Auth Service.
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState("");
  // LUMERA_GESTAO_V2
  const [professionals, setProfessionals] = useState([]);
  const [professionalsLoading, setProfessionalsLoading] = useState(false);
  const [professionalsError, setProfessionalsError] = useState("");

  // LUMERA_AGENDAMENTO_REAL_V1 — dados persistidos no MySQL via Gateway.
  const [appointments, setAppointments] = useState([]);
  const [agendas, setAgendas] = useState([]);
  const [disponibilidades, setDisponibilidades] = useState([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(false);
  const [appointmentsError, setAppointmentsError] = useState('');

  // LUMERA_REAL_PRONTUARIOS_V1 - prontuarios carregados do PostgreSQL pela API.
  const [records, setRecords] = useState([]);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [recordsError, setRecordsError] = useState("");

  const [toast, setToast] = useState("");

  // JWT mantido na aba por padrão; a opção "Lembrar de mim"
  // permite persistência entre sessões do navegador.
  function getStoredSession() {
    const saved = read("lumera-auth", null);
    if (saved?.accessToken) return saved;
    try {
      const temporary = sessionStorage.getItem("lumera-auth");
      return temporary ? JSON.parse(temporary) : null;
    } catch {
      return null;
    }
  }

  function clearStoredSession() {
    localStorage.removeItem("lumera-auth");
    sessionStorage.removeItem("lumera-auth");
    // Elimina a sessão fictícia de versões antigas do projeto.
    localStorage.removeItem("lumera-session");
  }

  useEffect(() => {
    let active = true;
    const stored = getStoredSession();

    async function restoreSession() {
      if (!stored?.accessToken || !stored?.usuario) {
        if (active) {
          clearStoredSession();
          setAuthLoading(false);
        }
        return;
      }

      try {
        const response = await fetch(`${API_URL}/auth/verify`, {
          headers: { Authorization: `Bearer ${stored.accessToken}` },
        });
        if (!response.ok) throw new Error("Sessão inválida");
        const data = await response.json();
        if (!data.autenticado || data.usuario?.sub !== stored.usuario.id ||
            data.usuario?.email !== stored.usuario.email ||
            data.usuario?.role !== stored.usuario.role) {
          throw new Error("Sessão inconsistente");
        }
        if (active) {
          setSession(stored);
        }
      } catch {
        if (active) {
          clearStoredSession();
          setSession(null);
        }
      } finally {
        if (active) setAuthLoading(false);
      }
    }

    restoreSession();
    return () => { active = false; };
  }, []);

  const login = async (email, password, remember = false) => {
    if (!email.trim() || !password) {
      return { ok: false, message: "Informe e-mail e senha." };
    }

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), senha: password }),
      });
      const data = await response.json();
      if (!response.ok) {
        const message = typeof data.message === "string"
          ? data.message : "Não foi possível realizar o login.";
        return { ok: false, message };
      }
      if (!data.access_token || !data.usuario?.id || !data.usuario?.nome) {
        return { ok: false, message: "Resposta de autenticação incompleta." };
      }

      const novaSessao = {
        accessToken: data.access_token,
        usuario: data.usuario,
        nome: data.usuario.nome,
        email: data.usuario.email,
        perfil: data.usuario.role,
      };
      clearStoredSession();
      const storage = remember ? localStorage : sessionStorage;
      storage.setItem("lumera-auth", JSON.stringify(novaSessao));
      setSession(novaSessao);
      return { ok: true };
    } catch {
      return {
        ok: false,
        message: "Não foi possível conectar ao servidor. Confira se o backend está ativo.",
      };
    }
  };

  // Cadastro real: somente administradores autenticados podem utilizar a API.
  // A autorização definitiva é verificada pelo NestJS.
  const createUser = async (form) => {
    if (!session?.accessToken || session.perfil !== "ADMINISTRADOR") {
      return { ok: false, message: "Acesso permitido somente para administradores." };
    }

    const nome = String(form.nome || "").trim();
    const email = String(form.email || "").trim().toLowerCase();
    const senha = String(form.senha || "");

    if (!nome || !email || !senha) {
      return { ok: false, message: "Preencha nome, e-mail e senha." };
    }

    try {
      const response = await fetch(`${API_URL}/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({ nome, email, senha, role: form.role || "RECEPCAO" }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (response.status === 401) {
          return { ok: false, message: "Sua sessão expirou. Saia e entre novamente." };
        }
        if (response.status === 403) {
          return { ok: false, message: "Você não tem permissão para cadastrar usuários." };
        }
        if (response.status === 409) {
          return { ok: false, message: "Já existe um usuário cadastrado com este e-mail." };
        }
        const message = Array.isArray(result.message)
          ? result.message.join(" ")
          : typeof result.message === "string"
            ? result.message
            : "Não foi possível cadastrar o usuário.";
        return { ok: false, message };
      }

      if (!result.id || !result.email || !result.role) {
        return { ok: false, message: "Resposta inesperada do servidor. Atualize a página para conferir o cadastro." };
      }

      // Atualiza a tabela sem precisar recarregar e sem armazenar senha.
      setUsers((previous) => [result, ...previous.filter((user) => user.id !== result.id)]);
      notify("Usuário cadastrado com sucesso no MySQL.");
      return { ok: true, usuario: result };
    } catch {
      return { ok: false, message: "Não foi possível conectar à API. Verifique o backend." };
    }
  };

  const updateUser = async (id, form) => {
    if (!session?.accessToken || session.perfil !== 'ADMINISTRADOR') {
      return { ok: false, message: 'Apenas administradores podem editar usuarios.' };
    }
    try {
      const response = await fetch(API_URL + '/users/' + encodeURIComponent(id), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + session.accessToken },
        body: JSON.stringify(form),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) return { ok: false, message: Array.isArray(result.message) ? result.message.join(' ') : result.message || 'Nao foi possivel atualizar.' };
      setUsers(previous => previous.map(u => u.id === result.id ? result : u));
      notify('Usuario atualizado no MySQL.');
      return { ok: true, usuario: result };
    } catch { return { ok: false, message: 'Falha de conexao com Auth Service.' }; }
  };

  const toggleUserActive = async (id, ativo) => updateUser(id, { ativo });

  const logout = () => {
    clearStoredSession();
    setSession(null);
  };

  // Lista usuários reais apenas quando há sessão administrativa.
  // A API volta a verificar o perfil e o tenant no servidor.
  useEffect(() => {
    const token = session?.accessToken;
    if (!token || session?.perfil !== "ADMINISTRADOR") {
      setUsers([]);
      setUsersError("");
      setUsersLoading(false);
      return;
    }

    const controller = new AbortController();
    setUsersLoading(true);
    setUsersError("");

    fetch(`${API_URL}/users`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          if (response.status === 401) {
            throw new Error("Sua sessão expirou. Entre novamente.");
          }
          if (response.status === 403) {
            throw new Error("Você não tem permissão para consultar usuários.");
          }
          throw new Error("Não foi possível consultar os usuários.");
        }
        const data = await response.json();
        if (!Array.isArray(data)) throw new Error("Resposta inválida da API.");
        return data;
      })
      .then((data) => {
        if (!controller.signal.aborted) setUsers(data);
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        setUsers([]);
        setUsersError(error.message || "Erro ao consultar usuários.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setUsersLoading(false);
      });

    return () => controller.abort();
  }, [session?.accessToken, session?.perfil]);

  // Busca profissionais ativos mesmo para usuarios nao administradores.
  useEffect(() => {
    const token = session?.accessToken;
    if (!token) {
      setProfessionals([]);
      setProfessionalsError('');
      setProfessionalsLoading(false);
      return;
    }
    const abort = new AbortController();
    setProfessionalsLoading(true);
    setProfessionalsError('');
    fetch(API_URL + '/users/profissionais', {
      headers: { Authorization: 'Bearer ' + token }, signal: abort.signal,
    }).then(async response => {
      const result = await response.json().catch(() => null);
      if (!response.ok || !Array.isArray(result)) throw new Error('Nao foi possivel consultar os profissionais cadastrados.');
      return result;
    }).then(result => { if (!abort.signal.aborted) setProfessionals(result); })
      .catch(err => {
        if (!abort.signal.aborted) {
          setProfessionals([]);
          setProfessionalsError(err.message);
        }
      }).finally(() => { if (!abort.signal.aborted) setProfessionalsLoading(false); });
    return () => abort.abort();
  }, [session?.accessToken, users]);

  // Consulta agendas, disponibilidades e agendamentos reais após autenticação.
  useEffect(() => {
    const token = session?.accessToken;
    if (!token) {
      setAppointments([]); setAgendas([]); setDisponibilidades([]);
      setAppointmentsError(''); setAppointmentsLoading(false);
      return;
    }
    const abort = new AbortController();
    setAppointmentsLoading(true); setAppointmentsError('');
    const headers = { Authorization: 'Bearer ' + token };
    Promise.all(['/agendas', '/disponibilidades', '/agendamentos'].map(async rota => {
      const response = await fetch(API_URL + rota, { headers, signal: abort.signal });
      const body = await response.json().catch(() => null);
      if (!response.ok) {
        const message = Array.isArray(body?.message) ? body.message.join(' ') : body?.message;
        throw new Error(response.status === 401 ? 'Sessão expirada. Entre novamente.' : message || 'Erro na API: ' + rota);
      }
      if (!Array.isArray(body)) throw new Error('Resposta inválida de ' + rota);
      return body;
    })).then(([a, d, c]) => {
      if (abort.signal.aborted) return;
      setAgendas(a); setDisponibilidades(d); setAppointments(c.map(appointmentFromApi));
    }).catch(error => {
      if (abort.signal.aborted) return;
      setAgendas([]); setDisponibilidades([]); setAppointments([]);
      setAppointmentsError(error.message || 'Erro ao carregar agendamentos.');
    }).finally(() => { if (!abort.signal.aborted) setAppointmentsLoading(false); });
    return () => abort.abort();
  }, [session?.accessToken]);

  // Consulta real dos prontuarios apos login; a API valida o token no servidor.
  useEffect(() => {
    const token = session?.accessToken;
    if (!token || !['ADMINISTRADOR', 'PROFISSIONAL_SAUDE'].includes(session?.perfil)) {
      setRecords([]);
      setRecordsError("");
      setRecordsLoading(false);
      return;
    }

    const abort = new AbortController();
    setRecordsLoading(true);
    setRecordsError("");

    fetch(`${API_URL}/prontuarios`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: abort.signal,
    })
      .then(async (response) => {
        const result = await response.json().catch(() => null);
        if (!response.ok) {
          if (response.status === 401) throw new Error("Sessao expirada. Entre novamente.");
          if (response.status === 403) throw new Error("Perfil sem permissao para consultar prontuarios.");
          throw new Error("Nao foi possivel consultar os prontuarios.");
        }
        if (!Array.isArray(result)) throw new Error("Resposta inesperada da API.");
        return result;
      })
      .then((result) => {
        if (!abort.signal.aborted) setRecords(result.map(recordFromApi));
      })
      .catch((error) => {
        if (abort.signal.aborted) return;
        setRecords([]);
        setRecordsError(error.message || "Erro ao carregar prontuarios.");
      })
      .finally(() => {
        if (!abort.signal.aborted) setRecordsLoading(false);
      });

    return () => abort.abort();
  }, [session?.accessToken, session?.perfil]);

  useEffect(() => {
    if (!toast) return;

    const id = setTimeout(() => setToast(""), 3300);

    return () => clearTimeout(id);
  }, [toast]);

  const notify = (message) => setToast(message);

  // Cria e cancela agendamentos somente pelas rotas suportadas pelo backend.
  const createAppointment = async (form) => {
    if (!session?.accessToken) return { ok: false, message: 'Faça login novamente.' };
    const disponivel = disponibilidades.find(d => d.id === form.disponibilidadeId);
    if (!disponivel) return { ok: false, message: 'Selecione uma disponibilidade cadastrada.' };
    if (!pacientesDemo.some(p => p.id === form.pacienteId)) return { ok: false, message: 'Selecione um paciente fictício.' };
    // O MySQL DATETIME não armazena fuso: usamos UTC apenas como formato de transporte,
    // preservando no banco e na tela a hora informada pela clínica.
    const inicio = new Date(form.data + 'T' + form.hora + ':00.000Z');
    const fim = new Date(inicio.getTime() + 30 * 60 * 1000);
    if (Number.isNaN(inicio.getTime()) || inicio < new Date(disponivel.inicio) || fim > new Date(disponivel.fim)) {
      return { ok: false, message: 'Escolha 30 minutos dentro da disponibilidade selecionada.' };
    }
    try {
      const response = await fetch(API_URL + '/agendamentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + session.accessToken },
        body: JSON.stringify({
          agendaId: disponivel.agendaId, pacienteId: form.pacienteId,
          unidadeId: disponivel.unidadeId, servicoId: disponivel.servicoId,
          inicio: inicio.toISOString(), fim: fim.toISOString(),
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        const message = Array.isArray(result.message) ? result.message.join(' ') : result.message;
        return { ok: false, message: message || 'Falha ao cadastrar agendamento.' };
      }
      setAppointments(prev => [appointmentFromApi(result), ...prev]);
      notify('Consulta registrada no MySQL.');
      return { ok: true, agendamento: result };
    } catch { return { ok: false, message: 'Falha na conexão com Appointment Service.' }; }
  };
  const cancelAppointment = async (id) => {
    if (!session?.accessToken) return { ok: false, message: 'Faça login novamente.' };
    try {
      const response = await fetch(API_URL + '/agendamentos/' + encodeURIComponent(id) + '/cancelar', {
        method: 'PATCH', headers: { Authorization: 'Bearer ' + session.accessToken },
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        const message = Array.isArray(result.message) ? result.message.join(' ') : result.message;
        return { ok: false, message: message || 'Não foi possível cancelar.' };
      }
      setAppointments(prev => prev.map(a => a.id === id ? appointmentFromApi(result) : a));
      notify('Agendamento cancelado no MySQL.');
      return { ok: true };
    } catch { return { ok: false, message: 'Falha ao conectar ao Appointment Service.' }; }
  };

  // LUMERA_REAL_PRONTUARIOS_V1 - criacao e edicao persistidas no PostgreSQL.
  const createRecord = async (data) => {
    if (!session?.accessToken) return { ok: false, message: "Faca login novamente." };
    try {
      const response = await fetch(`${API_URL}/prontuarios`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify(recordToApi(data)),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        const message = Array.isArray(result.message) ? result.message.join(" ")
          : typeof result.message === "string" ? result.message : "Falha ao cadastrar prontuario.";
        return { ok: false, message };
      }
      setRecords((previous) => [recordFromApi(result), ...previous]);
      notify("Prontuario cadastrado no PostgreSQL.");
      return { ok: true };
    } catch {
      return { ok: false, message: "Falha de conexao com a API de prontuarios." };
    }
  };

  const updateRecord = async (id, data) => {
    if (!session?.accessToken) return { ok: false, message: "Faca login novamente." };
    try {
      const response = await fetch(`${API_URL}/prontuarios/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify(recordToApi(data, true)),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        const message = Array.isArray(result.message) ? result.message.join(" ")
          : typeof result.message === "string" ? result.message : "Falha ao atualizar prontuario.";
        return { ok: false, message };
      }
      setRecords((previous) => previous.map((r) => r.id === id ? recordFromApi(result) : r));
      notify("Prontuario atualizado no PostgreSQL.");
      return { ok: true };
    } catch {
      return { ok: false, message: "Falha de conexao com a API de prontuarios." };
    }
  };

  return (
    <AppContext.Provider
      value={{
        session,
        authLoading,
        login,
        logout,
        users,
        createUser,
        updateUser,
        toggleUserActive,
        professionals,
        professionalsLoading,
        professionalsError,
        usersLoading,
        usersError,
        appointments,
        appointmentsLoading,
        appointmentsError,
        agendas,
        disponibilidades,
        records,
        recordsLoading,
        recordsError,
        createAppointment,
        cancelAppointment,
        createRecord,
        updateRecord,
        notify,
        toast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const value = useContext(AppContext);

  if (!value) {
    throw new Error("useApp requer AppProvider");
  }

  return value;
}
