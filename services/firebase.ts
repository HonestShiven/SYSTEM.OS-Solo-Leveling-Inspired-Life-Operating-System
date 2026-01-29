import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyAg2Vq7JzHDr7Ch9rJm-ghusfQ47vsGir4",
    authDomain: "system-os-app-31c2e.firebaseapp.com",
    projectId: "system-os-app-31c2e",
    storageBucket: "system-os-app-31c2e.firebasestorage.app",
    messagingSenderId: "8693184282",
    appId: "1:8693184282:web:adb87e9fcdf96c76d6dea3",
    measurementId: "G-L7KTCR3W8L"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Initialize Firestore
export const db = getFirestore(app);

export default app;
