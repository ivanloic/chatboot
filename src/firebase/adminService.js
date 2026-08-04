import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  getDocs,
  writeBatch,
  deleteDoc,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "./config";

const CONVERSATIONS = "conversations";

/** Écoute TOUTES les conversations en temps réel, triées par activité récente. */
export function subscribeToConversations(onChange) {
  const q = query(collection(db, CONVERSATIONS), orderBy("lastMessageAt", "desc"));
  return onSnapshot(q, (snapshot) => {
    onChange(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

export async function markConversationRead(conversationId) {
  await updateDoc(doc(db, CONVERSATIONS, conversationId), { unreadByAdmin: false });
}

export async function renameConversation(conversationId, name) {
  await updateDoc(doc(db, CONVERSATIONS, conversationId), { name });
}

export async function updateConversationPhoto(conversationId, file) {
  const path = `conversations/${conversationId}/profile/${Date.now()}-${file.name}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);
  await updateDoc(doc(db, CONVERSATIONS, conversationId), { photoURL: url });
  return url;
}

/**
 * Supprime une conversation ET tous ses messages (Firestore ne supprime jamais
 * une sous-collection automatiquement quand on supprime le document parent).
 * On découpe en lots de 450 pour rester sous la limite de 500 opérations/batch.
 */
export async function deleteConversation(conversationId) {
  const messagesSnap = await getDocs(collection(db, CONVERSATIONS, conversationId, "messages"));

  const batches = [];
  let batch = writeBatch(db);
  let opsInBatch = 0;

  messagesSnap.docs.forEach((docSnap) => {
    batch.delete(docSnap.ref);
    opsInBatch++;
    if (opsInBatch === 450) {
      batches.push(batch);
      batch = writeBatch(db);
      opsInBatch = 0;
    }
  });
  batches.push(batch);

  for (const b of batches) {
    await b.commit();
  }

  await deleteDoc(doc(db, CONVERSATIONS, conversationId));
}
