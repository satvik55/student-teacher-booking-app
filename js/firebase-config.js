// js/firebase-config.js

// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBMafdbMLd7Ubtv8OlOpHLmHYfNkEi78Ag",
  authDomain: "student-teacher-app-32220.firebaseapp.com",
  projectId: "student-teacher-app-32220",
  storageBucket: "student-teacher-app-32220.appspot.com", // Corrected storage bucket domain
  messagingSenderId: "640427601675",
  appId: "1:640427601675:web:82dca3e69398fd7d30fc0e",
  measurementId: "G-T49NWPQ39N"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export the services you need
export const auth = getAuth(app);
export const db = getFirestore(app);
