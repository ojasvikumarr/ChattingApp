// frontend/src/components/SocketEvents.jsx
import { useEffect } from "react";
import { useNavigate } from "react-router";
import { useSocket } from "../context/SocketProvider";

const SocketEvents = () => {
  const socket = useSocket();
  const navigate = useNavigate();
useEffect(() => {
  if (!socket) return;

  const handleIncomingCall = ({ roomId }) => {
    console.log("📞 Incoming call! Navigating to:", roomId);
    navigate(`/video/room/${roomId}`);
  };

  socket.on("incoming-call", handleIncomingCall);

  return () => {
    socket.off("incoming-call", handleIncomingCall);
  };
}, [socket, navigate]); 

  return null; // this component doesn't render anything
};

export default SocketEvents;
