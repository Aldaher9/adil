import React, { useState } from "react";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { useNavigate } from "react-router-dom";
import { Lock, Mail, UserPlus, LogIn } from "lucide-react";

export default function Login() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (isRegistering) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        // Create user doc with default role 'teacher'
        await setDoc(doc(db, "users", userCredential.user.uid), {
          email: userCredential.user.email,
          role: "teacher", // Default role
          createdAt: new Date()
        });
        navigate("/teacher");
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        navigate("/");
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        setError("Email already in use.");
      } else if (err.code === 'auth/invalid-credential') {
        setError("Invalid credentials.");
      } else {
        setError("Authentication failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-indigo-600 p-8 text-center">
          <h1 className="text-3xl font-bold text-white mb-2">
            {isRegistering ? "Create Account" : "Welcome Back"}
          </h1>
          <p className="text-indigo-100">
            {isRegistering ? "Join the school rewards system" : "Sign in to access the rewards system"}
          </p>
        </div>
        
        <form onSubmit={handleAuth} className="p-8 space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                required
              />
            </div>
            
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                required
                minLength={6}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition-colors shadow-lg shadow-indigo-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? "Processing..." : (isRegistering ? "Sign Up" : "Sign In")}
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setIsRegistering(!isRegistering)}
              className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center justify-center gap-1 mx-auto"
            >
              {isRegistering ? (
                <>
                  <LogIn size={16} />
                  Already have an account? Sign In
                </>
              ) : (
                <>
                  <UserPlus size={16} />
                  Need an account? Sign Up
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
