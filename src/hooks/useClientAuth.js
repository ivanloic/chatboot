import { useEffect, useState } from "react";
import { onAuthStateChanged, signInAnonymously } from "firebase/auth";
import { auth } from "../firebase/config";

/**
 * Connecte le visiteur anonymement à Firebase Auth.
 * Le UID généré est stable pour ce navigateur (Firebase le garde en cache),
 * donc si le client revient plus tard, il retrouve la MÊME conversation.
 * On s'en sert comme identifiant unique de conversation (conversationId = uid).
 */
export function useClientAuth() {
  const [uid, setUid] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUid(user.uid);
      } else {
        signInAnonymously(auth).catch((err) => {
          console.error("Erreur de connexion anonyme :", err);
          setError(err);
        });
      }
    });
    return unsubscribe;
  }, []);

  return { uid, error };
}
