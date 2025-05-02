import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  onAuthStateChanged 
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC2esxnkU3NQh1YPhT0l7WCAKDLI6TdgF0",
  authDomain: "aifree-59a82.firebaseapp.com",
  projectId: "aifree-59a82",
  storageBucket: "aifree-59a82.firebasestorage.app",
  messagingSenderId: "24288932282",
  appId: "1:24288932282:web:67e624024ef33f93b76d83",
  measurementId: "G-BQM2DL5K0L"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

// Authentication functions
export const loginUser = (email, password) => {
  return signInWithEmailAndPassword(auth, email, password);
};

export const registerUser = (email, password) => {
  return createUserWithEmailAndPassword(auth, email, password);
};

export const logoutUser = () => {
  return signOut(auth);
};

export const getCurrentUser = () => {
  return auth.currentUser;
};

export { auth, db, onAuthStateChanged };