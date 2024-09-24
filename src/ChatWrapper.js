import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ChatAppProvider } from './ChatAppContext';
import { NavBar, Filter, Alluser } from './components/chatappindex';
import './components/styles/ChatApp.css'

const ChatWrapper = ({ userState }) => {
    if (!userState.isConnected || (!userState.isUser && !userState.isCharity)) {
        return <Navigate to="/" replace />;
    }

    return (
        <ChatAppProvider initialUserState={userState}>
            <div className="chat-app-wrapper text-white">
                <NavBar />
                <Routes>
                    <Route path="chat" element={<Filter />} />
                    <Route path="allusers" element={<Alluser />} />
                </Routes>
            </div>
        </ChatAppProvider>
    );
};

export default ChatWrapper;