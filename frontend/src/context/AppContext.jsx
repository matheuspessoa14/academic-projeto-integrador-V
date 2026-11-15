import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  initialAppointments,
  initialRecords,
} from "../data/seed";

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

export function AppProvider({ children }) {
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Os usuários são obtidos exclusivamente do MySQL via Auth Service.
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState("");

  const [appointments, setAppointments] = useState(() =>
    read("lumera-appointments", initialAppointments)
  );

  const [records, setRecords] = useState(() =>
    read("lumera-records", initialRecords)
  );

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
        body: JSON.stringify({ nome, email, senha }),
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

  useEffect(() => {
    localStorage.setItem(
      "lumera-appointments",
      JSON.stringify(appointments)
    );
  }, [appointments]);

  useEffect(() => {
    localStorage.setItem(
      "lumera-records",
      JSON.stringify(records)
    );
  }, [records]);

  useEffect(() => {
    if (!toast) return;

    const id = setTimeout(() => setToast(""), 3300);

    return () => clearTimeout(id);
  }, [toast]);

  const notify = (message) => setToast(message);

  const createAppointment = (data) => {
    setAppointments((old) => [
      { ...data, id: nextId("AG"), status: "Pendente" },
      ...old,
    ]);

    notify("Agendamento criado no modo demonstração.");
  };

  const updateAppointment = (id, data) => {
    setAppointments((old) =>
      old.map((a) => (a.id === id ? { ...a, ...data } : a))
    );

    notify("Agendamento atualizado.");
  };

  const createRecord = (data) => {
    setRecords((old) => [
      { ...data, id: nextId("PR"), status: "Em análise" },
      ...old,
    ]);

    notify("Prontuário criado no modo demonstração.");
  };

  const updateRecord = (id, data) => {
    setRecords((old) =>
      old.map((r) => (r.id === id ? { ...r, ...data } : r))
    );

    notify("Prontuário atualizado.");
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
        usersLoading,
        usersError,
        appointments,
        records,
        createAppointment,
        updateAppointment,
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
