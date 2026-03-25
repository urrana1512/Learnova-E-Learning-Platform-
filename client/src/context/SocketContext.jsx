import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const { user, token } = useAuth();
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);

  useEffect(() => {
    if (user && token) {
      const newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
        auth: { token }
      });

      setSocket(newSocket);

      newSocket.on('connect', () => {
        console.log('Socket connected');
      });

      newSocket.on('new_message', (message) => {
        // Global handler for new messages (e.g. show toast if not on chat page)
        if (window.location.pathname !== '/chat') {
          toast.success(`New message from ${message.sender.name}`, {
            icon: '💬',
            duration: 4000,
          });
        }
      });

      newSocket.on('new_notification', (notif) => {
        toast(notif.message, {
          icon: notif.type === 'FOLLOW' ? '👤' : '🔔',
          duration: 5000,
        });
      });

      return () => newSocket.close();
    }
  }, [user, token]);

  return (
    <SocketContext.Provider value={{ socket, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  );
};
