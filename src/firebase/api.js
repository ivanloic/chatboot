// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDGTxuCIbK31eto526OtGZwt38UH1lPtEo",
  authDomain: "chatbot-5c2fd.firebaseapp.com",
  projectId: "chatbot-5c2fd",
  storageBucket: "chatbot-5c2fd.firebasestorage.app",
  messagingSenderId: "46135127205",
  appId: "1:46135127205:web:aaab72baf679d8fdfdb14c",
  measurementId: "G-T4YKFRDTJB"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);