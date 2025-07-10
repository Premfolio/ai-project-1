import React, { useState } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCornerUpLeft, FiShare, FiStar, FiTrash2, FiMoreVertical } from 'react-icons/fi';
import axios from 'axios';
import toast from 'react-hot-toast';

const ActionsContainer = styled.div`
  position: relative;
`;

const ActionsButton = styled.button`
  background: rgba(255, 255, 255, 0.95);
  border: none;
  color: #6c757d;
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  opacity: 1;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  min-width: 32px;
  min-height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: white;
    color: #333;
    transform: scale(1.1);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }
`;

const ActionsMenu = styled(motion.div)`
  position: absolute;
  top: -10px;
  ${props => props.isOwn ? 'right: 0;' : 'left: 0;'}
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  padding: 8px 0;
  min-width: 150px;
  z-index: 1000;
  border: 1px solid #e1e5e9;
  backdrop-filter: blur(10px);
`;

const ActionItem = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 16px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 14px;
  color: #333;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: #f8f9fa;
  }

  &.danger {
    color: #dc3545;
  }

  &.starred {
    color: #ffc107;
  }
`;

// Utility to check for valid ObjectId
function isValidObjectId(id) {
  return typeof id === 'string' && id.length === 24 && /^[a-fA-F0-9]+$/.test(id);
}

const MessageActions = ({ message, isOwn, onReply, onForward, onDelete, onStar, onUpdate }) => {
  const [showMenu, setShowMenu] = useState(false);

  const handleStar = async () => {
    try {
      const response = await axios.put(`/api/messages/star/${message._id}`);
      onStar(message._id, response.data.data.isStarred);
      toast.success(response.data.message);
      setShowMenu(false);
    } catch (error) {
      toast.error('Failed to star message');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this message?')) {
      return;
    }

    try {
      const response = await axios.delete(`/api/messages/${message._id}`);
      if (response.data.success) {
        onDelete(message._id);
        toast.success('Message deleted successfully');
      } else {
        toast.error(response.data.message || 'Failed to delete message');
      }
      setShowMenu(false);
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(error.response?.data?.message || 'Failed to delete message');
    }
  };

  const handleReply = () => {
    onReply(message);
    setShowMenu(false);
  };

  const handleForward = () => {
    onForward(message);
    setShowMenu(false);
  };

  return (
    <ActionsContainer>
      <ActionsButton
        onClick={() => setShowMenu(!showMenu)}
        onMouseEnter={() => setShowMenu(true)}
        title="Message actions"
      >
        <FiMoreVertical size={16} />
      </ActionsButton>

      <AnimatePresence>
        {showMenu && (
          <ActionsMenu
            isOwn={isOwn}
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.2 }}
            onMouseLeave={() => setShowMenu(false)}
          >
            <ActionItem onClick={handleReply}>
              <FiCornerUpLeft size={16} />
              Reply
            </ActionItem>
            
            <ActionItem onClick={handleForward}>
              <FiShare size={16} />
              Forward
            </ActionItem>
            
            <ActionItem 
              onClick={handleStar}
              className={message.isStarred ? 'starred' : ''}
            >
              <FiStar size={16} />
              {message.isStarred ? 'Unstar' : 'Star'}
            </ActionItem>
            
            {isOwn && isValidObjectId(message._id) && (
              <ActionItem onClick={handleDelete} className="danger">
                <FiTrash2 size={16} />
                Delete
              </ActionItem>
            )}
          </ActionsMenu>
        )}
      </AnimatePresence>
    </ActionsContainer>
  );
};

export default MessageActions; 