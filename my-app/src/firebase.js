import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAVltkW4AxkFQF-MWp_cIVVFfpyHg9uEEs",
  authDomain: "blood-app-78bf3.firebaseapp.com",
  projectId: "blood-app-78bf3",
  storageBucket: "blood-app-78bf3.firebasestorage.app",
  messagingSenderId: "775133398035",
  appId: "1:775133398035:web:8e3551551d73857e7f2be6"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);