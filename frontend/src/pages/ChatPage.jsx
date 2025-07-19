import React, { useEffect, useState, useRef } from "react";
import { useSocket } from "../context/SocketProvider";
import useAuthUser from "../hooks/useAuthUser";
import { useThemeStore } from "../store/useThemeStore";
import { Send } from "lucide-react";
import { useParams } from "react-router";
import { axiosInstance } from "../lib/axios";
import { getFriendName } from "../lib/api"


const ChatPage = () => {
  const { id: friendId } = useParams();
  const [friendName, setFriendName] = useState("Loading...");

  const { authUser } = useAuthUser();
  const socket = useSocket();
  const theme = useThemeStore((state) => state.theme);
  

  const [messageText, setMessageText] = useState("");
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);

  // Get other user name for title
  // const otherUserId = getOtherUserId(CONVERSATION_ID, authUser?._id);
  // const otherUserName = MOCK_USERS[otherUserId] || "Friend";

// const CONVERSATION_ID = "pair-68412285a17a4c4bb32732dd-and-USER2_ID";
  const CONVERSATION_ID = authUser && friendId
    ? `pair-${[authUser._id, friendId].sort().join("-and-")}`
    : null;

  const otherUserName = friendId; // this will be replaced by actual data ideally

  useEffect(() => {
  const fetchFriendName = async () => {
    if (!friendId) return;
    try {
      const name = await getFriendName(friendId);
      setFriendName(name);
    } catch (error) {
      console.error("Failed to fetch friend's name:", error.message);
      setFriendName("Unknown");
    }
  };

  fetchFriendName();
}, [friendId]);

  const handleTranslate = async (messageId, textToTranslate) => {
    try {
      const response = await axiosInstance.post("/chat/translate", { text: textToTranslate });
      const { translatedText } = response.data;

      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg._id === messageId
            ? { ...msg, translatedText,showOriginal: false }
            : msg
        )
      );
    } catch (error) {
      console.error("error translating message:", error);
    }
  };
  const toggleShowOriginal = (messageId) => {
    setMessages((prevMessages) =>
      prevMessages.map((msg) =>
        msg._id === messageId
          ? { ...msg, showOriginal: !msg.showOriginal }
          : msg
      )
    );
  };
