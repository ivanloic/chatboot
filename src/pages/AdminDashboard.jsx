import { useEffect, useState } from "react";
import { LogOut, MessagesSquare, Search, Wifi, WifiOff } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { subscribeToConversations, markConversationRead, deleteConversation } from "../firebase/adminService";
import { startAdminPresence, stopAdminPresence } from "../firebase/presenceService";
import ConversationListItem from "../components/admin/ConversationListItem";
import ConversationPanel from "../components/admin/ConversationPanel";
import ConfirmDialog from "../components/admin/ConfirmDialog";

export default function AdminDashboard() {
  const { logout } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [conversationsError, setConversationsError] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [search, setSearch] = useState("");
  const [isOnline, setIsOnline] = useState(true);
  const [toast, setToast] = useState(null);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);

  // Liste temps réel de toutes les conversations
  useEffect(() => {
    const unsubscribe = subscribeToConversations(
      (docs) => {
        console.log("[debug] conversations reçues :", docs.length, docs);
        setConversations(docs);
      },
      (error) => setConversationsError(error.message)
    );
    return unsubscribe;
  }, []);

  // Présence : "en ligne" tant que le dashboard est ouvert (heartbeat), "hors ligne" en quittant
  useEffect(() => {
    startAdminPresence();
    return () => stopAdminPresence();
  }, []);

  function togglePresence() {
    const next = !isOnline;
    setIsOnline(next);
    if (next) startAdminPresence();
    else stopAdminPresence();
  }

  function handleSelect(id) {
    setSelectedId(id);
    const conv = conversations.find((c) => c.id === id);
    if (conv?.unreadByAdmin) markConversationRead(id);
  }

  async function handleConfirmDelete() {
    const idToDelete = pendingDeleteId;
    setPendingDeleteId(null);
    if (selectedId === idToDelete) setSelectedId(null);
    await deleteConversation(idToDelete);
  }

  function handleComingSoon(message) {
    setToast(message);
    setTimeout(() => setToast(null), 2500);
  }

  const filtered = conversations.filter((c) => (c.name || "").toLowerCase().includes(search.toLowerCase()));
  const selected = conversations.find((c) => c.id === selectedId) || null;

  return (
    <div className="flex h-dvh bg-canvas">
      {/* Liste des conversations */}
      <aside className={`w-full flex-col border-r border-black/5 bg-white sm:flex sm:w-80 ${selected ? "hidden" : "flex"}`}>
        <div className="flex items-center justify-between border-b border-black/5 px-4 py-3.5">
          <h1 className="font-display text-base font-semibold text-ink-900">Discussions</h1>
          <div className="flex items-center gap-1.5">
            <button
              onClick={togglePresence}
              title={isOnline ? "Passer hors ligne" : "Passer en ligne"}
              className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium transition ${
                isOnline ? "bg-sage-100 text-sage-600" : "bg-black/5 text-ink-700/50"
              }`}
            >
              {isOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
              {isOnline ? "En ligne" : "Absent"}
            </button>
            <button onClick={logout} className="rounded-lg p-1.5 text-ink-700/40 hover:bg-black/5" title="Déconnexion">
              <LogOut size={15} />
            </button>
          </div>
        </div>

        <div className="border-b border-black/5 px-3 py-2.5">
          <div className="flex items-center gap-2 rounded-lg bg-canvas-100 px-3 py-2">
            <Search size={14} className="shrink-0 text-ink-700/35" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher une discussion…"
              className="w-full bg-transparent text-sm outline-none placeholder:text-ink-700/35"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto thin-scrollbar">
          {conversationsError && (
            <div className="m-3 rounded-xl border border-red-300 bg-red-50 px-3.5 py-3 text-xs text-red-700">
              <p className="font-semibold">⚠️ Erreur de chargement</p>
              <p className="mt-1 opacity-80">{conversationsError}</p>
            </div>
          )}
          {filtered.length === 0 && !conversationsError && (
            <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
              <MessagesSquare size={26} strokeWidth={1.5} className="text-ink-700/20" />
              <p className="text-sm text-ink-700/45">
                {conversations.length === 0 ? "Aucune conversation pour l'instant." : "Aucun résultat pour cette recherche."}
              </p>
            </div>
          )}
          {filtered.map((c) => (
            <ConversationListItem
              key={c.id}
              conversation={c}
              isActive={c.id === selectedId}
              onSelect={handleSelect}
              onDelete={setPendingDeleteId}
            />
          ))}
        </div>
      </aside>

      {/* Conversation ouverte */}
      <main className={`flex-1 flex-col ${selected ? "flex" : "hidden sm:flex"}`}>
        {selected ? (
          <ConversationPanel
            conversation={selected}
            onBack={() => setSelectedId(null)}
            onRequestDelete={setPendingDeleteId}
            onComingSoon={handleComingSoon}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-ink-700/35">
            Sélectionne une discussion pour l'ouvrir
          </div>
        )}
      </main>

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-10 w-max max-w-[85%] -translate-x-1/2 rounded-full bg-ink-900 px-4 py-2 text-xs text-white shadow-lg animate-toast-in">
          {toast}
        </div>
      )}

      <ConfirmDialog
        open={!!pendingDeleteId}
        title="Supprimer cette discussion ?"
        message="Tous les messages seront définitivement supprimés, y compris les images et vocaux. Cette action est irréversible."
        confirmLabel="Supprimer"
        onConfirm={handleConfirmDelete}
        onCancel={() => setPendingDeleteId(null)}
      />
    </div>
  );
}
