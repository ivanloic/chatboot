import {
  collection,
  doc,
  addDoc,
  setDoc,
  getDoc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "./config";
import { uploadToCloudinary } from "./cloudinary";

const CONVERSATIONS = "conversations";

function conversationDocRef(conversationId) {
  return doc(db, CONVERSATIONS, conversationId);
}

function messagesColRef(conversationId) {
  return collection(db, CONVERSATIONS, conversationId, "messages");
}

/**
 * Crée le document de conversation s'il n'existe pas encore (merge:true =
 * ne touche pas aux champs déjà présents si la conversation existe déjà).
 */
export async function ensureConversation(conversationId) {
  const ref = conversationDocRef(conversationId);
  const existing = await getDoc(ref);
  const isNew = !existing.exists();

  await setDoc(
    ref,
    {
      name: `Client ${conversationId.slice(0, 6)}`,
      photoURL: null,
      status: "open",
      createdAt: serverTimestamp(),
      lastMessage: "",
      lastMessageAt: serverTimestamp(),
      lastSender: null,
      unreadByAdmin: false,
    },
    { merge: true }
  );

  return isNew;
}

/**
 * Écoute en temps réel tous les messages d'une conversation, triés par date.
 * Retourne une fonction "unsubscribe" à appeler dans le cleanup du useEffect.
 */
export function subscribeToMessages(conversationId, onMessages) {
  const q = query(messagesColRef(conversationId), orderBy("createdAt", "asc"));
  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
    onMessages(messages);
  });
}

async function touchConversation(conversationId, lastMessage, senderType) {
  await updateDoc(conversationDocRef(conversationId), {
    lastMessage,
    lastMessageAt: serverTimestamp(),
    lastSender: senderType,
    // Un message client mais un admin absent : la conversation devient "non lue"
    unreadByAdmin: senderType === "client",
  });
}

export async function sendTextMessage(conversationId, senderType, text) {
  await addDoc(messagesColRef(conversationId), {
    senderType, // "client" | "bot" | "system" | "admin"
    type: "text",
    text,
    createdAt: serverTimestamp(),
  });
  await touchConversation(conversationId, text, senderType);
}

/**
 * Envoie une image ou un vocal : upload vers Firebase Storage, puis enregistrement
 * du message dans Firestore avec l'URL de téléchargement.
 * @param {"image"|"voice"} type
 * @param {File|Blob} file
 */
export async function sendMediaMessage(conversationId, senderType, type, file) {
  if (!file) {
    throw new Error("Fichier manquant pour l'envoi de médias.");
  }

  const extension =
    type === "voice"
      ? "webm"
      : type === "pdf"
        ? "pdf"
        : file.name?.split(".").pop() || "jpg";
  const originalName = file.name || `${type}.${extension}`;

  const resourceType = type === "image" ? "image" : type === "pdf" ? "raw" : "auto";

  let url;
  try {
    url = await uploadToCloudinary(file, `conversations/${conversationId}`, resourceType);
  } catch (cloudinaryError) {
    console.warn("Cloudinary upload failed, falling back to Firebase Storage:", cloudinaryError);
    const path = `conversations/${conversationId}/${type}/${Date.now()}.${extension}`;
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    url = await getDownloadURL(storageRef);
  }

  await addDoc(messagesColRef(conversationId), {
    senderType,
    type,
    url,
    text: "",
    originalName,
    createdAt: serverTimestamp(),
  });

  const label =
    type === "image"
      ? "📷 Photo"
      : type === "voice"
        ? "🎤 Message vocal"
        : type === "pdf"
          ? "📄 PDF"
          : "📎 Fichier";
  await touchConversation(conversationId, label, senderType);

  return url;
}
