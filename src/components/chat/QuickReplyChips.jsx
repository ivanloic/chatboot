const suggestions = [
  { emoji: "👋", label: "Dire bonjour", text: "Bonjour" },
  { emoji: "🕐", label: "Horaires", text: "Quels sont vos horaires ?" },
  { emoji: "💰", label: "Prix", text: "Quel est le prix ?" },
  { emoji: "🚚", label: "Livraison", text: "Quel est le délai de livraison ?" },
  { emoji: "💳", label: "Paiement", text: "Quels sont les modes de paiement ?" },
];

export default function QuickReplyChips({ onSelect }) {
  return (
    <div className="flex gap-2 overflow-x-auto px-4 pb-3 thin-scrollbar">
      {suggestions.map((s) => (
        <button
          key={s.label}
          onClick={() => onSelect(s.text)}
          className="flex shrink-0 items-center gap-1.5 rounded-full border border-copper-500/25 bg-copper-100/70 px-3.5 py-1.5 text-xs font-medium text-copper-600 transition hover:bg-copper-100"
        >
          <span>{s.emoji}</span> {s.label}
        </button>
      ))}
    </div>
  );
}
