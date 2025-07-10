# WhatsApp-like Chat Application

A real-time chat application built with Node.js, React, Express, and MongoDB, featuring real-time messaging, user authentication, and a modern UI.

## Features

- 🔐 **User Authentication** - Register and login with JWT tokens
- 💬 **Real-time Messaging** - Instant message delivery using Socket.io
- 👥 **User Management** - Search and chat with other users
- 📱 **Responsive Design** - Works on desktop and mobile devices
- 🎨 **Modern UI** - Beautiful, WhatsApp-inspired interface
- ⚡ **Typing Indicators** - See when someone is typing
- 📊 **Message Status** - Read receipts and message timestamps
- 🔍 **User Search** - Find users by username or email
- 📱 **Mobile Responsive** - Optimized for mobile devices

## Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Socket.io** - Real-time communication
- **JWT** - Authentication
- **bcryptjs** - Password hashing

### Frontend
- **React** - UI library
- **Socket.io-client** - Real-time client
- **Styled-components** - CSS-in-JS
- **Framer Motion** - Animations
- **React Router** - Navigation
- **Axios** - HTTP client

## Prerequisites

Before running this application, make sure you have the following installed:

- **Node.js** (v14 or higher)
- **MongoDB** (v4.4 or higher)
- **npm** or **yarn**

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd chat-app
   ```

2. **Install dependencies**
   ```bash
   # Install backend dependencies
   npm install

   # Install frontend dependencies
   cd client
   npm install
   cd ..
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/chat-app
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   NODE_ENV=development
   ```

4. **Start MongoDB**
   
   Make sure MongoDB is running on your system:
   ```bash
   # On Windows
   net start MongoDB

   # On macOS/Linux
   sudo systemctl start mongod
   ```

## Running the Application

### Development Mode

1. **Start the backend server**
   ```bash
   npm run server
   ```
   The server will start on `http://localhost:5000`

2. **Start the frontend application**
   ```bash
   npm run client
   ```
   The React app will start on `http://localhost:3000`

3. **Or run both simultaneously**
   ```bash
   npm run dev
   ```

### Production Mode

1. **Build the frontend**
   ```bash
   cd client
   npm run build
   cd ..
   ```

2. **Start the production server**
   ```bash
   npm start
   ```

## Testing the Application

### 1. Create Multiple User Accounts

1. Open the application in your browser at `http://localhost:3000`
2. Register multiple user accounts (e.g., "user1", "user2", "user3")
3. Use different email addresses for each user

### 2. Test Real-time Messaging

1. **Open multiple browser windows/tabs**
   - Log in as different users in each window
   - This simulates multiple users chatting simultaneously

2. **Start conversations**
   - In one window, select a user from the sidebar
   - Send messages and see them appear in real-time in the other user's window

3. **Test features**
   - **Typing indicators**: Start typing a message and see the indicator in the other window
   - **Message status**: Messages show read receipts (✓) when viewed
   - **Real-time updates**: Messages appear instantly without refreshing

### 3. Test User Search

1. Use the search bar in the sidebar to find users by username or email
2. Switch between "Conversations" and "All Users" tabs

### 4. Test Mobile Responsiveness

1. Open the application on a mobile device or use browser dev tools
2. Test the responsive design and mobile menu

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get current user profile

### Users
- `GET /api/users` - Get all users (with search)
- `GET /api/users/:userId` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `PUT /api/users/status` - Update user status

### Messages
- `POST /api/messages/send` - Send a message
- `GET /api/messages/conversation/:userId` - Get conversation
- `GET /api/messages/conversations` - Get all conversations
- `PUT /api/messages/read/:senderId` - Mark messages as read

## Socket Events

### Client to Server
- `user_login` - User connects to socket
- `private_message` - Send private message
- `typing` - Send typing indicator

### Server to Client
- `new_message` - Receive new message
- `message_sent` - Confirm message sent
- `user_status` - User status change
- `user_typing` - Typing indicator

## Project Structure

```
chat-app/
├── server/
│   ├── index.js          # Main server file
│   ├── models/           # MongoDB models
│   │   ├── User.js
│   │   └── Message.js
│   └── routes/           # API routes
│       ├── auth.js
│       ├── messages.js
│       └── users.js
├── client/
│   ├── public/           # Static files
│   ├── src/
│   │   ├── components/   # React components
│   │   │   ├── chat/     # Chat-specific components
│   │   │   ├── Login.js
│   │   │   ├── Register.js
│   │   │   └── Chat.js
│   │   ├── contexts/     # React contexts
│   │   │   ├── AuthContext.js
│   │   │   └── ChatContext.js
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
├── package.json
└── README.md
```

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Make sure MongoDB is running
   - Check if the connection string is correct in `.env`

2. **Port Already in Use**
   - Change the port in `.env` file
   - Kill processes using the port: `npx kill-port 5000 3000`

3. **Socket Connection Error**
   - Make sure the backend server is running
   - Check if the Socket.io URL is correct in `ChatContext.js`

4. **Build Errors**
   - Clear node_modules and reinstall: `rm -rf node_modules && npm install`
   - Clear npm cache: `npm cache clean --force`

### Performance Tips

1. **Database Indexing**: The application includes indexes for efficient message queries
2. **Rate Limiting**: API endpoints are rate-limited to prevent abuse
3. **Message Pagination**: Messages are loaded in chunks for better performance

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

If you encounter any issues or have questions, please open an issue on GitHub. 