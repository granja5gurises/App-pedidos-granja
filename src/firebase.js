
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDQ562gtx59ISW3aqYkwNYMFwpRv1NEP8o",
  authDomain: "granja5gapp-c4da7.firebaseapp.com",
  projectId: "granja5gapp-c4da7",
  storageBucket: "granja5gapp-c4da7.firebasestorage.app",
  messagingSenderId: "613567549653",
  appId: "1:613567549653:web:8dd202d51e70a70643525c"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };
