import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Toutes les valeurs viennent du fichier .env (voir .env.example à la racine)
const firebaseConfig = {
  apiKey: "AIzaSyDGTxuCIbK31eto526OtGZwt38UH1lPtEo",
  authDomain: "chatbot-5c2fd.firebaseapp.com",
  projectId: "chatbot-5c2fd",
  storageBucket: "chatbot-5c2fd.firebasestorage.app",
  messagingSenderId: "46135127205",
  appId: "1:46135127205:web:aaab72baf679d8fdfdb14c",
  measurementId: "G-T4YKFRDTJB"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const cloudinary = {
  cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "",
  uploadPreset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "",
  folder: import.meta.env.VITE_CLOUDINARY_FOLDER || "chatbot",
};
export default app;
