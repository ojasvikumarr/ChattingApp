import { Server } from "socket.io";
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

export const setupSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: CLIENT_URL, // frontend origin
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);
    socket.on("chat:join", ({ conversationId }) => {
      socket.join(conversationId);
      console.log(`joined conversation: ${conversationId}`);
    });

    // send a message inside a conversation
    socket.on("chat:send", async ({ conversationId, message }) => {
      // `conversationId` is the ID of the chat room, passed from the client.
      // `message` is the message object that was already saved to DB by the HTTP endpoint,
      // sent back to the client, and then relayed here.
      // It should contain all necessary fields like _id, senderId, receiverId, text, createdAt, etc.

      if (!conversationId) {
        console.error(
          "error with message broadcasting",
          { receivedMessage: message }
        );
        return;
      }
      // ensure the message object itself and its essential properties are present.
      if (!message || !message._id || !message.senderId || !message.text || !message.receiverId) {
        console.error(
          "error with message broadcasting",
          { conversationId, receivedMessage: message }
        );
        return;
      }

      try {
        // The message is already saved by the HTTP controller.
        // We just need to broadcast it to other clients in the room.
        io.to(conversationId).emit("chat:receive", {
          conversationId, // Or message.conversationId, they should be identical
          message,        // This is the fully formed message object from the database
        });

        console.log(
          ` message ID: ${message._id} broadcasted to conversation ${conversationId}`
        );
      } catch (err) {
        console.error(
          `error broadcasting message to ${conversationId}:`,
          err.message,
          { messageDetails: message }
        );
      }
    });

    socket.on("room:join", ({ email, room }) => {
      socket.join(room);
      console.log(`${email} joined room: ${room}`);

      // notify other users in the room (except self)
      socket.to(room).emit("user:joined", { email, id: socket.id });

      // notify the user who just joined about existing users
      const clientsInRoom = Array.from(io.sockets.adapter.rooms.get(room) || []);
      clientsInRoom.forEach((clientId) => {
        if (clientId !== socket.id) {
          socket.emit("user:joined", { email: "Someone", id: clientId });
        }
      });
    });

    socket.on("user:call", ({ to, offer }) => {
      console.log(`call offer from ${socket.id} ➡️ ${to}`);
      io.to(to).emit("incoming:call", { from: socket.id, offer });
    });

    socket.on("call:accepted", ({ to, ans }) => {
      console.log(`call accepted by ${socket.id} ➡️ ${to}`);
      io.to(to).emit("call:accepted", { from: socket.id, ans });
    });

    socket.on("ice-candidate", ({ to, candidate }) => {
      console.log(`ICE candidate from ${socket.id} to ${to}`);
      io.to(to).emit("ice-candidate", { candidate });
    });

    socket.on("peer:nego:needed", ({ to, offer }) => {
      console.log(`peer negotiation needed from ${socket.id} ➡️ ${to}`);
      io.to(to).emit("peer:nego:needed", { from: socket.id, offer });
    });

    socket.on("peer:nego:done", ({ to, ans }) => {
      console.log(`peer negotiation done by ${socket.id} ➡️ ${to}`);
      io.to(to).emit("peer:nego:final", { from: socket.id, ans });
    });

    socket.on("call:ended", ({ to }) => {
      console.log(`call ended by ${socket.id} ➡️ ${to}`);
      io.to(to).emit("call:ended");
    });

    socket.on("disconnect", () => {
      console.log("socket disconnected:", socket.id);
    });
  });
};
