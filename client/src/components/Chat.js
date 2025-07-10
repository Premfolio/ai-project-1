import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useChat } from '../contexts/ChatContext';
import Sidebar from './chat/Sidebar';
import ChatArea from './chat/ChatArea';
import { FiMenu, FiX } from 'react-icons/fi';

const Container = styled.div`
  display: flex;
  height: 100vh;
  background: #f0f2f5;
`;

const MobileMenuButton = styled.button`
  display: none;
  position: fixed;
  top: 20px;
  left: 20px;
  z-index: 1000;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  transition: all 0.3s ease;

  &:hover {
    transform: scale(1.1);
  }

  @media (max-width: 768px) {
    display: flex;
    align-items: center;
    justify-content: center;
  }
`;

const SidebarContainer = styled(motion.div)`
  width: 350px;
  background: white;
  border-right: 1px solid #e1e5e9;
  display: flex;
  flex-direction: column;

  @media (max-width: 768px) {
    position: fixed;
    top: 0;
    left: 0;
    height: 100vh;
    z-index: 999;
    transform: translateX(${props => props.$isOpen ? '0' : '-100%'});
    transition: transform 0.3s ease;
  }
`;

const ChatContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  background: white;
  margin: 20px;
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  overflow: hidden;

  @media (max-width: 768px) {
    margin: 10px;
    border-radius: 15px;
  }
`;

const Overlay = styled.div`
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 998;

  @media (max-width: 768px) {
    display: ${props => props.$isOpen ? 'block' : 'none'};
  }
`;

const Chat = () => {
  const { user, logout } = useAuth();
  const { selectedUser, selectUser } = useChat();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Close sidebar on mobile when user is selected
  useEffect(() => {
    if (selectedUser && window.innerWidth <= 768) {
      setSidebarOpen(false);
    }
  }, [selectedUser]);

  const handleUserSelect = (user) => {
    selectUser(user);
  };

  const handleLogout = () => {
    logout();
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <Container>
      <MobileMenuButton onClick={toggleSidebar}>
        {sidebarOpen ? <FiX size={20} /> : <FiMenu size={20} />}
      </MobileMenuButton>

      {/* Remove isOpen prop from Overlay and use sidebarOpen to control style directly */}
      <Overlay
        $isOpen={sidebarOpen && window.innerWidth <= 768}
        onClick={() => setSidebarOpen(false)}
      />

      <SidebarContainer
        $isOpen={sidebarOpen}
        initial={{ x: -350 }}
        animate={{ x: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Sidebar
          currentUser={user}
          onUserSelect={handleUserSelect}
          onLogout={handleLogout}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
        />
      </SidebarContainer>

      <ChatContainer>

        {selectedUser && selectedUser !== null && typeof selectedUser === 'object' && !Array.isArray(selectedUser) && !selectedUser.$$typeof ? (
          <ChatArea selectedUser={selectedUser} />
        ) : selectedUser ? (
          <div style={{ color: '#dc3545', padding: 20 }}>
            Invalid user data. Please reload or select another user.
          </div>
        ) : (
          <motion.div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: '#6c757d',
              textAlign: 'center',
              padding: '20px'
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div style={{ fontSize: '64px', marginBottom: '20px' }}>💬</div>
            <h2 style={{ marginBottom: '10px', color: '#333' }}>
              Welcome to Chat App
            </h2>
            <p style={{ fontSize: '16px', maxWidth: '400px' }}>
              Select a user from the sidebar to start chatting. 
              Your conversations will appear here in real-time.
            </p>
          </motion.div>
        )}
      </ChatContainer>
    </Container>
  );
};

export default Chat; 