const getOtherUserId = (conversationId, currentUserId) => {
  const parts = conversationId.split("-and-");
  if (parts.length !== 2) return null;
  const [part1, user2Id] = parts;
  if (part1.includes(currentUserId)) {
    return user2Id;
  }
  return part1.replace("pair-", "");
};

  useEffect(() => {
    if (!socket || !authUser?._id) return;

    socket.emit("chat:join", { conversationId: CONVERSATION_ID });

    const handleReceiveMessage = ({ message }) => {
      setMessages((prev) => {
        const alreadyExists = prev.some(
          (m) => m._id === message._id 
        );
        if (alreadyExists) return prev;
        return [...prev, message];
      });
    };

    socket.on("chat:receive", handleReceiveMessage);

    return () => {
      socket.off("chat:receive", handleReceiveMessage);
    };
  }, [socket, authUser]);

  useEffect(() => {
    const container = messagesEndRef.current?.parentElement;
    if (!container) return;

    const isScrollable = container.scrollHeight > container.clientHeight;
    if (isScrollable) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!messageText.trim()) return;
    try {
      // save message to DB
      const res = await axiosInstance.post(`/chat/message`, {
        conversationId: CONVERSATION_ID,
        text: messageText.trim(),
        receiverId: friendId,
      });
      const savedMessage = res.data;
      console.log("Saved message:", savedMessage);
      // emit saved message via socket
      socket.emit("chat:send", {
        conversationId: CONVERSATION_ID,
        message: savedMessage,
      });
      setMessageText("");
      setMessages((prev) => [...prev, savedMessage]); // optimistic update
    } catch (err) {
      console.error("Error sending message:", err.message);
    }
  };


  
    const fetchMessages = async () => {
      if (!CONVERSATION_ID) return;
      try {
        const res = await axiosInstance.get(`/chat/${CONVERSATION_ID}`);
        setMessages(res.data.map(msg => ({ ...msg, id: msg._id }))); // ensure messages have an id for key and translation mapping
      } catch (err) {
        console.error("Failed to load messages:", err.message);
      }
    };

    useEffect(() => {
      fetchMessages();
    }, [CONVERSATION_ID]);

  return (
    <div
      className={`flex flex-col h-screen max-w-3xl mx-auto p-4
        ${
          theme === "coffee"
            ? "bg-coffee-light text-coffee-dark"
            : theme === "dark"
            ? "bg-gray-900 text-gray-100"
            : "bg-gray-100 text-gray-900"
        }
      `}
    >
      <header className="mb-4 border-b pb-2 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-wide">
          Chat with {friendName}
          {console.log(friendName)}
        </h1>
      </header>

      {/* CHAT AREA */}
      <main
        className="flex-1 overflow-y-auto px-4 py-3 rounded-lg shadow-inner
          scrollbar-thin scrollbar-thumb-rounded scrollbar-thumb-gray-400 scrollbar-track-transparent
          bg-white"
        style={{ marginBottom: "72px" }} // reserve space for fixed footer input
      >
        {messages.length === 0 && (
          <p className="text-center text-gray-400 mt-20 select-none">
            No messages yet. Start the conversation!
          </p>
        )}

        {messages.map((msg) => { // Changed idx to msg._id for key if available, otherwise use index
          const isSender = msg.senderId === authUser._id;
          return (
            <div
              key={msg._id || msg.id} // use a unique ID for the key
              className={`flex my-1 ${
                isSender ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`p-2 rounded-xl break-words max-w-[70%] shadow-md transition-colors duration-300
                  ${
                    isSender ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-900"
                  }
                `}
                style={{
                  wordWrap: "break-word",
                  whiteSpace: "pre-wrap",
                  fontSize: "1rem",
                  lineHeight: "1.3",
                  minWidth: "40px",
                }}
              >
              {msg.translatedText
                ? msg.showOriginal
                  ? msg.text
                  : msg.translatedText
                : msg.text
              }
              </div>
                {!isSender && (
                    <div className="text-xs mt-1 pt-1">
                      {!msg.translatedText ? (
                        <button
                          onClick={() => handleTranslate(msg._id || msg.id, msg.text)}
                          className="text-blue-500 hover:text-blue-700"
                        >
                          Translate
                        </button>
                      ) : (
                        <button
                          onClick={() => toggleShowOriginal(msg._id || msg.id)}
                          className="text-purple-500 hover:text-purple-700"
                        >
                          {msg.showOriginal ? "Show Translation" : "Show Original"}
                        </button>
                      )}
                    </div>
                  )}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </main>

      {/* INPUT AREA - fixed at bottom */}
      <footer
        className="fixed bottom-0 left-0 right-0 bg-white p-4 flex gap-3 items-center border-t border-gray-300 max-w-3xl mx-auto"
        style={{ boxShadow: "0 -2px 10px rgb(0 0 0 / 0.05)" }}
      >
        <input
          type="text"
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
          placeholder="Type a message..."
          className={`
            flex-1 rounded-full border border-gray-300 px-5 py-3
            focus:outline-none focus:ring-2 focus:ring-blue-400
            bg-white
            text-gray-900
            placeholder-gray-400
            transition
            text-lg
          `}
          autoComplete="off"
          style={{ fontSize: "1rem" }}
        />
        <button
          onClick={handleSendMessage}
          className="bg-blue-600 hover:bg-blue-700 transition text-white rounded-full px-5 py-3 flex items-center justify-center"
          aria-label="Send Message"
        >
          <Send size={24} />
        </button>
      </footer>
    </div>
  );
};

export default ChatPage;
