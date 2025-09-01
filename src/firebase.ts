// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCio8ggvjeAPlm1eugZQQKq2KNe6AJv_dA",
  authDomain: "studybuddy-51723.firebaseapp.com",
  projectId: "studybuddy-51723",
  storageBucket: "studybuddy-51723.firebasestorage.app",
  messagingSenderId: "852284732465",
  appId: "1:852284732465:web:f64f4b538a855419051110",
  measurementId: "G-JWKN3XJC6K"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);
