import React from 'react';
import { Routes, Route, useNavigate, Link } from 'react-router-dom';
import { ChatAppProvider } from './ChatAppContext';
import { NavBar, Filter, Alluser } from './chatappindex';

const ChatWrapper = ({ userState }) => {
    const navigate = useNavigate();

    const handleExitChat = () => {
        if (userState.isUser) {
            navigate('/dashboard');
        } else if (userState.isCharity) {
            navigate('/charity-dashboard');
        } else {
            navigate('/');
        }
    };

    return (
        <ChatAppProvider>
            <div className="chat-app-wrapper">
                <button onClick={handleExitChat} className="exit-chat-btn">Exit Chat</button>
                <NavBar />
                <div>
                    <Link to="/chat">Chat Home</Link>
                    <Link to="/chat/allusers">All Users</Link>
                </div>
                <Routes>
                    <Route index element={<Filter />} />
                    <Route path="allusers" element={<Alluser />} />
                </Routes>
            </div>
        </ChatAppProvider>
    );
};

export default ChatWrapper;