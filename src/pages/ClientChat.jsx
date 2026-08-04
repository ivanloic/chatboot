import { useEffect, useRef, useState } from "react";
import { Bell, Phone, Video, MoreVertical, Sparkles } from "lucide-react";
import ChatBubble from "../components/chat/ChatBubble";
import TypingIndicator from "../components/chat/TypingIndicator";
import QuickReplyChips from "../components/chat/QuickReplyChips";
import ChatInput from "../components/chat/ChatInput";
import { businessInfo } from "../data/businessInfo";
import { useClientAuth } from "../hooks/useClientAuth";
import { ensureConversation, subscribeToMessages, sendTextMessage, sendMediaMessage } from "../firebase/chatService";
import cgeLogo from "../assets/cge_immo.jpg";

// Sera branché sur la vraie présence de l'admin à une prochaine étape
const ADMIN_ONLINE = false;

function formatTime(createdAt) {
  // Juste après l'envoi, le serveur n'a pas encore posé le timestamp (cache local Firestore) :
  // on affiche simplement rien plutôt qu'une erreur, ça se met à jour tout seul.
  if (!createdAt?.toDate) return "";
  return createdAt.toDate().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

export default function ClientChat() {
  const { uid } = useClientAuth();
  const conversationId = uid; // chaque visiteur = une conversation unique et stable

  const [messages, setMessages] = useState([]);
  const [isReady, setIsReady] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [toast, setToast] = useState(null);
  const [notificationSupported, setNotificationSupported] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState("default");
  const scrollRef = useRef(null);
  const prevMessagesCountRef = useRef(0);
  const initialMessagesLoadedRef = useRef(true);

  // 1. Dès qu'on a un UID, on s'assure que la conversation existe (et on envoie
  //    le message de bienvenue une seule fois, à la toute première visite)
  useEffect(() => {
    if (!conversationId) return;

    let unsubscribe = () => {};

    (async () => {
      const isNew = await ensureConversation(conversationId);

      if (isNew) {
        await sendTextMessage(
          conversationId,
          "bot",
          `👋 Bienvenue chez ${businessInfo.name} ! Je suis l'assistant automatique. Posez-moi une question (horaires, prix, livraison…) ou écrivez directement, un conseiller prendra le relais dès que possible.`
        );
      }

      // 2. On écoute les messages en temps réel
      unsubscribe = subscribeToMessages(conversationId, (docs) => {
        setMessages(docs);
        setIsReady(true);
      });
    })();

    return () => unsubscribe();
  }, [conversationId]);

  useEffect(() => {
    setNotificationSupported(typeof Notification !== "undefined");
    if (typeof Notification !== "undefined") {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isTyping]);

  async function runAutoReply(triggerText) {
    // Réponses automatiques désactivées. Seul le message d'accueil est conservé.
  }

  async function handleSend(payload) {
    if (!conversationId) return;
    setShowSuggestions(false);

    const isImage = payload && typeof payload === "object" && payload.type === "image";
    const isPdf = payload && typeof payload === "object" && payload.type === "pdf";
    const isVoice = payload && typeof payload === "object" && payload.type === "voice";

    if (isImage || isPdf) {
      if (!payload.file) {
        setToast("❌ Aucun fichier sélectionné pour l'image ou le PDF.");
        return;
      }

      const type = payload.type;
      setIsUploading(true);
      try {
        await sendMediaMessage(conversationId, "client", type, payload.file);
        setIsTyping(true);
        setTimeout(async () => {
          await sendTextMessage(
            conversationId,
            "bot",
            type === "image"
              ? "Merci, j'ai bien reçu votre photo 📷."
              : "Merci, j'ai bien reçu votre document PDF 📄."
          );
          setIsTyping(false);
        }, 900);
      } catch (err) {
        console.error("Erreur d'envoi de fichier :", err);
        setToast("❌ L'envoi du fichier a échoué, réessaie.");
      } finally {
        setIsUploading(false);
      }
      return;
    }

    if (isVoice) {
      setIsUploading(true);
      try {
        await sendMediaMessage(conversationId, "client", "voice", payload.file);
        setIsTyping(true);
        setTimeout(async () => {
          await sendTextMessage(conversationId, "bot", "Merci, j'ai bien reçu votre message vocal 🎤.");
          setIsTyping(false);
        }, 900);
      } catch (err) {
        console.error("Erreur d'envoi du vocal :", err);
        setToast("❌ L'envoi du vocal a échoué, réessaie.");
      } finally {
        setIsUploading(false);
      }
      return;
    }

    // Message texte
    const text = typeof payload === "string" ? payload : payload?.text || "";
    if (!text) return;
    await sendTextMessage(conversationId, "client", text);
    // Réponses automatiques désactivées : ne rien envoyer après le message client.
  }

  function handleComingSoon(message) {
    setToast(message);
    setTimeout(() => setToast(null), 2500);
  }

  async function requestNotificationPermission() {
    if (!notificationSupported) {
      setToast("Notifications non supportées par ce navigateur.");
      return;
    }

    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);
    if (permission === "granted") {
      setToast("Notifications activées.");
    } else if (permission === "denied") {
      setToast("Autorisation des notifications refusée.");
    } else {
      setToast("Notifications en attente d'autorisation.");
    }
  }

  useEffect(() => {
    if (!isReady || !notificationSupported || notificationPermission !== "granted") {
      return;
    }

    if (initialMessagesLoadedRef.current) {
      initialMessagesLoadedRef.current = false;
      prevMessagesCountRef.current = messages.length;
      return;
    }

    if (messages.length <= prevMessagesCountRef.current) {
      prevMessagesCountRef.current = messages.length;
      return;
    }

    const newMessages = messages.slice(prevMessagesCountRef.current);
    prevMessagesCountRef.current = messages.length;
    const latest = newMessages[newMessages.length - 1];
    if (!latest || latest.senderType === "client") return;
    if (document.visibilityState === "visible") return;

    const body =
      latest.type === "text"
        ? latest.text
        : latest.type === "image"
          ? "Photo reçue"
          : latest.type === "voice"
            ? "Message vocal reçu"
            : latest.type === "pdf"
              ? "Document PDF reçu"
              : "Nouveau message reçu";

    new Notification("Nouveau message CGE Immobilier", {
      body,
      icon: cgeLogo,
    });
  }, [messages, notificationSupported, notificationPermission, isReady]);

  return (
    <div className="flex min-h-dvh w-full items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.12),_transparent_28%),linear-gradient(135deg,#0b1220_0%,#111827_45%,#1f2937_100%)] p-0 sm:p-6">
      <div className="relative flex h-dvh w-full flex-col overflow-hidden bg-[#f7f8fb] shadow-2xl shadow-black/30 sm:h-[88vh] sm:max-h-[860px] sm:max-w-md sm:rounded-[28px]">
        {/* Header */}
        <header className="flex items-center gap-3 border-b border-black/5 bg-white/85 px-4 py-3.5 backdrop-blur-md sm:px-5">
          <div className="relative shrink-0">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-md shadow-copper-500/25">
              <img src={cgeLogo} alt="CGE Immobilier" className="h-10 w-10 rounded-2xl object-contain" />
            </div>
            <span
              className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white ${
                ADMIN_ONLINE ? "bg-sage-500" : "bg-amber-500"
              }`}
            />
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-sm font-semibold text-ink-900">{businessInfo.name}</p>
            <div className="mt-0.5 flex items-center gap-1.5">
              <Sparkles size={12} className={ADMIN_ONLINE ? "text-sage-500" : "text-amber-600"} />
              <p className={`text-xs ${ADMIN_ONLINE ? "text-sage-500" : "text-amber-600"}`}>
                {ADMIN_ONLINE ? "Conseiller en ligne" : "Assistant automatique · Conseiller hors ligne"}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1 text-ink-700/50">
            <button
              title={
                notificationSupported
                  ? notificationPermission === "granted"
                    ? "Notifications activées"
                    : notificationPermission === "denied"
                      ? "Notifications refusées"
                      : "Activer les notifications"
                  : "Notifications non supportées"
              }
              onClick={requestNotificationPermission}
              className="rounded-full p-2 transition hover:bg-ink-950/5"
            >
              <Bell size={17} className={notificationPermission === "granted" ? "text-amber-600" : ""} />
            </button>
            <button
              title="Bientôt disponible"
              onClick={() => handleComingSoon("📞 Les appels arrivent dans une prochaine étape")}
              className="rounded-full p-2 transition hover:bg-ink-950/5"
            >
              <Phone size={17} />
            </button>
            <button
              title="Bientôt disponible"
              onClick={() => handleComingSoon("🎥 Les appels vidéo arrivent dans une prochaine étape")}
              className="rounded-full p-2 transition hover:bg-ink-950/5"
            >
              <Video size={17} />
            </button>
            <button className="rounded-full p-2 transition hover:bg-ink-950/5">
              <MoreVertical size={17} />
            </button>
          </div>
        </header>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 space-y-3.5 overflow-y-auto px-4 py-5 thin-scrollbar">
          {!isReady && (
            <div className="flex h-full items-center justify-center text-xs text-ink-700/40">
              Connexion à la discussion…
            </div>
          )}

          {isReady && (
            <div className="mb-2 flex justify-center">
              <span className="rounded-full bg-black/5 px-3 py-1 text-[11px] font-medium text-ink-700/45">
                Aujourd'hui
              </span>
            </div>
          )}

          {messages.map((m) => (
            <ChatBubble key={m.id} message={{ ...m, time: formatTime(m.createdAt) }} />
          ))}

          {isTyping && <TypingIndicator />}
        </div>

        {/* Suggestions rapides */}
        {showSuggestions && isReady && (
          <div className="border-t border-black/5 bg-white/70 px-3 py-3 backdrop-blur-md">
            <QuickReplyChips onSelect={handleSend} />
          </div>
        )}

        {/* Saisie */}
        <ChatInput onSend={handleSend} onComingSoon={handleComingSoon} disabled={!isReady || isUploading} />

        {/* Toast */}
        {toast && (
          <div className="absolute bottom-20 left-1/2 z-10 w-max max-w-[85%] -translate-x-1/2 rounded-full bg-[#111111] px-4 py-2 text-xs font-medium text-white shadow-xl shadow-black/20 animate-toast-in">
            {toast}
          </div>
        )}
      </div>
    </div>
  );
}
