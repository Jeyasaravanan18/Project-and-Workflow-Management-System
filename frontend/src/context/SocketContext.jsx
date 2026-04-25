import { createContext, useEffect, useState, useContext } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const { user } = useAuth();

    useEffect(() => {
        if (user) {
            // Use relative path for socket.io - Nginx will proxy this
            const newSocket = io();

            // Authenticate user when connected
            newSocket.on('connect', () => {
                console.log('Socket connected:', newSocket.id);
                newSocket.emit('user:authenticate', user._id);
            });

            setSocket(newSocket);

            // Handle page close/reload
            const handleBeforeUnload = () => {
                newSocket.emit('user:offline', user._id);
            };

            window.addEventListener('beforeunload', handleBeforeUnload);

            return () => {
                window.removeEventListener('beforeunload', handleBeforeUnload);
                newSocket.close();
            };
        } else {
            if (socket) {
                socket.close();
                setSocket(null);
            }
        }
    }, [user]);

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
};
