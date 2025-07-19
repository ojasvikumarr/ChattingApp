import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { io } from "socket.io-client";
import useAuthUser from "../hooks/useAuthUser";

const SocketContext = createContext(null);

// Get the socket URL from environment variables with fallback
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5001";

export const useSocket = () => useContext(SocketContext);

let socketInstance = null;

export const joinConversation = (conversationId) => {
  socketInstance?.emit("chat:join", { conversationId });
};

export const sendMessage = (conversationId, message) => {
  socketInstance?.emit("chat:send", { conversationId, message });
};

export const listenForMessages = (callback) => {
  socketInstance?.on("chat:receive", callback);
};

export const stopListeningForMessages = () => {
  socketInstance?.off("chat:receive");
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { authUser } = useAuthUser();

  useEffect(() => {

    const newSocket = io(SOCKET_URL, {
      withCredentials: true,
    });

    setSocket(newSocket);
    socketInstance = newSocket;

    return () => {
      newSocket.disconnect();
      socketInstance = null;
    };
  }, []);

  useEffect(() => {
    if (socket && authUser?._id) {
      socket.emit("join", { userId: authUser._id });
      console.log("JOINED SOCKET ROOM:", authUser._id);
    }
  }, [socket, authUser]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};