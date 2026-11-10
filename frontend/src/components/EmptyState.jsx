import { SearchX } from "lucide-react";
export default function EmptyState({ label = "Nenhum resultado encontrado" }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">
        <SearchX size={24} />
      </div>
      <strong>{label}</strong>
      <p>Tente ajustar a busca ou adicione um novo registro.</p>
    </div>
  );
}
