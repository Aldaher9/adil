import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  increment, 
  serverTimestamp, 
  query, 
  where, 
  orderBy, 
  limit 
} from "firebase/firestore";
import { db } from "./firebase";

export interface Student {
  id: string;
  name: string;
  class: string;
  totalPoints: number;
  qrCode: string;
}

export interface ReinforcementPhrase {
  id: string;
  text: string;
  points: number;
  active: boolean;
}

export interface ReinforcementLog {
  id: string;
  studentId: string;
  teacherId: string;
  phrase: string;
  points: number;
  timestamp: any;
}

// Student Operations
export const getStudent = async (studentId: string): Promise<Student | null> => {
  const docRef = doc(db, "students", studentId);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Student;
  } else {
    return null;
  }
};

// Reinforcement Operations
export const getReinforcementPhrases = async (): Promise<ReinforcementPhrase[]> => {
  const q = query(collection(db, "reinforcement_phrases"), where("active", "==", true));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ReinforcementPhrase));
};

export const addReinforcement = async (
  studentId: string, 
  teacherId: string, 
  phrase: string, 
  points: number
) => {
  // 1. Add log
  await addDoc(collection(db, "reinforcements"), {
    studentId,
    teacherId,
    phrase,
    points,
    timestamp: serverTimestamp()
  });

  // 2. Update student total points
  const studentRef = doc(db, "students", studentId);
  await updateDoc(studentRef, {
    totalPoints: increment(points)
  });
};

export const getDailyPoints = async (studentId: string): Promise<number> => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const q = query(
    collection(db, "reinforcements"),
    where("studentId", "==", studentId),
    where("timestamp", ">=", today)
  );

  const querySnapshot = await getDocs(q);
  let total = 0;
  querySnapshot.forEach((doc) => {
    total += doc.data().points;
  });
  return total;
};

// Admin Operations
export const getAllStudents = async (): Promise<Student[]> => {
  const q = query(collection(db, "students"), orderBy("totalPoints", "desc"));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student));
};

export const getAllPhrases = async (): Promise<ReinforcementPhrase[]> => {
  const querySnapshot = await getDocs(collection(db, "reinforcement_phrases"));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ReinforcementPhrase));
};

export const updatePhrase = async (id: string, data: Partial<ReinforcementPhrase>) => {
  const phraseRef = doc(db, "reinforcement_phrases", id);
  await updateDoc(phraseRef, data);
};

export const addPhrase = async (text: string, points: number) => {
  await addDoc(collection(db, "reinforcement_phrases"), {
    text,
    points,
    active: true
  });
};
