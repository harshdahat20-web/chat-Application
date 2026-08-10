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
  Trash2,
  Smile,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { io } from "socket.io-client";
import EmojiPicker from "emoji-picker-react";
import { useAuth } from "../context/AuthContext";

const SOCKET_URL =
  import.meta.env.VITE_API_URL?.replace("/api/v1", "") ||
  "http://localhost:3000";

const AVATAR_OPTIONS = [
  "https://api.dicebear.com/7.x/lorelei/svg?seed=Aiden",
  "https://api.dicebear.com/7.x/lorelei/svg?seed=Riya",
  "https://api.dicebear.com/7.x/lorelei/svg?seed=Kabir",
  "https://api.dicebear.com/7.x/lorelei/svg?seed=Meera",
  "https://api.dicebear.com/7.x/lorelei/svg?seed=Rohan",
  "https://api.dicebear.com/7.x/lorelei/svg?seed=Simran",
  "https://api.dicebear.com/7.x/lorelei/svg?seed=Vikram",
  "https://api.dicebear.com/7.x/lorelei/svg?seed=Ananya",
];

export default function Dashboard() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [messageText, setMessageText] = useState("");
  const [onlineUserIds, setOnlineUserIds] = useState([]);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editProfilePic, setEditProfilePic] = useState("");
  const [conversationToDelete, setConversationToDelete] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  const storedUser = JSON.parse(localStorage.getItem("user")) || {};
  const currentUserId = String(storedUser._id || storedUser.id || "");

  useEffect(() => {
    if (!currentUserId) return;

    const socket = io(SOCKET_URL, {
      auth: { userId: currentUserId },
      withCredentials: true,
    });

    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);
    });

    socket.on("connect_error", (err) => {
      console.error("Socket connection error:", err.message);
    });

    socketRef.current = socket;

    socket.on("onlineUsers", (userIds) => {
      setOnlineUserIds(userIds.map(String));
    });

    socket.on("newMessage", (newMessage) => {
      setMessages((prev) => {
        if (prev.some((m) => m._id === newMessage._id)) return prev;
        return [...prev, newMessage];
      });

      setConversations((prev) =>
        prev
          .map((c) =>
            c._id === newMessage.conversation
              ? {
                  ...c,
                  lastMessage: newMessage,
                  updatedAt: newMessage.createdAt,
                }
              : c,
          )
          .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)),
      );
    });

    return () => socket.disconnect();
  }, [currentUserId]);

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setIsLoadingConversations(true);
        const response = await api.get("/conversation");
        setConversations(response.data.data);
      } catch (error) {
        console.error("Error fetching conversations:", error);
      } finally {
        setIsLoadingConversations(false);
      }
    };

    fetchConversations();
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get("/user/profile");
        setProfileData(response.data.data);
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    };

    fetchProfile();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!showEmojiPicker) return;

    const handleClickOutside = (event) => {
      if (
        !event.target.closest(".EmojiPickerReact") &&
        !event.target.closest("[data-emoji-trigger]")
      ) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showEmojiPicker]);

  const renderAvatar = (profilePicUrl, sizeClass = "w-10 h-10") => {
    if (profilePicUrl) {
      return (
        <img
          src={profilePicUrl}
          alt="avatar"
          className={`${sizeClass} rounded-full bg-brand-light object-cover shrink-0`}
        />
      );
    }
    return (
      <div
        className={`${sizeClass} rounded-full bg-brand-light flex items-center justify-center shrink-0`}
      >
        <User className="w-1/2 h-1/2 text-brand" />
      </div>
    );
  };

  const getConversationPartner = (conversation) => {
    return conversation.participants.find(
      (participant) => String(participant._id) !== currentUserId,
    );
  };

  const filteredConversations = conversations.filter((conversation) => {
    const partner = getConversationPartner(conversation);
    return partner?.name?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const openConversation = async (conversation) => {
    setSelectedConversation(conversation);
    setMessages([]);
    setIsLoadingMessages(true);

    try {
      const response = await api.get(`/message/${conversation._id}`);
      setMessages(response.data.data);
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const handleSendMessage = async (event) => {
    event.preventDefault();
    if (!messageText.trim() || !selectedConversation) return;

    try {
      const response = await api.post("/message", {
        conversationId: selectedConversation._id,
        text: messageText.trim(),
      });

      const sentMessage = response.data.data;
      setMessages((prev) => [...prev, sentMessage]);

      setConversations((prev) =>
        prev
          .map((c) =>
            c._id === selectedConversation._id
              ? {
                  ...c,
                  lastMessage: sentMessage,
                  updatedAt: sentMessage.createdAt,
                }
              : c,
          )
          .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)),
      );

      setMessageText("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleEmojiClick = (emojiData) => {
    setMessageText((prev) => prev + emojiData.emoji);
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      await api.delete(`/message/${messageId}`);
      setMessages((prev) => prev.filter((m) => m._id !== messageId));
    } catch (error) {
      console.error("Error deleting message:", error);
    }
  };

  const promptDeleteConversation = (conversation, event) => {
    event.stopPropagation();
    setConversationToDelete(conversation);
  };

  const confirmDeleteConversation = async () => {
    if (!conversationToDelete) return;

    try {
      await api.delete(`/conversation/${conversationToDelete._id}`);
      setConversations((prev) =>
        prev.filter((c) => c._id !== conversationToDelete._id),
      );
      if (selectedConversation?._id === conversationToDelete._id) {
        setSelectedConversation(null);
        setMessages([]);
      }
    } catch (error) {
      console.error("Error deleting conversation:", error);
    } finally {
      setConversationToDelete(null);
    }
  };

  const openNewChatModal = async () => {
    try {
      const response = await api.get("/user/all");
      setAvailableUsers(response.data.data);
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

  const openProfileModal = async () => {
    try {
      const response = await api.get("/user/profile");
      setProfileData(response.data.data);
      setEditName(response.data.data.name || "");
      setEditBio(response.data.data.bio || "");
      setEditProfilePic(response.data.data.profilePic || AVATAR_OPTIONS[0]);
      setShowProfileModal(true);
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const handleSaveProfile = async () => {
    try {
      const response = await api.put("/user/profile", {
        name: editName.trim(),
        bio: editBio.trim(),
        profilePic: editProfilePic,
      });

      const updatedData = response.data.data;
      setProfileData(updatedData);
      setIsEditingProfile(false);

      const currentStoredUser = JSON.parse(localStorage.getItem("user")) || {};
      const mergedUser = { ...currentStoredUser, name: updatedData.name };
      localStorage.setItem("user", JSON.stringify(mergedUser));
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (error) {
      console.error("Error logging out from server:", error);
    }
    socketRef.current?.disconnect();
    logout();
    navigate("/login");
  };

  return (
    <div className="h-screen flex flex-col bg-background font-body">
      {/* ================= NAVBAR ================= */}
      <div className="h-16 shrink-0 px-4 sm:px-6 flex items-center justify-between border-b border-border bg-surface">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full bg-brand flex items-center justify-center">
            <MessageCircle
              className="w-5 h-5 text-text-onBrand"
              fill="currentColor"
              strokeWidth={0}
            />
          </div>
          <span className="text-lg font-heading font-bold text-brand hidden sm:inline">
            Convo
          </span>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          <button
            onClick={openProfileModal}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            {renderAvatar(profileData?.profilePic, "w-9 h-9")}
            <span className="text-sm font-medium text-text-primary hidden sm:inline">
              {storedUser.name || "User"}
            </span>
          </button>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-error border border-border rounded-full px-3 py-1.5 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* ================= SIDEBAR ================= */}
        <div
          className={`w-full sm:w-80 sm:shrink-0 bg-surface border-r border-border flex-col ${
            selectedConversation ? "hidden sm:flex" : "flex"
          }`}
        >
          <div className="p-4 space-y-3 border-b border-border">
            <button
              onClick={openNewChatModal}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-brand text-text-onBrand text-sm font-semibold hover:bg-brand-dark transition-colors duration-200"
            >
              <Plus className="w-4 h-4" />
              New Chat
            </button>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
              <input
                type="text"
                placeholder="Search chats..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-background border border-border rounded-xl text-sm text-text-primary placeholder-text-secondary/70 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-all duration-200"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {isLoadingConversations ? (
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
                const partner = getConversationPartner(conversation);
                if (!partner) return null;
                const isPartnerOnline = onlineUserIds.includes(
                  String(partner._id),
                );

                return (
                  <button
                    key={conversation._id}
                    onClick={() => openConversation(conversation)}
                    className={`group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors duration-150 ${
                      selectedConversation?._id === conversation._id
                        ? "bg-brand-light"
                        : "hover:bg-background"
                    }`}
                  >
                    <div className="relative shrink-0">
                      {renderAvatar(partner.profilePic, "w-11 h-11")}
                      {isPartnerOnline && (
                        <Circle className="absolute bottom-0 right-0 w-3 h-3 fill-success text-success ring-2 ring-surface rounded-full" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-text-primary truncate">
                          {partner.name}
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
                      <p className="text-xs text-text-secondary truncate mt-0.5">
                        {conversation.lastMessage?.text ||
                          "Start a conversation"}
                      </p>
                    </div>

                    <button
                      onClick={(e) => promptDeleteConversation(conversation, e)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-full hover:bg-error/10 text-text-secondary hover:text-error transition-all duration-150 shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ================= CHAT AREA ================= */}
        <div
          className={`flex-1 flex-col bg-background ${
            selectedConversation ? "flex" : "hidden sm:flex"
          }`}
        >
          {!selectedConversation ? (
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
              {/* Chat header */}
              <div className="h-16 shrink-0 px-4 sm:px-5 flex items-center gap-3 border-b border-border bg-surface">
                <button
                  onClick={() => setSelectedConversation(null)}
                  className="sm:hidden text-text-secondary hover:text-text-primary"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>

                {(() => {
                  const partner = getConversationPartner(selectedConversation);
                  const isPartnerOnline = onlineUserIds.includes(
                    String(partner?._id),
                  );

                  return (
                    <>
                      <div className="relative shrink-0">
                        {renderAvatar(partner?.profilePic, "w-10 h-10")}
                        {isPartnerOnline && (
                          <Circle className="absolute bottom-0 right-0 w-3 h-3 fill-success text-success ring-2 ring-surface rounded-full" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-text-primary truncate">
                          {partner?.name}
                        </p>
                        <p className="text-xs text-text-secondary">
                          {isPartnerOnline ? "Online" : "Offline"}
                        </p>
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-4 space-y-3">
                {isLoadingMessages ? (
                  <p className="text-center text-sm text-text-secondary">
                    Loading messages...
                  </p>
                ) : messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-sm text-text-secondary">
                      No messages yet
                    </p>
                  </div>
                ) : (
                  messages.map((chatMessage) => {
                    const senderId = String(
                      chatMessage.sender?._id || chatMessage.sender,
                    );
                    const isCurrentUserMessage = senderId === currentUserId;

                    return (
                      <div
                        key={chatMessage._id}
                        className={`group flex items-end gap-1.5 ${
                          isCurrentUserMessage ? "justify-end" : "justify-start"
                        }`}
                      >
                        {isCurrentUserMessage && (
                          <button
                            onClick={() => handleDeleteMessage(chatMessage._id)}
                            className="opacity-0 group-hover:opacity-100 p-1 rounded-full hover:bg-error/10 text-text-secondary hover:text-error transition-all duration-150 mb-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <div
                          className={`max-w-[75%] sm:max-w-xs px-4 py-2.5 rounded-2xl ${
                            isCurrentUserMessage
                              ? "bg-brand text-text-onBrand rounded-br-sm"
                              : "bg-surface text-text-primary border border-border rounded-bl-sm"
                          }`}
                        >
                          <p className="text-sm font-medium break-words">
                            {chatMessage.text}
                          </p>
                          <p
                            className={`text-[10px] mt-1 text-right ${
                              isCurrentUserMessage
                                ? "text-text-onBrand/70"
                                : "text-text-secondary"
                            }`}
                          >
                            {new Date(chatMessage.createdAt).toLocaleTimeString(
                              [],
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message input */}
              <form
                onSubmit={handleSendMessage}
                className="relative p-3 sm:p-4 border-t border-border bg-surface flex items-center gap-2 sm:gap-3"
              >
                {showEmojiPicker && (
                  <div className="absolute bottom-full right-4 sm:right-5 mb-2 z-20">
                    <EmojiPicker
                      onEmojiClick={handleEmojiClick}
                      height={350}
                      width={300}
                    />
                  </div>
                )}

                <button
                  type="button"
                  data-emoji-trigger
                  onClick={() => setShowEmojiPicker((prev) => !prev)}
                  className="w-9 h-9 shrink-0 rounded-full flex items-center justify-center text-text-secondary hover:text-brand hover:bg-brand-light transition-colors duration-200"
                >
                  <Smile className="w-5 h-5" />
                </button>

                <input
                  type="text"
                  placeholder="Type a message..."
                  value={messageText}
                  onChange={(event) => setMessageText(event.target.value)}
                  className="flex-1 px-4 py-2 bg-background border border-border rounded-full text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand transition-all duration-200"
                />

                <button
                  type="submit"
                  disabled={!messageText.trim()}
                  className="w-10 h-10 shrink-0 rounded-full bg-brand text-text-onBrand flex items-center justify-center disabled:opacity-50 hover:bg-brand-dark transition-colors duration-200"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          )}
        </div>
      </div>

      {/* ================= NEW CHAT MODAL ================= */}
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
              onClick={(event) => event.stopPropagation()}
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

              <div className="flex-1 overflow-y-auto py-2">
                {availableUsers.length === 0 ? (
                  <p className="text-center text-sm text-text-secondary p-6">
                    No users found
                  </p>
                ) : (
                  availableUsers.map((availableUser) => (
                    <button
                      key={availableUser._id}
                      onClick={() => startConversation(availableUser._id)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-background transition-colors text-left"
                    >
                      {renderAvatar(availableUser.profilePic, "w-10 h-10")}
                      <p className="text-sm font-medium text-text-primary">
                        {availableUser.name}
                      </p>
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ================= PROFILE MODAL ================= */}
      <AnimatePresence>
        {showProfileModal && profileData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
            onClick={() => {
              setShowProfileModal(false);
              setIsEditingProfile(false);
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              onClick={(event) => event.stopPropagation()}
              className="bg-surface rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-md overflow-hidden"
            >
              <div className="p-4 border-b border-border flex items-center justify-between">
                <h3 className="font-heading font-semibold text-text-primary">
                  My Profile
                </h3>
                <button
                  onClick={() => {
                    setShowProfileModal(false);
                    setIsEditingProfile(false);
                  }}
                  className="text-text-secondary hover:text-text-primary"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-8 flex flex-col items-center text-center">
                {!isEditingProfile &&
                  renderAvatar(profileData.profilePic, "w-32 h-32 mb-5")}

                {!isEditingProfile ? (
                  <>
                    <h2 className="text-xl font-heading font-semibold text-text-primary">
                      {profileData.name}
                    </h2>
                    <p className="text-sm text-text-secondary mt-0.5">
                      {profileData.email}
                    </p>

                    <div className="w-full mt-5 pt-5 border-t border-border text-left">
                      <p className="text-xs font-medium text-text-secondary mb-1.5">
                        Bio
                      </p>
                      <p className="text-sm text-text-primary">
                        {profileData.bio || "No bio added yet"}
                      </p>
                    </div>

                    <button
                      onClick={() => setIsEditingProfile(true)}
                      className="w-full mt-5 py-2.5 rounded-xl bg-brand-light text-brand text-sm font-medium hover:bg-brand hover:text-text-onBrand transition-colors duration-200"
                    >
                      Edit Profile
                    </button>
                  </>
                ) : (
                  <div className="w-full text-left space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-text-secondary mb-1.5">
                        Choose Avatar
                      </label>
                      <div className="grid grid-cols-4 gap-2">
                        {AVATAR_OPTIONS.map((avatarUrl) => (
                          <button
                            key={avatarUrl}
                            type="button"
                            onClick={() => setEditProfilePic(avatarUrl)}
                            className={`rounded-full overflow-hidden border-2 transition-colors ${
                              editProfilePic === avatarUrl
                                ? "border-brand"
                                : "border-transparent"
                            }`}
                          >
                            <img
                              src={avatarUrl}
                              alt="avatar option"
                              className="w-full h-full bg-brand-light"
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-text-secondary mb-1.5">
                        Name
                      </label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-all duration-200"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-text-secondary mb-1.5">
                        Bio
                      </label>
                      <textarea
                        value={editBio}
                        onChange={(e) => setEditBio(e.target.value)}
                        rows={3}
                        placeholder="Write something about yourself..."
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-text-primary placeholder-text-secondary/70 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-all duration-200 resize-none"
                      />
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => {
                          setIsEditingProfile(false);
                          setEditName(profileData.name || "");
                          setEditBio(profileData.bio || "");
                        }}
                        className="flex-1 py-2.5 rounded-xl border border-border text-text-secondary text-sm font-medium hover:bg-background transition-colors duration-200"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveProfile}
                        className="flex-1 py-2.5 rounded-xl bg-brand text-text-onBrand text-sm font-medium hover:bg-brand-dark transition-colors duration-200"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ================= DELETE CONFIRMATION MODAL ================= */}
      <AnimatePresence>
        {conversationToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
            onClick={() => setConversationToDelete(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              onClick={(event) => event.stopPropagation()}
              className="bg-surface rounded-2xl shadow-xl w-full max-w-xs overflow-hidden"
            >
              <div className="p-6 flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-full bg-error/10 flex items-center justify-center mb-4">
                  <Trash2 className="w-6 h-6 text-error" />
                </div>

                <h3 className="font-heading font-semibold text-text-primary mb-1.5">
                  Delete conversation?
                </h3>
                <p className="text-sm text-text-secondary">
                  Your chat with{" "}
                  <span className="font-medium text-text-primary">
                    {getConversationPartner(conversationToDelete)?.name}
                  </span>{" "}
                  will be permanently deleted. This cannot be undone.
                </p>

                <div className="flex gap-2 w-full mt-6">
                  <button
                    onClick={() => setConversationToDelete(null)}
                    className="flex-1 py-2.5 rounded-xl border border-border text-text-secondary text-sm font-medium hover:bg-background transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDeleteConversation}
                    className="flex-1 py-2.5 rounded-xl bg-error text-white text-sm font-medium hover:opacity-90 transition-opacity duration-200"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
