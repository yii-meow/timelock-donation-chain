import React from 'react';
import { Routes, Route, useNavigate, Link } from 'react-router-dom';
import { ChatAppProvider } from './ChatAppContext';
import { NavBar, Filter, Alluser } from './chatappindex';
import './components/styles/ChatApp.css'

const ChatWrapper = ({ userState }) => {
    const navigate = useNavigate();

    return (
        <ChatAppProvider>
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