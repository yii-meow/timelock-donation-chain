import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MainPage from './components/MainPage';
import UserDashboard from './components/UserDashboard';
import CharityDashboard from './components/CharityDashboard';
import ChatWrapper from './ChatWrapper';
import AdminDashboard from './components/AdminDashboard';

function App() {
  const [userState, setUserState] = useState({
    address: '',
    authManagerContract: null,
    timeLockContract: null,
    isConnected: false,
    isUser: false,
    isCharity: false,
    isAdmin: false,
    isSignatory: false
  });

  const disconnectWallet = () => {
    setUserState({
      address: '',
      authManagerContract: null,
      timeLockContract: null,
      isConnected: false,
      isUser: false,
      isCharity: false,
      isAdmin: false,
      isSignatory: false
    });
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={
          <MainPage
            userState={userState}
            setUserState={setUserState}
            disconnectWallet={disconnectWallet}
          />
        } />
        <Route path="/dashboard" element={
          userState.isUser ? (
            <UserDashboard
              userState={userState}
              setUserState={setUserState}
              onDisconnect={disconnectWallet}
            />
          ) : (
            <Navigate to="/" replace />
          )
        } />
        <Route path="/charity-dashboard" element={
          userState.isCharity ? (
            <CharityDashboard
              userState={userState}
              setUserState={setUserState}
              onDisconnect={disconnectWallet}
            />
          ) : (
            <Navigate to="/" replace />
          )
        } />
        <Route path="/chat/*" element={
          <ChatWrapper
            userState={userState}
          />
        } />
        <Route path="/admin-dashboard" element={
          userState.isAdmin ? (
            <AdminDashboard
              authManagerContract={userState.authManagerContract}
              adminAddress={userState.address}
              onDisconnect={disconnectWallet}
              userState={userState}
              setUserState={setUserState}
            />
          ) : (
            <Navigate to="/" replace />
          )
        } />
      </Routes>
    </Router>
  );
}

export default App;