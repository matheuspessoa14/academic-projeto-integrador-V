export default function StatusBadge({ value }) {
  const map = {
    Confirmada: "positive",
    Agendado: "info",
    Concluída: "positive",
    Finalizado: "positive",
    Ativo: "positive",
    Pendente: "warning",
    "Em análise": "warning",
    "Em andamento": "info",
    Cancelada: "negative",
    Inativo: "negative",
  };
  return (
    <span className={`status-badge ${map[value] || "info"}`}>
      <span className="status-dot" />
      {value}
    </span>
  );
}
