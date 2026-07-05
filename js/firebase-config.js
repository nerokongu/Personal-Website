import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import {
  getAuth
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";
import {
  getFirestore
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

const firebaseConfig = { 
  apiKey : "AIzaSyDIu2UWWc5iijH2tiil7aaeC8EmDdXnHog" , 
  authDomain : "nerohouse-web.firebaseapp.com" , 
  projectId : "nerohouse-web" , 
  storageBucket : "nerohouse-web.firebasestorage.app" , 
  messagingSenderId : "535132744778" , 
  appId : "1:535132744778:web:17b9bfbcce35705758cab3" , 
  measurementId : "G-QG9VGF6KM8" 
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);