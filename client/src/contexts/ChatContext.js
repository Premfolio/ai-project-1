import React, { createContext, useContext, useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const ChatContext = createContext();

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

export const ChatProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [users, setUsers] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [typingUsers, setTypingUsers] = useState(new Set());

  // Initialize socket connection
  useEffect(() => {
    if (user) {
      const newSocket = io('http://localhost:5000');
      setSocket(newSocket);

      // Connect user to socket
      newSocket.emit('user_login', user._id);

      // Listen for new messages
      newSocket.on('new_message', (data) => {
        // If the message is for the current conversation, fetch latest messages
        if (selectedUser && (data.senderId === selectedUser._id || data.senderId === user._id || data.recipientId === selectedUser._id)) {
          fetchMessages(selectedUser._id);
        }
        // Always update conversations (for unread count)
        fetchConversations();
      });

      // Listen for user status changes
      newSocket.on('user_status', (data) => {
        setUsers(prev => prev.map(u => 
          u._id === data.userId 
            ? { ...u, status: data.status }
            : u
        ));
      });

      // Listen for typing indicators
      newSocket.on('user_typing', (data) => {
        if (data.isTyping) {
          setTypingUsers(prev => new Set([...prev, data.userId]));
        } else {
          setTypingUsers(prev => {
            const newSet = new Set(prev);
            newSet.delete(data.userId);
            return newSet;
          });
        }
      });

      return () => {
        newSocket.disconnect();
      };
    }
  }, [user]);

  // Fetch users
  const fetchUsers = async (search = '') => {
    try {
      const response = await axios.get(`/api/users?search=${search}`);
      setUsers(response.data.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  // Fetch conversations
  const fetchConversations = async () => {
    try {
      const response = await axios.get('/api/messages/conversations');
      setConversations(response.data.data);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  // Fetch messages for a conversation
  const fetchMessages = async (userId) => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/messages/conversation/${userId}`);
      setMessages(response.data.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setLoading(false);
    }
  };

  // Send a message
  const sendMessage = async (content, recipientId = selectedUser?._id) => {
    if (!content.trim() || !recipientId) return;

    try {
      const response = await axios.post('/api/messages/send', {
        recipientId,
        content: content.trim()
      });

      // Add message to local state
      const newMessage = {
        _id: Date.now(),
        sender: user._id,
        recipient: recipientId,
        content: content.trim(),
        createdAt: new Date().toISOString(),
        isRead: false
      };

      setMessages(prev => [...prev, newMessage]);

      // Emit socket event for real-time delivery
      if (socket) {
        socket.emit('private_message', {
          recipientId,
          message: content.trim(),
          senderId: user._id,
          timestamp: new Date().toISOString()
        });
      }

      // Update conversations
      fetchConversations();

      return { success: true };
    } catch (error) {
      toast.error('Failed to send message');
      return { success: false };
    }
  };

  // Handle typing indicator
  const handleTyping = (isTyping) => {
    if (socket && selectedUser) {
      socket.emit('typing', {
        recipientId: selectedUser._id,
        isTyping
      });
    }
  };

  // Select a user to chat with
  const selectUser = async (user) => {
    // Defensive check: only allow plain objects
    if (!user || user === null || typeof user !== 'object' || Array.isArray(user) || user.$$typeof) {
      console.error('Invalid user passed to selectUser:', user);
      toast.error('Invalid user selected. Please try again.');
      return;
    }
    setSelectedUser(user);
    await fetchMessages(user._id);
  };

  // Mark messages as read
  const markAsRead = async (senderId) => {
    try {
      await axios.put(`/api/messages/read/${senderId}`);
      setMessages(prev => prev.map(msg => 
        msg.sender === senderId && !msg.isRead
          ? { ...msg, isRead: true }
          : msg
      ));
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  // Load initial data
  useEffect(() => {
    if (user) {
      fetchUsers();
      fetchConversations();
    }
  }, [user]);



  const value = {
    users,
    conversations,
    selectedUser,
    messages,
    loading,
    typingUsers,
    fetchUsers,
    fetchConversations,
    sendMessage,
    selectUser,
    markAsRead,
    handleTyping,
    setMessages // Export setMessages for direct message updates
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
}; 