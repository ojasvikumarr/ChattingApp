import React, {
  createContext,
  useMemo,
  useContext,
  useEffect,
  useState,
} from "react";
import { io } from "socket.io-client";
import useAuthUser from "../hooks/useAuthUser";

const SocketContext = createContext(null);

// Get the socket URL from environment variables with fallback
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5001";

export const useSocket = () => {
  const socket = useContext(SocketContext);
  return socket;
};

export const SocketProvider = (props) => {
  const [socket, setSocket] = useState(null);
  const { authUser } = useAuthUser();

  useEffect(() => {
    // ✅ Create socket when component mounts using env variable
    const newSocket = io(SOCKET_URL, {
      withCredentials: true,
    });
    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (socket && authUser?._id) {
      socket.emit("join", { userId: authUser._id });
      console.log("✅ JOINED SOCKET ROOM:", authUser._id);
    }
  }, [socket, authUser]);

  return (
    <SocketContext.Provider value={socket}>
      {props.children}
    </SocketContext.Provider>
  );
};