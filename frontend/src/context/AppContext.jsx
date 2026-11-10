import { createContext, useContext, useEffect, useState } from "react";
import {
  initialUsers,
  initialAppointments,
  initialRecords,
} from "../data/seed";
const AppContext = createContext(null);
function read(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value === null ? fallback : JSON.parse(value);
  } catch {
    return fallback;
  }
}
const nextId = (prefix) => `${prefix}${Date.now().toString(36).toUpperCase()}`;
export function AppProvider({ children }) {
  const [session, setSession] = useState(() => read("lumera-session", null));
  const [users, setUsers] = useState(() => read("lumera-users", initialUsers));
  const [appointments, setAppointments] = useState(() =>
    read("lumera-appointments", initialAppointments),
  );
  const [records, setRecords] = useState(() =>
    read("lumera-records", initialRecords),
  );
  const [toast, setToast] = useState("");
  useEffect(() => {
    localStorage.setItem("lumera-session", JSON.stringify(session));
  }, [session]);
  useEffect(() => {
    localStorage.setItem("lumera-users", JSON.stringify(users));
  }, [users]);
  useEffect(() => {
    localStorage.setItem("lumera-appointments", JSON.stringify(appointments));
  }, [appointments]);
  useEffect(() => {
    localStorage.setItem("lumera-records", JSON.stringify(records));
  }, [records]);
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(""), 3300);
    return () => clearTimeout(id);
  }, [toast]);
  const notify = (message) => setToast(message);
  const login = (email, password) => {
    if (!email.trim() || !password.trim())
      return { ok: false, message: "Informe e-mail e senha." };
    setSession({
      nome:
        email === "teste@teste.com" ? "Anna Mitchell" : email.split("@")[0],
      email,
      perfil: "Administrador",
    });
    return { ok: true };
  };
  const logout = () => setSession(null);
  const createUser = (data) => {
    if (users.some((u) => u.email.toLowerCase() === data.email.toLowerCase()))
      return { ok: false, message: "Este e-mail já está cadastrado." };
    setUsers((old) => [
      {
        ...data,
        id: nextId("U"),
        ativo: true,
        iniciais: data.nome
          .split(" ")
          .map((v) => v[0])
          .slice(0, 2)
          .join("")
          .toUpperCase(),
      },
      ...old,
    ]);
    notify("Usuário cadastrado no modo demonstração.");
    return { ok: true };
  };
  const removeUser = (id) => {
    setUsers((old) => old.filter((u) => u.id !== id));
    notify("Usuário removido da demonstração.");
  };
  const createAppointment = (data) => {
    setAppointments((old) => [
      { ...data, id: nextId("AG"), status: "Pendente" },
      ...old,
    ]);
    notify("Agendamento criado no modo demonstração.");
  };
  const updateAppointment = (id, data) => {
    setAppointments((old) =>
      old.map((a) => (a.id === id ? { ...a, ...data } : a)),
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
    setRecords((old) => old.map((r) => (r.id === id ? { ...r, ...data } : r)));
    notify("Prontuário atualizado.");
  };
  return (
    <AppContext.Provider
      value={{
        session,
        login,
        logout,
        users,
        appointments,
        records,
        createUser,
        removeUser,
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
  if (!value) throw new Error("useApp requer AppProvider");
  return value;
}
