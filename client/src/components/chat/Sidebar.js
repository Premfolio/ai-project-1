import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useChat } from '../../contexts/ChatContext';
import { FiSearch, FiLogOut, FiUser, FiMessageCircle } from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background: white;
`;

const Header = styled.div`
  padding: 20px;
  border-bottom: 1px solid #e1e5e9;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 15px;
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
  font-size: 16px;
`;

const UserDetails = styled.div`
  flex: 1;
`;

const Username = styled.h3`
  margin: 0;
  font-size: 16px;
  font-weight: 600;
`;

const Status = styled.span`
  font-size: 12px;
  opacity: 0.8;
`;

const LogoutButton = styled.button`
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.3);
  }
`;

const SearchContainer = styled.div`
  padding: 15px 20px;
  border-bottom: 1px solid #e1e5e9;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 10px 15px 10px 40px;
  border: 1px solid #e1e5e9;
  border-radius: 20px;
  font-size: 14px;
  background: #f8f9fa;

  &:focus {
    outline: none;
    border-color: #667eea;
    background: white;
  }

  &::placeholder {
    color: #6c757d;
  }
`;

const SearchIcon = styled.div`
  position: absolute;
  left: 15px;
  top: 50%;
  transform: translateY(-50%);
  color: #6c757d;
`;

const TabContainer = styled.div`
  display: flex;
  border-bottom: 1px solid #e1e5e9;
`;

const Tab = styled.button`
  flex: 1;
  padding: 15px;
  border: none;
  background: ${props => props.$active ? '#667eea' : 'transparent'};
  color: ${props => props.$active ? 'white' : '#6c757d'};
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;

  &:hover {
    background: ${props => props.$active ? '#667eea' : '#f8f9fa'};
  }
`;

const UserList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 10px 0;
`;

const UserItem = styled(motion.div)`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  border-left: 3px solid transparent;

  &:hover {
    background: #f8f9fa;
  }

  &.active {
    background: #e3f2fd;
    border-left-color: #667eea;
  }
`;

const UserAvatar = styled.div`
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
  background: ${props => props.$online ? '#4caf50' : '#9e9e9e'};
  border: 2px solid white;
`;

const UserInfoContainer = styled.div`
  flex: 1;
  min-width: 0;
`;

const UserName = styled.div`
  font-weight: 600;
  font-size: 14px;
  color: #333;
  margin-bottom: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const LastMessage = styled.div`
  font-size: 12px;
  color: #6c757d;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const MessageTime = styled.div`
  font-size: 11px;
  color: #9e9e9e;
  text-align: right;
`;

const UnreadBadge = styled.div`
  background: #667eea;
  color: white;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 600;
  margin-left: 8px;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: #6c757d;
  text-align: center;
`;

const Sidebar = ({ currentUser, onUserSelect, onLogout, searchTerm, onSearchChange }) => {
  const { users, conversations, selectedUser, fetchUsers } = useChat();
  const [activeTab, setActiveTab] = useState('conversations');

  useEffect(() => {
    if (searchTerm) {
      fetchUsers(searchTerm);
    } else {
      fetchUsers();
    }
  }, [searchTerm, fetchUsers]);

  const getInitials = (name) => {
    if (!name || typeof name !== 'string') {
      return '';
    }
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarColor = (name) => {
    if (!name || typeof name !== 'string') {
      return '#667eea';
    }
    const colors = ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe'];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const renderConversations = () => {
    if (!Array.isArray(conversations)) {
      return <EmptyState>Conversations data not loaded.</EmptyState>;
    }
    if (conversations.length === 0) {
      return (
        <EmptyState>
          <FiMessageCircle size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
          <p>No conversations yet</p>
          <p style={{ fontSize: '12px', marginTop: '8px' }}>
            Start chatting with other users
          </p>
        </EmptyState>
      );
    }

    return conversations.map((conv) => {
      if (!conv || !conv.lastMessage || !conv.lastMessage.sender || !conv.lastMessage.recipient) {
        return null;
      }
      const otherUser = conv.lastMessage.sender._id === currentUser._id 
        ? conv.lastMessage.recipient 
        : conv.lastMessage.sender;
      if (!otherUser || !otherUser._id) return null;
      return (
        <UserItem
          key={otherUser._id}
          className={selectedUser?._id === otherUser._id ? 'active' : ''}
          onClick={() => onUserSelect(otherUser)}
          whileHover={{ x: 5 }}
          transition={{ duration: 0.2 }}
        >
          <UserAvatar color={getAvatarColor(otherUser.username)}>
            {getInitials(otherUser.username)}
            <OnlineIndicator $online={otherUser.status === 'online'} />
          </UserAvatar>
          <UserInfoContainer>
            <UserName>{otherUser.username}</UserName>
            <LastMessage>
              {conv.lastMessage.content && conv.lastMessage.content.length > 30
                ? `${conv.lastMessage.content.substring(0, 30)}...`
                : conv.lastMessage.content || ''
              }
            </LastMessage>
          </UserInfoContainer>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <MessageTime>
              {conv.lastMessage.createdAt ? formatDistanceToNow(new Date(conv.lastMessage.createdAt), { addSuffix: true }) : ''}
            </MessageTime>
            {conv.unreadCount > 0 && (
              <UnreadBadge>{conv.unreadCount}</UnreadBadge>
            )}
          </div>
        </UserItem>
      );
    });
  };

  const renderUsers = () => {
    if (!Array.isArray(users)) {
      return <EmptyState>Users data not loaded.</EmptyState>;
    }
    if (users.length === 0) {
      return (
        <EmptyState>
          <FiUser size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
          <p>No users found</p>
          <p style={{ fontSize: '12px', marginTop: '8px' }}>
            Try adjusting your search
          </p>
        </EmptyState>
      );
    }
    return users.map((user) => {
      if (!user || !user._id) return null;
      return (
        <UserItem
          key={user._id}
          className={selectedUser?._id === user._id ? 'active' : ''}
          onClick={() => onUserSelect(user)}
          whileHover={{ x: 5 }}
          transition={{ duration: 0.2 }}
        >
          <UserAvatar color={getAvatarColor(user.username)}>
            {getInitials(user.username)}
            <OnlineIndicator $online={user.status === 'online'} />
          </UserAvatar>
          <UserInfoContainer>
            <UserName>{user.username}</UserName>
            <LastMessage>{user.status}</LastMessage>
          </UserInfoContainer>
        </UserItem>
      );
    });
  };

  return (
    <Container>
      <Header>
        <UserInfo>
          <Avatar color={getAvatarColor(currentUser.username)}>
            {getInitials(currentUser.username)}
          </Avatar>
          <UserDetails>
            <Username>{currentUser.username}</Username>
            <Status>{currentUser.status}</Status>
          </UserDetails>
          <LogoutButton onClick={onLogout}>
            <FiLogOut size={16} />
          </LogoutButton>
        </UserInfo>
      </Header>

      <SearchContainer>
        <div style={{ position: 'relative' }}>
          <SearchIcon>
            <FiSearch size={16} />
          </SearchIcon>
          <SearchInput
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </SearchContainer>

      <TabContainer>
        <Tab
          $active={activeTab === 'conversations'}
          onClick={() => setActiveTab('conversations')}
        >
          Conversations
        </Tab>
        <Tab
          $active={activeTab === 'users'}
          onClick={() => setActiveTab('users')}
        >
          All Users
        </Tab>
      </TabContainer>

      <UserList>
        {activeTab === 'conversations' ? renderConversations() : renderUsers()}
      </UserList>
    </Container>
  );
};

export default Sidebar; 