import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA_zuUkYaI677kuEdHM3GeZeRYEyM6el4E",
  authDomain: "pricehawk-9301f.firebaseapp.com",
  projectId: "pricehawk-9301f",
  storageBucket: "pricehawk-9301f.appspot.com",
  messagingSenderId: "1097119943756",
  appId: "1:1097119943756:web:c8d5a99d90e470993978e9",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
