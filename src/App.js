import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MainPage from './components/MainPage';
import UserDashboard from './components/UserDashboard';
import CharityDashboard from './components/CharityDashboard';
import ChatWrapper from './ChatWrapper';

function App() {
  const [userState, setUserState] = useState({
    address: '',
    authManagerContract: null,
    isConnected: false,
    isUser: false,
    isCharity: false,
  });

  const disconnectWallet = () => {
    setUserState({
      address: '',
      authManagerContract: null,
      isConnected: false,
      isUser: false,
      isCharity: false,
    });
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={
          <MainPage
            setUserState={setUserState}
            userState={userState}
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
      </Routes>
    </Router>
  );
}

export default App;