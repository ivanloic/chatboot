import { Sparkles, Clock, Bot, User } from "lucide-react";

const urlRegex = /(https?:\/\/[^\s]+)/g;

function renderTextWithLinks(text) {
  if (!text) return text;
  return text.split(urlRegex).map((part, index) => {
    if (urlRegex.test(part)) {
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noreferrer"
          className="text-amber-700 underline decoration-amber-300 transition hover:text-amber-900"
        >
          {part}
        </a>
      );
    }
    return part;
  });
}

/**
 * @param {object} message - { senderType, type, text, url, time }
 * @param {"client"|"admin"} perspective - du point de vue de qui on affiche la conversation
 */
export default function ChatBubble({ message, perspective = "client" }) {
  const { senderType, type, text, url, time } = message;

  if (senderType === "system") {
    return (
      <div className="mx-auto flex max-w-[85%] items-start gap-2 rounded-xl border border-amber-500/25 bg-amber-500/10 px-3.5 py-2.5 text-xs text-amber-700 animate-message-in">
        <Clock size={14} className="mt-0.5 shrink-0" />
        <p className="leading-relaxed">{text}</p>
      </div>
    );
  }

  const isBot = senderType === "bot";
  const isOwn = perspective === "client" ? senderType === "client" : senderType === "admin";

  const bubbleColor = isOwn
    ? "rounded-br-md bg-copper-500 text-white"
    : isBot
      ? "rounded-bl-md border border-dashed border-copper-500/30 bg-copper-100/50 text-ink-900"
      : "rounded-bl-md border border-black/5 bg-white text-ink-900";

  return (
    <div className={`flex items-end gap-2 animate-message-in ${isOwn ? "flex-row-reverse" : ""}`}>
      {!isOwn && (
        <div
          className={`mb-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white ${
            isBot ? "bg-copper-500" : "bg-ink-700"
          }`}
        >
          {isBot ? <Sparkles size={13} /> : <User size={13} />}
        </div>
      )}
      <div className={`flex max-w-[75%] flex-col gap-1 ${isOwn ? "items-end" : "items-start"}`}>
        {isBot && perspective === "admin" && (
          <span className="flex items-center gap-1 px-1 text-[10px] font-medium text-copper-600">
            <Bot size={11} /> Réponse automatique
          </span>
        )}
        <div
          className={`overflow-hidden rounded-2xl text-sm leading-relaxed shadow-sm ${
            type === "image" ? "p-1" : "px-4 py-2.5"
          } ${bubbleColor}`}
        >
          {type === "image" && url && (
            <img src={url} alt="Image envoyée" className="max-h-64 w-full rounded-xl object-cover" />
          )}
          {type === "voice" && url && <audio controls src={url} className="h-10 w-56 max-w-full" />}
          {type === "pdf" && url && (
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="inline-block rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm font-medium text-amber-700 transition hover:bg-amber-50"
            >
              Ouvrir le PDF
            </a>
          )}
          {type !== "image" && type !== "voice" && type !== "pdf" && renderTextWithLinks(text)}
          {type === "image" && text ? <p className="px-2 py-1.5">{renderTextWithLinks(text)}</p> : null}
        </div>
        <span className="px-1 text-[10px] text-ink-700/35">{time}</span>
      </div>
    </div>
  );
}
