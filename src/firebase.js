// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getDatabase } from 'firebase/database'; 

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCe8ltCiHx23kUpIVTYc1ICzmYdb2rPZv8",
  authDomain: "livetracking-e89fe.firebaseapp.com",
  databaseURL: "https://livetracking-e89fe-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "livetracking-e89fe",
  storageBucket: "livetracking-e89fe.firebasestorage.app",
  messagingSenderId: "944330527463",
  appId: "1:944330527463:web:ec81e08b7d18d864d8c842",
  measurementId: "G-1088S6RY7K"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export { database };