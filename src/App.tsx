import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./lib/auth-context";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import TeacherDashboard from "./pages/TeacherDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import { isFirebaseConfigured } from "./lib/firebase";

function ConfigWarning() {
  if (isFirebaseConfigured) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-90 p-4">
      <div className="bg-white rounded-xl p-8 max-w-md w-full text-center shadow-2xl">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">⚠️</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Configuration Required</h2>
        <p className="text-gray-600 mb-6">
          Please set up your Firebase configuration in the environment variables to continue.
        </p>
        <div className="bg-gray-50 p-4 rounded-lg text-left text-sm font-mono text-gray-700 overflow-x-auto">
          VITE_FIREBASE_API_KEY=...<br/>
          VITE_FIREBASE_AUTH_DOMAIN=...<br/>
          VITE_FIREBASE_PROJECT_ID=...
        </div>
      </div>
    </div>
  );
}

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) {
  const { user, role, loading } = useAuth();

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  
  if (!user) return <Navigate to="/login" />;
  
  if (allowedRoles && role && !allowedRoles.includes(role)) {
    return <Navigate to="/" />; // Or unauthorized page
  }

  return <>{children}</>;
}

function RoleRedirect() {
  const { role, loading } = useAuth();
  
  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  
  if (role === 'admin') return <Navigate to="/admin" />;
  return <Navigate to="/teacher" />;
}

export default function App() {
  return (
    <AuthProvider>
      <ConfigWarning />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route element={<Layout />}>
            <Route path="/" element={
              <ProtectedRoute>
                <RoleRedirect />
              </ProtectedRoute>
            } />
            
            <Route path="/teacher" element={
              <ProtectedRoute allowedRoles={['teacher', 'admin']}>
                <TeacherDashboard />
              </ProtectedRoute>
            } />
            
            <Route path="/admin" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            } />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
