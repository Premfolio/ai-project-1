import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { useChat } from '../../contexts/ChatContext';
import { FiSend, FiSmile, FiCornerUpLeft, FiStar } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import MessageActions from './MessageActions';
import axios from 'axios'; // Added axios import

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px;
  border-bottom: 1px solid #e1e5e9;
  background: white;
`;

const Avatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: ${props => props.color || '#667eea'};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 14px;
  position: relative;
`;

const OnlineIndicator = styled.div`
  position: absolute;
  bottom: 0;
  right: 0;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: ${props => props.online ? '#4caf50' : '#9e9e9e'};
  border: 2px solid white;
`;

const UserInfo = styled.div`
  flex: 1;
`;

const Username = styled.h3`
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
`;

const Status = styled.span`
  font-size: 12px;
  color: #6c757d;
`;

const MessagesContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background: #f8f9fa;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const MessageGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const Message = styled(motion.div)`
  display: flex;
  align-items: flex-end;
  gap: 8px;
  max-width: 70%;
  align-self: ${props => props.isOwn ? 'flex-end' : 'flex-start'};
  position: relative;
  flex-direction: ${props => props.isOwn ? 'row-reverse' : 'row'};

  &:hover {
    .message-actions {
      opacity: 1 !important;
    }
  }

  .message-actions {
    opacity: 0;
    transition: opacity 0.2s ease;
  }
`;

const MessageBubble = styled.div`
  background: ${props => props.isOwn ? '#667eea' : 'white'};
  color: ${props => props.isOwn ? 'white' : '#333'};
  padding: 12px 16px;
  border-radius: 18px;
  font-size: 14px;
  line-height: 1.4;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  word-wrap: break-word;
  max-width: 100%;
  position: relative;
  transition: all 0.2s ease;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
`;

const ReplyContainer = styled.div`
  background: rgba(0, 0, 0, 0.05);
  border-left: 3px solid #667eea;
  padding: 8px 12px;
  margin-bottom: 8px;
  border-radius: 8px;
  font-size: 12px;
  color: #666;
`;

const StarIcon = styled(FiStar)`
  color: #ffc107;
  margin-left: 4px;
`;

const MessageTime = styled.div`
  font-size: 11px;
  color: #9e9e9e;
  margin-top: 4px;
  text-align: ${props => props.isOwn ? 'right' : 'left'};
`;

const TypingIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 16px;
  color: #6c757d;
  font-size: 12px;
  font-style: italic;
`;

const InputContainer = styled.div`
  padding: 20px;
  background: white;
  border-top: 1px solid #e1e5e9;
`;

const InputWrapper = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 12px;
  background: #f8f9fa;
  border-radius: 25px;
  padding: 8px 16px;
  border: 2px solid transparent;
  transition: all 0.3s ease;

  &:focus-within {
    border-color: #667eea;
    background: white;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }
`;

const MessageInput = styled.textarea`
  flex: 1;
  border: none;
  background: transparent;
  resize: none;
  outline: none;
  font-size: 14px;
  line-height: 1.4;
  max-height: 100px;
  min-height: 20px;
  padding: 8px 0;

  &::placeholder {
    color: #6c757d;
  }
`;

const SendButton = styled(motion.button)`
  background: #667eea;
  color: white;
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &:hover:not(:disabled) {
    background: #5a6fd8;
    transform: scale(1.05);
  }
`;

const EmojiButton = styled.button`
  background: none;
  border: none;
  color: #6c757d;
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  transition: all 0.3s ease;

  &:hover {
    background: #e9ecef;
    color: #333;
  }
`;

const LoadingMessage = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: #6c757d;
`;

const EmptyMessage = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: #6c757d;
  text-align: center;
