import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Store from './pages/Store';
import Admin from './pages/Admin';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Debug component to show auth state in the admin route
function DebugAuth() {
  const { user, isAdmin } = useAuth();
  return (
    <div style={{ 
      position: 'fixed', 
      bottom: '10px', 
      right: '10px', 
      background: 'rgba(0,0,0,0.8)', 
      color: 'white', 
      padding: '10px',
      zIndex: 9999,
      borderRadius: '5px'
    }}>
      <p>User: {user ? `Logged in (${user.email})` : 'Not logged in'}</p>
      <p>Admin: {isAdmin ? 'Yes' : 'No'}</p>
      <p>User ID: {user?.id || 'N/A'}</p>
    </div>
  );
}

function ProtectedAdminRoute({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, isLoading } = useAuth();
  
  // Show loading state while auth is initializing
  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div>Loading admin dashboard...</div>
        <DebugAuth />
      </div>
    );
  }
  
  if (!user) {
    console.log("Admin access denied: Not logged in");
    return <Navigate to="/" replace />;
  }
  
  if (!isAdmin) {
    console.log("Admin access denied: Not an admin");
    return <Navigate to="/" replace />;
  }
  
  console.log("Admin access granted");
  return <>{children}</>;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-center" />
        <Routes>
          <Route path="/" element={<><Store /><DebugAuth /></>} />
          <Route 
            path="/admin/*" 
            element={
              <ProtectedAdminRoute>
                <Admin />
                <DebugAuth />
              </ProtectedAdminRoute>
            } 
          />
          <Route path="/debug" element={<DebugAuth />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;