import { doc, setDoc, onSnapshot, serverTimestamp } from "firebase/firestore";
import { db } from "./config";

const presenceDocRef = doc(db, "system", "adminPresence");
const HEARTBEAT_MS = 20000; // rafraîchit toutes les 20s tant que le dashboard est ouvert
const STALE_AFTER_MS = 45000; // si pas de heartbeat depuis 45s, on considère l'admin hors ligne

let heartbeatInterval = null;

export function startAdminPresence() {
  setDoc(presenceDocRef, { online: true, lastSeen: serverTimestamp() }, { merge: true });
  clearInterval(heartbeatInterval);
  heartbeatInterval = setInterval(() => {
    setDoc(presenceDocRef, { online: true, lastSeen: serverTimestamp() }, { merge: true });
  }, HEARTBEAT_MS);
}

export function stopAdminPresence() {
  clearInterval(heartbeatInterval);
  heartbeatInterval = null;
  setDoc(presenceDocRef, { online: false, lastSeen: serverTimestamp() }, { merge: true });
}

/**
 * Le client (widget de chat) écoute ce statut pour afficher "Conseiller en ligne / hors ligne".
 * On considère l'admin hors ligne si le dernier heartbeat date de plus de STALE_AFTER_MS
 * (protection si l'onglet admin a planté sans se déconnecter proprement).
 */
export function subscribeToAdminPresence(callback) {
  return onSnapshot(presenceDocRef, (snap) => {
    if (!snap.exists()) return callback(false);
    const data = snap.data();
    if (!data.online) return callback(false);

    const lastSeen = data.lastSeen?.toDate?.();
    if (!lastSeen) return callback(true); // vient d'être écrit, pas encore de round-trip serveur

    const isStale = Date.now() - lastSeen.getTime() > STALE_AFTER_MS;
    callback(!isStale);
  });
}
