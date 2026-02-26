import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, onSnapshot, updateDoc, getDoc } from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { GameState } from '../types/game';

// Placeholder config - User must replace this!
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase only if config is valid (prevent crash in preview)
let db: any;
let auth: any;

try {
  if (firebaseConfig.apiKey !== "YOUR_API_KEY") {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
  }
} catch (e) {
  console.warn("Firebase not initialized. Check config.");
}

export const createRoom = async (gameState: GameState): Promise<string> => {
  if (!db) throw new Error("Firebase not configured");
  
  // Sign in anonymously first
  if (!auth.currentUser) await signInAnonymously(auth);

  const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
  await setDoc(doc(db, "rooms", roomId), {
    gameState,
    createdAt: new Date(),
    hostId: auth.currentUser.uid
  });
  return roomId;
};

export const joinRoom = async (roomId: string): Promise<GameState | null> => {
  if (!db) throw new Error("Firebase not configured");
  
  if (!auth.currentUser) await signInAnonymously(auth);

  const docRef = doc(db, "rooms", roomId);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return docSnap.data().gameState as GameState;
  } else {
    return null;
  }
};

export const subscribeToRoom = (roomId: string, callback: (state: GameState) => void) => {
  if (!db) return () => {};
  
  return onSnapshot(doc(db, "rooms", roomId), (doc) => {
    if (doc.exists()) {
      callback(doc.data().gameState as GameState);
    }
  });
};

export const updateRoomState = async (roomId: string, newState: GameState) => {
  if (!db) return;
  await updateDoc(doc(db, "rooms", roomId), {
    gameState: newState
  });
};
