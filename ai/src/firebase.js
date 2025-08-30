// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDSBsmm2d0UmtGV3DcHed7B1drOVl-VUmE",
  authDomain: "tourish-ai.firebaseapp.com",
  projectId: "tourish-ai",
  storageBucket: "tourish-ai.firebasestorage.app",
  messagingSenderId: "523542284515",
  appId: "1:523542284515:web:210ed33e1dae38f12a1dd6",
  measurementId: "G-PLLS2GBBC1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

export default app;