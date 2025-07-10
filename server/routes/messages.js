const express = require('express');
const jwt = require('jsonwebtoken');
const Message = require('../models/Message');
const User = require('../models/User');
const router = express.Router();
const mongoose = require('mongoose');

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access token required'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: 'Invalid token'
    });
  }
};

// Send a message
router.post('/send', authenticateToken, async (req, res) => {
  try {
    const { recipientId, content, messageType = 'text' } = req.body;
    const senderId = req.userId;

    // Check if recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({
        success: false,
        message: 'Recipient not found'
      });
    }

    // Create new message
    const message = new Message({
      sender: senderId,
      recipient: recipientId,
      content,
      messageType
    });

    await message.save();

    // Populate sender info
    await message.populate('sender', 'username avatar');

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: message
    });

  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while sending message'
    });
  }
});

// Get conversation between two users
router.get('/conversation/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.userId;
    const { page = 1, limit = 50 } = req.query;

    // Check if the other user exists
    const otherUser = await User.findById(userId);
    if (!otherUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get messages between the two users (excluding deleted messages)
    const messages = await Message.find({
      $or: [
        { sender: currentUserId, recipient: userId },
        { sender: userId, recipient: currentUserId }
      ],
      isDeleted: { $ne: true }
    })
    .populate('sender', 'username avatar')
    .populate('recipient', 'username avatar')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .exec();

    // Mark messages as read
    await Message.updateMany(
      {
        sender: userId,
        recipient: currentUserId,
        isRead: false,
        isDeleted: { $ne: true }
      },
      {
        isRead: true,
        readAt: new Date()
      }
    );

    res.json({
      success: true,
      data: messages.reverse(),
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(messages.length / limit),
        totalMessages: messages.length
      }
    });

  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching conversation'
    });
  }
});

// Get recent conversations for current user
router.get('/conversations', authenticateToken, async (req, res) => {
  try {
    const currentUserId = req.userId;

    // Get the latest message from each conversation
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [
            { sender: currentUserId },
            { recipient: currentUserId }
          ]
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ['$sender', currentUserId] },
              '$recipient',
              '$sender'
            ]
          },
          lastMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$recipient', currentUserId] },
                    { $eq: ['$isRead', false] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $sort: { 'lastMessage.createdAt': -1 }
      }
    ]);

    // Populate user details for each conversation
    const populatedConversations = await Message.populate(conversations, [
      {
        path: 'lastMessage.sender',
        select: 'username avatar status lastSeen'
      },
      {
        path: 'lastMessage.recipient',
        select: 'username avatar status lastSeen'
      }
    ]);

    res.json({
      success: true,
      data: populatedConversations
    });

  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching conversations'
    });
  }
});

// Mark messages as read
router.put('/read/:senderId', authenticateToken, async (req, res) => {
  try {
    const { senderId } = req.params;
    const currentUserId = req.userId;

    await Message.updateMany(
      {
        sender: senderId,
        recipient: currentUserId,
        isRead: false
      },
      {
        isRead: true,
        readAt: new Date()
      }
    );

    res.json({
      success: true,
      message: 'Messages marked as read'
    });

  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while marking messages as read'
    });
  }
});

// Star/Unstar a message
router.put('/star/:messageId', authenticateToken, async (req, res) => {
  try {
    const { messageId } = req.params;
    const currentUserId = req.userId;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Check if user is sender or recipient
    if (message.sender.toString() !== currentUserId && message.recipient.toString() !== currentUserId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to star this message'
      });
    }

    message.isStarred = !message.isStarred;
    await message.save();

    res.json({
      success: true,
      message: message.isStarred ? 'Message starred' : 'Message unstarred',
      data: message
    });

  } catch (error) {
    console.error('Star message error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while starring message'
    });
  }
});

// Delete a message (soft delete)
router.delete('/:messageId', authenticateToken, async (req, res) => {
  try {
    const { messageId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      return res.status(400).json({ success: false, message: 'Invalid message ID' });
    }
    const currentUserId = req.userId;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Check if user is sender
    if (message.sender.toString() !== currentUserId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this message'
      });
    }

    message.isDeleted = true;
    message.deletedAt = new Date();
    await message.save();

    res.json({
      success: true,
      message: 'Message deleted successfully'
    });

  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting message'
    });
  }
});

// Forward a message
router.post('/forward/:messageId', authenticateToken, async (req, res) => {
  try {
    const { messageId } = req.params;
    const { recipientId } = req.body;
    const currentUserId = req.userId;

    const originalMessage = await Message.findById(messageId);
    if (!originalMessage) {
      return res.status(404).json({
        success: false,
        message: 'Original message not found'
      });
    }

    // Check if user is sender or recipient of original message
    if (originalMessage.sender.toString() !== currentUserId && originalMessage.recipient.toString() !== currentUserId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to forward this message'
      });
    }

    // Create forwarded message
    const forwardedMessage = new Message({
      sender: currentUserId,
      recipient: recipientId,
      content: originalMessage.content,
      messageType: originalMessage.messageType,
      forwardedFrom: originalMessage._id,
      forwardedBy: currentUserId
    });

    await forwardedMessage.save();
    await forwardedMessage.populate('sender', 'username avatar');

    res.status(201).json({
      success: true,
      message: 'Message forwarded successfully',
      data: forwardedMessage
    });

  } catch (error) {
    console.error('Forward message error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while forwarding message'
    });
  }
});

// Reply to a message
router.post('/reply/:messageId', authenticateToken, async (req, res) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;
    const currentUserId = req.userId;

    const originalMessage = await Message.findById(messageId);
    if (!originalMessage) {
      return res.status(404).json({
        success: false,
        message: 'Original message not found'
      });
    }

    // Determine recipient (the sender of the original message)
    const recipientId = originalMessage.sender.toString() === currentUserId 
      ? originalMessage.recipient 
      : originalMessage.sender;

    // Create reply message
    const replyMessage = new Message({
      sender: currentUserId,
      recipient: recipientId,
      content,
      messageType: 'text',
      replyTo: originalMessage._id
    });

    await replyMessage.save();
    await replyMessage.populate('sender', 'username avatar');
    await replyMessage.populate('replyTo', 'content sender');

    res.status(201).json({
      success: true,
      message: 'Reply sent successfully',
      data: replyMessage
    });

  } catch (error) {
    console.error('Reply message error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while sending reply'
    });
  }
});

// Get starred messages
router.get('/starred', authenticateToken, async (req, res) => {
  try {
    const currentUserId = req.userId;

    const starredMessages = await Message.find({
      $or: [
        { sender: currentUserId },
        { recipient: currentUserId }
      ],
      isStarred: true,
      isDeleted: false
    })
    .populate('sender', 'username avatar')
    .populate('recipient', 'username avatar')
    .populate('replyTo', 'content sender')
    .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: starredMessages
    });

  } catch (error) {
    console.error('Get starred messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching starred messages'
    });
  }
});

module.exports = router; 