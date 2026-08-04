import { Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

export default function ConversationListItem({ conversation, isActive, onSelect, onDelete }) {
  const { id, name, photoURL, lastMessage, lastMessageAt, unreadByAdmin } = conversation;

  const timeLabel = lastMessageAt?.toDate
    ? formatDistanceToNow(lastMessageAt.toDate(), { addSuffix: true, locale: fr })
    : "";

  return (
    <div
      onClick={() => onSelect(id)}
      className={`group flex cursor-pointer items-center gap-3 border-b border-black/5 px-4 py-3 transition ${
        isActive ? "bg-copper-100/60" : "hover:bg-black/[0.02]"
      }`}
    >
      <div className="relative shrink-0">
        {photoURL ? (
          <img src={photoURL} alt={name} className="h-11 w-11 rounded-full object-cover" />
        ) : (
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-ink-700 text-sm font-semibold text-white">
            {name?.slice(0, 2).toUpperCase()}
          </div>
        )}
        {unreadByAdmin && (
          <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-white bg-copper-500" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className={`truncate text-sm ${unreadByAdmin ? "font-semibold text-ink-900" : "font-medium text-ink-900/80"}`}>
            {name}
          </p>
          <span className="shrink-0 text-[10px] text-ink-700/40">{timeLabel}</span>
        </div>
        <p className={`truncate text-xs ${unreadByAdmin ? "font-medium text-ink-900/70" : "text-ink-700/45"}`}>
          {lastMessage || "Nouvelle conversation"}
        </p>
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete(id);
        }}
        className="shrink-0 rounded-full p-1.5 text-ink-700/25 opacity-0 transition hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
        aria-label="Supprimer la discussion"
      >
        <Trash2 size={15} />
      </button>
    </div>
  );
}
