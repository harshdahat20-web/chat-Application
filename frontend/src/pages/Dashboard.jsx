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
import { useAuth } from "../context/AuthContext";

const SOCKET_URL =
  import.meta.env.VITE_API_URL?.replace("/api/v1", "") ||
  "http://localhost:3000";

const AVATAR_OPTIONS = [
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Aiden",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Riya",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Kabir",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Meera",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Rohan",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Simran",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Vikram",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Ananya",
  "https://mir-s3-cdn-cf.behance.net/projects/404/f74493100189765.Y3JvcCwyMjA2LDE3MjUsMCw5MDY.png",
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

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  const storedUser = JSON.parse(localStorage.getItem("user")) || {};

  const currentUserId = String(storedUser._id || storedUser.id || "");

  useEffect(() => {
    if (!currentUserId) return;

    const socket = io(SOCKET_URL, {
      auth: {
        userId: currentUserId,
      },
      withCredentials: true,
    });

    socketRef.current = socket;

    socket.on("onlineUsers", (userIds) => {
      setOnlineUserIds(userIds.map(String));
    });

    socket.on("newMessage", (newMessage) => {
      setMessages((previousMessages) => {
        const messageAlreadyExists = previousMessages.some(
          (existingMessage) => existingMessage._id === newMessage._id,
        );

        if (messageAlreadyExists) {
          return previousMessages;
        }

        return [...previousMessages, newMessage];
      });

      setConversations((previousConversations) =>
        previousConversations
          .map((conversation) =>
            conversation._id === newMessage.conversation
              ? {
                  ...conversation,
                  lastMessage: newMessage,
                  updatedAt: newMessage.createdAt,
                }
              : conversation,
          )
          .sort(
            (firstConversation, secondConversation) =>
              new Date(secondConversation.updatedAt) -
              new Date(firstConversation.updatedAt),
          ),
      );
    });

    return () => {
      socket.disconnect();
    };
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
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  const getConversationPartner = (conversation) => {
    return conversation.participants.find(
      (participant) => String(participant._id) !== currentUserId,
    );
  };

  const renderAvatar = (profilePicUrl, sizeClass = "w-10 h-10") => {
    if (profilePicUrl) {
      return (
        <img
          src={profilePicUrl}
          alt="avatar"
          className={`${sizeClass} rounded-full bg-brand-light object-cover`}
        />
      );
    }
    return (
      <div
        className={`${sizeClass} rounded-full bg-brand-light flex items-center justify-center`}
      >
        <User className="w-1/2 h-1/2 text-brand" />
      </div>
    );
  };

  const filteredConversations = conversations.filter((conversation) => {
    const conversationPartner = getConversationPartner(conversation);

    return conversationPartner?.name
      ?.toLowerCase()
      .includes(searchQuery.toLowerCase());
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

    if (!messageText.trim() || !selectedConversation) {
      return;
    }

    try {
      const response = await api.post("/message", {
        conversationId: selectedConversation._id,
        text: messageText.trim(),
      });

      const sentMessage = response.data.data;

      setMessages((previousMessages) => [...previousMessages, sentMessage]);

      setConversations((previousConversations) =>
        previousConversations
          .map((conversation) =>
            conversation._id === selectedConversation._id
              ? {
                  ...conversation,
                  lastMessage: sentMessage,
                  updatedAt: sentMessage.createdAt,
                }
              : conversation,
          )
          .sort(
            (firstConversation, secondConversation) =>
              new Date(secondConversation.updatedAt) -
              new Date(firstConversation.updatedAt),
          ),
      );

      setMessageText("");
    } catch (error) {
      console.error("Error sending message:", error);
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
      console.error("Error updating profile:", error.response?.data || error);
      alert(error.response?.data?.message || "Failed to update profile");
    }
  };
  const startConversation = async (receiverId) => {
    try {
      const response = await api.post("/conversation", {
        receiverId,
      });

      const newConversation = response.data.data;

      setConversations((previousConversations) => {
        const conversationAlreadyExists = previousConversations.some(
          (conversation) => conversation._id === newConversation._id,
        );

        return conversationAlreadyExists
          ? previousConversations
          : [newConversation, ...previousConversations];
      });

      setShowNewChatModal(false);

      openConversation(newConversation);
    } catch (error) {
      console.error("Error creating conversation:", error);
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
    <div className="h-screen flex flex-col bg-background">
      {/* Desktop-only top bar — mobile uses the greeting header inside the list panel instead */}
      <div className="hidden sm:flex h-16 shrink-0 px-6 items-center justify-between border-b border-border bg-surface">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-brand-light flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-brand" />
          </div>
          <span className="text-lg font-heading font-bold text-text-primary">
            Convo
          </span>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={openProfileModal}
            className="hidden sm:flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            {renderAvatar(profileData?.profilePic, "w-8 h-8")}
            <span className="text-sm font-medium text-text-primary">
              {storedUser.name || "User"}
            </span>
          </button>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-error transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        {/* ================= CONVERSATION LIST ================= */}
        <div
          className={`relative w-full sm:w-80 sm:shrink-0 bg-surface sm:border-r border-border flex-col ${
            selectedConversation ? "hidden sm:flex" : "flex"
          }`}
        >
          {/* Greeting header (mobile) */}
          <div className="px-5 pt-6 pb-4 sm:hidden flex items-center justify-between">
            <button onClick={openProfileModal} className="text-left">
              <p className="text-sm text-text-secondary">Hello,</p>
              <h1 className="text-2xl font-heading font-bold text-text-primary">
                {storedUser.name || "User"}
              </h1>
            </button>
            <button
              onClick={handleLogout}
              className="w-10 h-10 rounded-full bg-brand-light flex items-center justify-center shrink-0"
            >
              <LogOut className="w-4 h-4 text-brand" />
            </button>
          </div>

          {/* Section title (desktop) */}
          <div className="hidden sm:block px-4 pt-4">
            <h2 className="text-sm font-heading font-semibold text-text-primary">
              Conversations
            </h2>
          </div>

          {/* Search */}
          <div className="px-5 sm:px-4 pt-1 pb-3">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-full text-sm text-text-primary placeholder-text-secondary/70 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-all duration-200"
              />
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto px-2 pb-24 sm:pb-2">
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
                const conversationPartner =
                  getConversationPartner(conversation);

                if (!conversationPartner) {
                  return null;
                }

                const isPartnerOnline = onlineUserIds.includes(
                  String(conversationPartner._id),
                );

                return (
                  <button
                    key={conversation._id}
                    onClick={() => openConversation(conversation)}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-2xl transition-colors duration-150 ${
                      selectedConversation?._id === conversation._id
                        ? "bg-brand-light"
                        : "hover:bg-background"
                    }`}
                  >
                    <div className="relative shrink-0">
                      {renderAvatar(
                        conversationPartner.profilePic,
                        "w-12 h-12",
                      )}
                      {isPartnerOnline && (
                        <Circle className="absolute bottom-0 right-0 w-3.5 h-3.5 fill-green-500 text-green-500 ring-2 ring-surface rounded-full" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-text-primary truncate">
                          {conversationPartner.name}
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
                  </button>
                );
              })
            )}
          </div>

          {/* Floating "New Chat" action button */}
          <button
            onClick={openNewChatModal}
            className="absolute bottom-6 right-6 w-14 h-14 rounded-full bg-brand text-text-onBrand shadow-lg shadow-brand-light flex items-center justify-center hover:bg-brand-dark transition-colors duration-200"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>

        {/* ================= CHAT AREA ================= */}
        <div
          className={`flex-1 flex-col bg-background sm:p-4 ${
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
            <div className="flex flex-col h-full sm:rounded-3xl sm:overflow-hidden sm:shadow-xl">
              {/* Header + messages panel */}
              <div className="flex flex-col flex-1 bg-gradient-to-b from-brand to-brand-dark rounded-b-[2rem] sm:rounded-b-none overflow-hidden">
                {/* Chat header */}
                <div className="shrink-0 px-4 sm:px-5 pt-5 pb-4 flex items-center gap-3">
                  <button
                    onClick={() => setSelectedConversation(null)}
                    className="sm:hidden text-text-onBrand/90 hover:text-text-onBrand"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>

                  {(() => {
                    const conversationPartner =
                      getConversationPartner(selectedConversation);

                    const isPartnerOnline = onlineUserIds.includes(
                      String(conversationPartner?._id),
                    );

                    return (
                      <>
                        <div className="relative shrink-0">
                          {renderAvatar(
                            conversationPartner?.profilePic,
                            "w-11 h-11",
                          )}
                          {isPartnerOnline && (
                            <Circle className="absolute bottom-0 right-0 w-3 h-3 fill-green-400 text-green-400 ring-2 ring-brand rounded-full" />
                          )}
                        </div>

                        <div className="min-w-0">
                          <p className="font-medium text-text-onBrand truncate">
                            {conversationPartner?.name}
                          </p>
                          <p className="text-xs text-text-onBrand/70">
                            {isPartnerOnline ? "Online" : "Offline"}
                          </p>
                        </div>
                      </>
                    );
                  })()}
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-4 sm:px-5 pb-6 space-y-3">
                  {isLoadingMessages ? (
                    <p className="text-center text-sm text-text-onBrand/70">
                      Loading messages...
                    </p>
                  ) : messages.length === 0 ? (
                    <div className="h-full flex items-center justify-center">
                      <p className="text-sm text-text-onBrand/70">
                        No messages yet. Say hello 👋
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
                          className={`flex ${
                            isCurrentUserMessage
                              ? "justify-end"
                              : "justify-start"
                          }`}
                        >
                          <div
                            className={`max-w-[75%] sm:max-w-xs px-4 py-2.5 rounded-2xl ${
                              isCurrentUserMessage
                                ? "bg-surface text-text-primary shadow-sm rounded-br-sm"
                                : "bg-white/15 text-text-onBrand backdrop-blur-sm rounded-bl-sm"
                            }`}
                          >
                            <p className="text-sm break-words">
                              {chatMessage.text}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Floating message input */}
              <form
                onSubmit={handleSendMessage}
                className="shrink-0 px-4 sm:px-5 -mt-6 relative z-10"
              >
                <div className="flex items-center gap-2 bg-surface rounded-full shadow-lg px-2 py-2">
                  <input
                    type="text"
                    placeholder="Type a message..."
                    value={messageText}
                    onChange={(event) => setMessageText(event.target.value)}
                    className="flex-1 bg-transparent px-3 py-2 text-sm text-text-primary focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={!messageText.trim()}
                    className="w-10 h-10 shrink-0 rounded-full bg-brand text-text-onBrand flex items-center justify-center disabled:opacity-50 hover:bg-brand-dark transition-colors duration-200"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
                <div className="h-4 sm:h-0" />
              </form>
            </div>
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
                      <div className="w-10 h-10 rounded-full bg-brand-light flex items-center justify-center shrink-0">
                        <User className="w-5 h-5 text-brand" />
                      </div>
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
              className="bg-surface rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-sm overflow-hidden"
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

              <div className="p-6 flex flex-col items-center text-center">
                {!isEditingProfile &&
                  renderAvatar(profileData.profilePic, "w-20 h-20 mb-4")}

                {!isEditingProfile ? (
                  <>
                    <h2 className="text-lg font-heading font-semibold text-text-primary">
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
    </div>
  );
}
