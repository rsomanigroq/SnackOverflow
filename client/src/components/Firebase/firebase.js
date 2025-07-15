// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
import { getAuth } from 'firebase/auth'
import {
  getFirestore,
  } from 'firebase/firestore';
// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDiwxWhZ1cgsxDHjI4v64l1GzUu4XkuMeU",
  authDomain: "project-a1a08.firebaseapp.com",
  projectId: "project-a1a08",
  storageBucket: "project-a1a08.firebasestorage.app",
  messagingSenderId: "715052893996",
  appId: "1:715052893996:web:e7d4a09126616e72ab8e89"
};

// Initialize Firebase
export const Firebase = initializeApp(firebaseConfig);
export const auth = getAuth();
export const db = getFirestore(Firebase);