import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  LogOut,
  MessageCircle,
  User,
  Send,
  Circle,
  ArrowLeft,
  Plus,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { io } from "socket.io-client";

const SOCKET_URL =
  import.meta.env.VITE_API_URL?.replace("/api/v1", "") ||
  "http://localhost:3000";

export default function Dashboard() {
  const navigate = useNavigate();

  const [conversations, setConversations] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [search, setSearch] = useState("");
  const [text, setText] = useState("");
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  const storedUser = JSON.parse(localStorage.getItem("user")) || {};
  const currentUserId = String(storedUser._id || storedUser.id || "");

  /* -------------------- SOCKET CONNECTION -------------------- */
  useEffect(() => {
    if (!currentUserId) return;

    const socket = io(SOCKET_URL, {
      auth: { userId: currentUserId },
      withCredentials: true,
    });

    socketRef.current = socket;

    socket.on("onlineUsers", (users) => {
      setOnlineUsers(users.map(String));
    });

    socket.on("newMessage", (message) => {
      setMessages((prev) => {
        if (prev.some((m) => m._id === message._id)) return prev;
        return [...prev, message];
      });

      setConversations((prev) =>
        prev
          .map((c) =>
            c._id === message.conversation
              ? { ...c, lastMessage: message, updatedAt: message.createdAt }
              : c,
          )
          .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)),
      );
    });

    return () => socket.disconnect();
  }, [currentUserId]);

  /* -------------------- FETCH CONVERSATIONS -------------------- */
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setLoadingConversations(true);
        const response = await api.get("/conversation");
        setConversations(response.data.data);
      } catch (error) {
        console.error("Error fetching conversations:", error);
      } finally {
        setLoadingConversations(false);
      }
    };

    fetchConversations();
  }, []);

  /* -------------------- AUTO SCROLL -------------------- */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* -------------------- HELPERS -------------------- */
  const getOtherUser = (conversation) => {
    return conversation.participants.find(
      (p) => String(p._id) !== currentUserId,
    );
  };

  const filteredConversations = conversations.filter((c) => {
    const other = getOtherUser(c);
    return other?.name?.toLowerCase().includes(search.toLowerCase());
  });

  /* -------------------- OPEN CONVERSATION -------------------- */
  const openConversation = async (conversation) => {
    setSelectedChat(conversation);
    setMessages([]);
    setLoadingMessages(true);
    try {
      const response = await api.get(`/message/${conversation._id}`);
      setMessages(response.data.data);
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoadingMessages(false);
    }
  };

  /* -------------------- SEND MESSAGE -------------------- */
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() || !selectedChat) return;

    try {
      const response = await api.post("/message", {
        conversationId: selectedChat._id,
        text: text.trim(),
      });

      setMessages((prev) => [...prev, response.data.data]);

      setConversations((prev) =>
        prev
          .map((c) =>
            c._id === selectedChat._id
              ? {
                  ...c,
                  lastMessage: response.data.data,
                  updatedAt: response.data.data.createdAt,
                }
              : c,
          )
          .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)),
      );

      setText("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  /* -------------------- NEW CHAT -------------------- */
  const openNewChatModal = async () => {
    try {
      const response = await api.get("/user/all");
      setAllUsers(response.data.data);
      setShowNewChatModal(true);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const startConversation = async (receiverId) => {
    try {
      const response = await api.post("/conversation", { receiverId });
      const newConversation = response.data.data;

      setConversations((prev) => {
        const exists = prev.some((c) => c._id === newConversation._id);
        return exists ? prev : [newConversation, ...prev];
      });

      setShowNewChatModal(false);
      openConversation(newConversation);
    } catch (error) {
      console.error("Error creating conversation:", error);
    }
  };

  /* -------------------- LOGOUT -------------------- */
  const handleLogout = () => {
    socketRef.current?.disconnect();
    localStorage.removeItem("user");
    navigate("/login");
  };

  /* -------------------- RENDER -------------------- */
  return (
    <div className="h-screen w-full flex flex-col bg-background font-body overflow-hidden">
      {/* NAVBAR */}
      <div className="h-16 shrink-0 px-4 sm:px-6 flex items-center justify-between border-b border-border bg-surface">
        <div className="flex items-center gap-2">
          <div className="bg-brand p-1.5 rounded-lg">
            <MessageCircle
              className="w-4 h-4 text-text-onBrand"
              fill="currentColor"
              strokeWidth={0}
            />
          </div>
          <span className="text-lg font-heading font-bold text-text-primary">
            Convo
          </span>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          <div className="hidden sm:flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-brand-light flex items-center justify-center">
              <User className="w-4 h-4 text-brand" />
            </div>
            <span className="text-sm font-medium text-text-primary">
              {storedUser.name || "User"}
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-error transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>

      {/* MAIN */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* SIDEBAR */}
        <div
          className={`w-full sm:w-80 sm:shrink-0 bg-surface border-r border-border flex-col
          ${selectedChat ? "hidden sm:flex" : "flex"}`}
        >
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-heading font-semibold text-text-primary">
                Conversations
              </h2>
              <button
                onClick={openNewChatModal}
                className="flex items-center gap-1 text-xs font-medium text-brand hover:text-brand-dark transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                New Chat
              </button>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-background border border-border rounded-lg text-sm text-text-primary placeholder-text-secondary/70 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-all duration-200"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loadingConversations ? (
              <p className="text-center text-sm text-text-secondary mt-6">
                Loading...
              </p>
            ) : filteredConversations.length === 0 ? (
              <div className="text-center mt-10 px-6">
                <p className="text-sm text-text-secondary">
                  No conversations yet
                </p>
                <button
                  onClick={openNewChatModal}
                  className="text-sm text-brand font-medium hover:text-brand-dark mt-2"
                >
                  Start a new chat
                </button>
              </div>
            ) : (
              filteredConversations.map((conversation) => {
                const other = getOtherUser(conversation);
                if (!other) return null;
                const isOnline = onlineUsers.includes(String(other._id));

                return (
                  <button
                    key={conversation._id}
                    onClick={() => openConversation(conversation)}
                    className={`w-full flex items-center gap-3 px-4 py-3 border-b border-border text-left transition-colors duration-150 ${
                      selectedChat?._id === conversation._id
                        ? "bg-brand-light"
                        : "hover:bg-background"
                    }`}
                  >
                    <div className="relative shrink-0">
                      <div className="w-10 h-10 rounded-full bg-brand-light flex items-center justify-center">
                        <User className="w-5 h-5 text-brand" />
                      </div>
                      {isOnline && (
                        <Circle className="absolute bottom-0 right-0 w-3 h-3 fill-green-500 text-green-500" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-text-primary truncate">
                          {other.name}
                        </p>
                        {conversation.updatedAt && (
                          <span className="text-xs text-text-secondary shrink-0 ml-2">
                            {new Date(
                              conversation.updatedAt,
                            ).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-text-secondary truncate">
                        {conversation.lastMessage?.text ||
                          "Start a conversation"}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* CHAT AREA */}
        <div
          className={`flex-1 flex-col bg-background
          ${selectedChat ? "flex" : "hidden sm:flex"}`}
        >
          {!selectedChat ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-brand-light flex items-center justify-center mx-auto mb-3">
                  <MessageCircle className="w-8 h-8 text-brand" />
                </div>
                <p className="text-text-secondary">Select a conversation</p>
              </div>
            </div>
          ) : (
            <>
              {/* CHAT HEADER */}
              <div className="h-16 shrink-0 px-4 sm:px-5 flex items-center gap-3 border-b border-border bg-surface">
                <button
                  onClick={() => setSelectedChat(null)}
                  className="sm:hidden text-text-secondary hover:text-text-primary"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>

                {(() => {
                  const other = getOtherUser(selectedChat);
                  const isOnline = onlineUsers.includes(String(other?._id));
                  return (
                    <>
                      <div className="relative shrink-0">
                        <div className="w-10 h-10 rounded-full bg-brand-light flex items-center justify-center">
                          <User className="w-5 h-5 text-brand" />
                        </div>
                        {isOnline && (
                          <Circle className="absolute bottom-0 right-0 w-3 h-3 fill-green-500 text-green-500" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-text-primary truncate">
                          {other?.name}
                        </p>
                        <p className="text-xs text-text-secondary">
                          {isOnline ? "Online" : "Offline"}
                        </p>
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* MESSAGES */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
                {loadingMessages ? (
                  <p className="text-center text-sm text-text-secondary">
                    Loading messages...
                  </p>
                ) : messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-sm text-text-secondary">
                      No messages yet. Say hello 👋
                    </p>
                  </div>
                ) : (
                  messages.map((message) => {
                    const senderId = String(
                      message.sender?._id || message.sender,
                    );
                    const isMine = senderId === currentUserId;

                    return (
                      <div
                        key={message._id}
                        className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[75%] sm:max-w-xs px-4 py-2 rounded-2xl ${
                            isMine
                              ? "bg-brand text-text-onBrand rounded-br-sm"
                              : "bg-surface text-text-primary border border-border rounded-bl-sm"
                          }`}
                        >
                          <p className="text-sm break-words">{message.text}</p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* MESSAGE INPUT */}
              <form
                onSubmit={handleSendMessage}
                className="p-3 sm:p-4 border-t border-border bg-surface flex gap-2 sm:gap-3"
              >
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="flex-1 px-4 py-2 bg-background border border-border rounded-xl text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand transition-all duration-200"
                />
                <button
                  type="submit"
                  disabled={!text.trim()}
                  className="w-10 h-10 shrink-0 rounded-xl bg-brand text-text-onBrand flex items-center justify-center disabled:opacity-50 hover:bg-brand-dark transition-colors duration-200"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          )}
        </div>
      </div>

      {/* NEW CHAT MODAL */}
      <AnimatePresence>
        {showNewChatModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
            onClick={() => setShowNewChatModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-surface rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-sm max-h-[75vh] overflow-hidden flex flex-col"
            >
              <div className="p-4 border-b border-border flex items-center justify-between">
                <h3 className="font-heading font-semibold text-text-primary">
                  Start a new chat
                </h3>
                <button
                  onClick={() => setShowNewChatModal(false)}
                  className="text-text-secondary hover:text-text-primary"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto">
                {allUsers.length === 0 ? (
                  <p className="text-center text-sm text-text-secondary p-6">
                    No users found
                  </p>
                ) : (
                  allUsers.map((u) => (
                    <button
                      key={u._id}
                      onClick={() => startConversation(u._id)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-background transition-colors text-left"
                    >
                      <div className="w-9 h-9 rounded-full bg-brand-light flex items-center justify-center shrink-0">
                        <User className="w-4 h-4 text-brand" />
                      </div>
                      <p className="text-sm font-medium text-text-primary">
                        {u.name}
                      </p>
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
