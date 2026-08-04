import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Camera, Check, Pencil, Phone, Trash2, Video, X } from "lucide-react";
import ChatBubble from "../chat/ChatBubble";
import ChatInput from "../chat/ChatInput";
import { subscribeToMessages, sendTextMessage, sendMediaMessage } from "../../firebase/chatService";
import { renameConversation, updateConversationPhoto } from "../../firebase/adminService";

function formatTime(createdAt) {
  if (!createdAt?.toDate) return "";
  return createdAt.toDate().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

export default function ConversationPanel({ conversation, onBack, onRequestDelete, onComingSoon }) {
  const conversationId = conversation?.id ?? "";
  const conversationName = conversation?.name ?? "";
  const [messages, setMessages] = useState([]);
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(conversationName);
  const [isUploading, setIsUploading] = useState(false);
  const scrollRef = useRef(null);
  const photoInputRef = useRef(null);

  // Reset l'édition du nom quand on change de conversation
  useEffect(() => {
    setNameDraft(conversationName);
    setIsEditingName(false);
  }, [conversationId, conversationName]);

  useEffect(() => {
    if (!conversationId) return;
    const unsubscribe = subscribeToMessages(conversationId, setMessages);
    return unsubscribe;
  }, [conversationId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function handleSend(payload) {
    const isImage = payload && typeof payload === "object" && payload.type === "image";
    const isPdf = payload && typeof payload === "object" && payload.type === "pdf";
    const isVoice = payload && typeof payload === "object" && payload.type === "voice";

    if (isImage || isPdf) {
      if (!payload.file) {
        console.error("Aucun fichier sélectionné pour l'envoi média admin.");
        return;
      }
      const type = payload.type;
      setIsUploading(true);
      try {
        await sendMediaMessage(conversation.id, "admin", type, payload.file);
      } catch (err) {
        console.error("Erreur d'envoi de fichier :", err);
      } finally {
        setIsUploading(false);
      }
      return;
    }

    if (isVoice) {
      setIsUploading(true);
      try {
        await sendMediaMessage(conversation.id, "admin", "voice", payload.file);
      } catch (err) {
        console.error("Erreur d'envoi du vocal :", err);
      } finally {
        setIsUploading(false);
      }
      return;
    }

    const text = typeof payload === "string" ? payload : payload?.text || "";
    if (!text) return;
    await sendTextMessage(conversation.id, "admin", text);
  }

  async function handleSaveName() {
    if (!conversationId) return;
    const trimmed = nameDraft.trim();
    if (trimmed && trimmed !== conversationName) {
      await renameConversation(conversationId, trimmed);
    }
    setIsEditingName(false);
  }

  async function handlePhotoChange(e) {
    if (!conversationId) return;
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      await updateConversationPhoto(conversationId, file);
    } catch (err) {
      console.error("Erreur de changement de photo :", err);
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  }

  return (
    <div className="flex h-full flex-1 flex-col bg-canvas">
      {/* Header */}
      <header className="flex items-center gap-3 border-b border-black/5 bg-white px-4 py-3.5">
        <button onClick={onBack} className="rounded-full p-1.5 text-ink-700/50 hover:bg-black/5 sm:hidden">
          <ArrowLeft size={18} />
        </button>

        <button onClick={() => photoInputRef.current?.click()} className="group relative shrink-0" title="Changer la photo">
          {conversation?.photoURL ? (
            <img src={conversation.photoURL} alt={conversationName} className="h-10 w-10 rounded-full object-cover" />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-ink-700 text-xs font-semibold text-white">
              {conversationName?.slice(0, 2).toUpperCase()}
            </div>
          )}
          <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition group-hover:opacity-100">
            <Camera size={14} className="text-white" />
          </span>
        </button>
        <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />

        <div className="min-w-0 flex-1">
          {isEditingName ? (
            <div className="flex items-center gap-1.5">
              <input
                autoFocus
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
                className="w-full rounded-lg border border-copper-500/40 px-2 py-1 text-sm outline-none"
              />
              <button onClick={handleSaveName} className="rounded-full p-1 text-sage-500 hover:bg-sage-100" aria-label="Valider">
                <Check size={16} />
              </button>
              <button
                onClick={() => setIsEditingName(false)}
                className="rounded-full p-1 text-ink-700/40 hover:bg-black/5"
                aria-label="Annuler"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <button onClick={() => setIsEditingName(true)} className="group flex items-center gap-1.5">
              <p className="truncate font-display text-sm font-semibold text-ink-900">{conversationName}</p>
              <Pencil size={12} className="shrink-0 text-ink-700/30 opacity-0 transition group-hover:opacity-100" />
            </button>
          )}
          <p className="text-xs text-ink-700/40">Conversation client</p>
        </div>

        <div className="flex shrink-0 items-center gap-1 text-ink-700/40">
          <button
            onClick={() => onComingSoon("📞 Les appels arrivent dans une prochaine étape")}
            className="rounded-full p-2 transition hover:bg-black/5"
          >
            <Phone size={16} />
          </button>
          <button
            onClick={() => onComingSoon("🎥 Les appels vidéo arrivent dans une prochaine étape")}
            className="rounded-full p-2 transition hover:bg-black/5"
          >
            <Video size={16} />
          </button>
          <button
            onClick={() => onRequestDelete(conversationId)}
            className="rounded-full p-2 transition hover:bg-red-50 hover:text-red-500"
            aria-label="Supprimer la discussion"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </header>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 space-y-3.5 overflow-y-auto px-4 py-5 thin-scrollbar">
        {messages.length === 0 && (
          <p className="pt-10 text-center text-xs text-ink-700/35">Aucun message pour l'instant.</p>
        )}
        {messages.map((m) => (
          <ChatBubble key={m.id} message={{ ...m, time: formatTime(m.createdAt) }} perspective="admin" />
        ))}
      </div>

      {/* Réponse */}
      <ChatInput onSend={handleSend} onComingSoon={onComingSoon} disabled={isUploading} />
    </div>
  );
}
