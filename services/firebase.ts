
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyC4NddjijF29YNhowy4SqgRaMPn01oSSEg",
  authDomain: "school-9416e.firebaseapp.com",
  projectId: "school-9416e",
  storageBucket: "school-9416e.firebasestorage.app",
  messagingSenderId: "680872052240",
  appId: "1:680872052240:web:96d2e544166ab5f8096c95",
  measurementId: "G-5EBTV0MV83"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Login failed", error);
    throw error;
  }
};

export const logout = () => signOut(auth);
