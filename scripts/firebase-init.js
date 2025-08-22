import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

const firebaseConfig = {
  apiKey: "AIzaSyChCxRwuIdx4eDL2hZiIa_N-J1oezJefOQ",
  authDomain: "licencias-easysql.firebaseapp.com",
  databaseURL: "https://licencias-easysql-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "licencias-easysql",
  storageBucket: "licencias-easysql.firebasestorage.app",
  messagingSenderId: "1097237756092",
  appId: "1:1097237756092:web:c4c895bc986ab4df8fb8b9"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
