import { Server } from "socket.io";

export const setupSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "http://localhost:5173", // frontend origin
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    /* ==========================
       💬 CHAT EVENTS (NEW)
    ===========================*/

    // Join a conversation room (1-1)
    socket.on("chat:join", ({ conversationId }) => {
      socket.join(conversationId);
      console.log(`📥 Joined conversation: ${conversationId}`);
    });

    // Send a message inside a conversation
    socket.on("chat:send", ({ conversationId, message }) => {
      // message = { senderId, text }
      io.to(conversationId).emit("chat:receive", {
        conversationId,
        message,
      });
      console.log(`💬 Message sent to ${conversationId}`);
    });

    /* ==========================
       📞 VIDEO CALL EVENTS (UNCHANGED)
    ===========================*/

    socket.on("room:join", ({ email, room }) => {
      socket.join(room);
      console.log(`${email} joined room: ${room}`);

      // Notify other users in the room (except self)
      socket.to(room).emit("user:joined", { email, id: socket.id });

      // Notify the user who just joined about existing users
      const clientsInRoom = Array.from(io.sockets.adapter.rooms.get(room) || []);
      clientsInRoom.forEach((clientId) => {
        if (clientId !== socket.id) {
          socket.emit("user:joined", { email: "Someone", id: clientId });
        }
      });
    });

    socket.on("user:call", ({ to, offer }) => {
      console.log(`📞 Call offer from ${socket.id} ➡️ ${to}`);
      io.to(to).emit("incoming:call", { from: socket.id, offer });
    });

    socket.on("call:accepted", ({ to, ans }) => {
      console.log(`✅ Call accepted by ${socket.id} ➡️ ${to}`);
      io.to(to).emit("call:accepted", { from: socket.id, ans });
    });

    socket.on("ice-candidate", ({ to, candidate }) => {
      console.log(`ICE candidate from ${socket.id} to ${to}`);
      io.to(to).emit("ice-candidate", { candidate });
    });

    socket.on("peer:nego:needed", ({ to, offer }) => {
      console.log(`🔁 Peer negotiation needed from ${socket.id} ➡️ ${to}`);
      io.to(to).emit("peer:nego:needed", { from: socket.id, offer });
    });

    socket.on("peer:nego:done", ({ to, ans }) => {
      console.log(`✅ Peer negotiation done by ${socket.id} ➡️ ${to}`);
      io.to(to).emit("peer:nego:final", { from: socket.id, ans });
    });

    socket.on("call:ended", ({ to }) => {
      console.log(`❌ Call ended by ${socket.id} ➡️ ${to}`);
      io.to(to).emit("call:ended");
    });

    socket.on("disconnect", () => {
      console.log("❌ Socket disconnected:", socket.id);
    });
  });
};
