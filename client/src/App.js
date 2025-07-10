import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import Register from './components/Register';
import Chat from './components/Chat';
import Loading from './components/Loading';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="App">
      <Routes>
        <Route 
          path="/login" 
          element={user ? <Navigate to="/chat" /> : <Login />} 
        />
        <Route 
          path="/register" 
          element={user ? <Navigate to="/chat" /> : <Register />} 
        />
        <Route 
          path="/chat" 
          element={user ? <Chat /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/" 
          element={<Navigate to={user ? "/chat" : "/login"} />} 
        />
      </Routes>
    </div>
  );
}

export default App; 