`;

const ChatArea = ({ selectedUser }) => {
  console.log('DEBUG selectedUser:', selectedUser);
  const { user } = useAuth();
  const { messages, loading, sendMessage, handleTyping, typingUsers, setMessages } = useChat(); // Added setMessages
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [forwardMessage, setForwardMessage] = useState(null);
  const [forwardModalOpen, setForwardModalOpen] = useState(false);
  const [forwardingMessage, setForwardingMessage] = useState(null);
  const { users } = useChat();
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [selectedUser]);

  const getInitials = (name) => {
    console.log('DEBUG getInitials called with:', name, typeof name);
    if (!name || typeof name !== 'string') {
      console.log('DEBUG getInitials: invalid input, returning empty string');
      return '';
    }
    const result = name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
    console.log('DEBUG getInitials result:', result, typeof result);
    return result;
  };

  const getAvatarColor = (name) => {
    if (!name || typeof name !== 'string') {
      return '#667eea';
    }
    const colors = ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe'];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setNewMessage(value);

    // Handle typing indicator
    if (value.length > 0 && !isTyping) {
      setIsTyping(true);
      handleTyping(true);
    } else if (value.length === 0 && isTyping) {
      setIsTyping(false);
      handleTyping(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    const message = newMessage.trim();
    setNewMessage('');
    setIsTyping(false);
    handleTyping(false);
    setReplyTo(null);

    await sendMessage(message);
  };

  const handleReply = (message) => {
    setReplyTo(message);
    inputRef.current?.focus();
  };

  const handleForward = (message) => {
    setForwardingMessage(message);
    setForwardModalOpen(true);
  };

  const handleForwardToUser = async (recipientId) => {
    try {
      await axios.post(`/api/messages/forward/${forwardingMessage._id}`, { recipientId });
      toast.success('Message forwarded!');
      setForwardModalOpen(false);
      setForwardingMessage(null);
    } catch (error) {
      toast.error('Failed to forward message');
    }
  };

  const handleDelete = async (messageId) => {
    try {
      // Call backend to delete message
      await axios.delete(`/api/messages/${messageId}`);
      // Remove message from local state
      setMessages(prev => prev.filter(msg => msg._id !== messageId));
      toast.success('Message deleted successfully');
    } catch (error) {
      toast.error('Failed to delete message');
    }
  };

  const handleStar = (messageId, isStarred) => {
    // Update message star status in local state
    // This will be handled by the context
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const isUserTyping = typingUsers.has(selectedUser._id);

  if (loading) {
    return (
      <Container>
        <Header>
          <Avatar color={getAvatarColor(selectedUser.username)}>
            {getInitials(selectedUser.username)}
            <OnlineIndicator $online={selectedUser.status === 'online'} />
          </Avatar>
          <UserInfo>
            <Username>{selectedUser.username}</Username>
            <Status>{selectedUser.status}</Status>
          </UserInfo>
        </Header>
        <LoadingMessage>Loading messages...</LoadingMessage>
      </Container>
    );
  }



  return (
    <Container>
      {(() => {
        try {
          console.log('DEBUG rendering header with selectedUser:', selectedUser);
          console.log('DEBUG selectedUser.username:', selectedUser?.username, typeof selectedUser?.username);
          return (
            <Header>
              <Avatar color={getAvatarColor(selectedUser.username)}>
                {getInitials(selectedUser.username)}
                <OnlineIndicator $online={selectedUser.status === 'online'} />
              </Avatar>
              <UserInfo>
                <Username>{selectedUser.username}</Username>
                <Status>{selectedUser.status}</Status>
              </UserInfo>
            </Header>
          );
        } catch (error) {
          console.error('DEBUG Error rendering header:', error);
          return <div>Error rendering header</div>;
        }
      })()}

      <MessagesContainer>

        {(() => {
          console.log('DEBUG messages array:', messages);
          console.log('DEBUG messages.length:', messages.length);
          return null;
        })()}
        {messages.length === 0 ? (
          <EmptyMessage>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>💬</div>
            <p>No messages yet</p>
            <p style={{ fontSize: '12px', marginTop: '8px' }}>
              Start the conversation by sending a message
            </p>
          </EmptyMessage>
        ) : (
          messages.map((message, index) => {
            console.log('DEBUG rendering message:', message);
            console.log('DEBUG message.content:', message.content, typeof message.content);
            console.log('DEBUG message.sender:', message.sender, typeof message.sender);
            console.log('DEBUG message.senderUsername:', message.senderUsername, typeof message.senderUsername);
            console.log('DEBUG message.replyTo:', message.replyTo, typeof message.replyTo);
            console.log('DEBUG message.createdAt:', message.createdAt, typeof message.createdAt);
            console.log('DEBUG message.isStarred:', message.isStarred, typeof message.isStarred);
            console.log('DEBUG message.isRead:', message.isRead, typeof message.isRead);
            
            // Robustly get senderId
            const senderId = typeof message.sender === 'object' && message.sender !== null
              ? message.sender._id
              : message.sender;
            const isOwn = String(senderId) === String(user._id);
            const showTime = index === 0 || 
              new Date(message.createdAt).getTime() - new Date(messages[index - 1].createdAt).getTime() > 300000; // 5 minutes

            return (
              <MessageGroup key={message._id}>
                {showTime && (
                  <div style={{ textAlign: 'center', margin: '8px 0' }}>
                    <span style={{ 
                      background: '#e9ecef', 
                      padding: '4px 12px', 
                      borderRadius: '12px', 
                      fontSize: '12px',
                      color: '#6c757d'
                    }}>
                      {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                )}
                {/* Show sender username above each message */}
                {(() => {
                  const senderDisplay = isOwn ? 'You' : (message.senderUsername || message.sender?.username || 'User');
                  console.log('DEBUG senderDisplay:', senderDisplay, typeof senderDisplay);
                  return (
                    <div style={{
                      fontSize: '12px',
                      color: '#6c757d',
                      marginBottom: '2px',
                      textAlign: isOwn ? 'right' : 'left',
                      padding: isOwn ? '0 0 0 32px' : '0 32px 0 0',
                      fontWeight: 500
                    }}>
                      {senderDisplay}
                    </div>
                  );
                })()}
                <Message
                  isOwn={isOwn}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <MessageBubble isOwn={isOwn}>
                    {message.replyTo && (
                      <ReplyContainer>
                        {(() => {
                          const replyContent = message.replyTo.content.substring(0, 30);
                          console.log('DEBUG replyContent:', replyContent, typeof replyContent);
                          return <div>Replying to: {replyContent}...</div>;
                        })()}
                      </ReplyContainer>
                    )}
                    {(() => {
                      console.log('DEBUG rendering message.content:', message.content, typeof message.content);
                      return message.content;
                    })()}
                    {message.isStarred && <StarIcon size={12} />}
                  </MessageBubble>
                  <div className="message-actions" style={{ 
                    opacity: 0, 
                    transition: 'opacity 0.2s', 
                    position: 'absolute', 
                    top: '-8px', 
                    right: isOwn ? '100%' : 'auto', 
                    left: isOwn ? 'auto' : '100%', 
                    zIndex: 10,
                    pointerEvents: 'auto'
                  }}>
                    <MessageActions
                      message={message}
                      isOwn={isOwn}
                      onReply={handleReply}
                      onForward={handleForward}
                      onDelete={handleDelete}
                      onStar={handleStar}
                    />
                  </div>
                </Message>
                <MessageTime isOwn={isOwn}>
                  {new Date(message.createdAt).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                  {isOwn && message.isRead && ' ✓'}
                </MessageTime>
              </MessageGroup>
            );
          })
        )}
        
        {isUserTyping && (
          <TypingIndicator>
            <div style={{ display: 'flex', gap: '2px' }}>
              <div style={{ 
                width: '6px', 
                height: '6px', 
                background: '#6c757d', 
                borderRadius: '50%',
                animation: 'typing 1.4s infinite ease-in-out'
              }} />
              <div style={{ 
                width: '6px', 
                height: '6px', 
                background: '#6c757d', 
                borderRadius: '50%',
                animation: 'typing 1.4s infinite ease-in-out 0.2s'
              }} />
              <div style={{ 
                width: '6px', 
                height: '6px', 
                background: '#6c757d', 
                borderRadius: '50%',
                animation: 'typing 1.4s infinite ease-in-out 0.4s'
              }} />
            </div>
            <span>{selectedUser.username} is typing...</span>
          </TypingIndicator>
        )}
        
        <div ref={messagesEndRef} />
      </MessagesContainer>

      <InputContainer>
        <InputWrapper>
          <EmojiButton>
            <FiSmile size={20} />
          </EmojiButton>
          {replyTo && (
            <ReplyContainer>
              <div>Replying to: {replyTo.content.substring(0, 50)}...</div>
              <button 
                onClick={() => setReplyTo(null)}
                style={{ background: 'none', border: 'none', color: '#667eea', cursor: 'pointer' }}
              >
                ✕
              </button>
            </ReplyContainer>
          )}
          <MessageInput
            ref={inputRef}
            value={newMessage}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder={replyTo ? "Type your reply..." : "Type a message..."}
            rows={1}
          />
          <SendButton
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FiSend size={16} />
          </SendButton>
        </InputWrapper>
      </InputContainer>

            {/* Forward Modal */}
      {forwardModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }} onClick={() => setForwardModalOpen(false)}>
          <div style={{
            background: 'white',
            borderRadius: 12,
            padding: 20,
            maxWidth: 400,
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto'
          }} onClick={(e) => e.stopPropagation()}>
            <h3>Forward Message</h3>
            <div style={{ maxHeight: 300, overflowY: 'auto', marginBottom: 16 }}>
              {(() => {
                if (!Array.isArray(users) || !user || !user._id) {
                  return <div style={{ color: '#dc3545', textAlign: 'center' }}>User data not loaded.</div>;
                }
                const forwardableUsers = users.filter(u => u && u._id && u._id !== user._id);
                if (forwardableUsers.length === 0) {
                  return <div style={{ color: '#6c757d', textAlign: 'center' }}>No users available to forward.</div>;
                }
                return (
                  <div>
                    {forwardableUsers.map(u => (
                      <div key={u._id} style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                        <span style={{ flex: 1 }}>{u.username}</span>
                        <button onClick={() => handleForwardToUser(u._id)} style={{ background: '#667eea', color: 'white', border: 'none', borderRadius: 6, padding: '4px 12px', cursor: 'pointer' }}>Forward</button>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
            <button onClick={() => setForwardModalOpen(false)} style={{ background: 'none', border: 'none', color: '#667eea', cursor: 'pointer', marginTop: 8 }}>Cancel</button>
          </div>
        </div>
      )}

      <style>
        {`
          @keyframes typing {
            0%, 60%, 100% {
              transform: translateY(0);
              opacity: 0.4;
            }
            30% {
              transform: translateY(-10px);
              opacity: 1;
            }
          }
        `}
      </style>
    </Container>
  );
};

export default ChatArea; 