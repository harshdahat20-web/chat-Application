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
  MoreVertical,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { io } from "socket.io-client";
import EmojiPicker from "emoji-picker-react";
import { useAuth } from "../context/AuthContext";

// Base URL for the Socket.io connection, derived from the REST API URL.
const SOCKET_URL =
  import.meta.env.VITE_API_URL?.replace("/api/v1", "") ||
  "http://localhost:3000";

// Preset avatar choices shown in the profile editor.
const AVATAR_OPTIONS = [
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Aiden&top=shortHairShortFlat&backgroundColor=116857",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Kabir&top=shortHairTheCaesar&backgroundColor=3B82F6",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Rohan&top=shortHairShortCurly&backgroundColor=F97316",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Vikram&top=shortHairShortWaved&backgroundColor=A855F7",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Riya&top=longHairStraight&backgroundColor=EC4899",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Meera&top=longHairCurly&backgroundColor=F59E0B",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Simran&top=longHairBun&backgroundColor=10B981",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Ananya&top=longHairStraight2&backgroundColor=EF4444",
];
export default function Dashboard() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  // ---------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------
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

  // ---------------------------------------------------------------------
  // Data fetching helpers
  // ---------------------------------------------------------------------

  /** Fetches the latest conversation list from the server. */
  const refreshConversations = async () => {
    try {
      const response = await api.get("/conversation");
      setConversations(response.data.data);
    } catch (error) {
      console.error("Failed to refresh conversations:", error);
    }
  };

  // ---------------------------------------------------------------------
  // Socket.io connection lifecycle
  // ---------------------------------------------------------------------
  useEffect(() => {
    if (!currentUserId) return;

    const socket = io(SOCKET_URL, {
      auth: { userId: currentUserId },
      withCredentials: true,
    });

    socketRef.current = socket;

    // Server broadcasts the list of currently connected user IDs.
    socket.on("onlineUsers", (userIds) => {
      setOnlineUserIds(userIds.map(String));
    });

    // Server pushes a new message in real time.
    socket.on("newMessage", (incomingMessage) => {
      // Append to the open conversation's message thread, if applicable.
      setMessages((previousMessages) => {
        const isDuplicate = previousMessages.some(
          (existingMessage) => existingMessage._id === incomingMessage._id,
        );
        return isDuplicate
          ? previousMessages
          : [...previousMessages, incomingMessage];
      });

      // Update the conversation list preview and ordering.
      setConversations((previousConversations) => {
        const conversationExists = previousConversations.some(
          (conversation) => conversation._id === incomingMessage.conversation,
        );

        if (conversationExists) {
          return previousConversations
            .map((conversation) =>
              conversation._id === incomingMessage.conversation
                ? {
                    ...conversation,
                    lastMessage: incomingMessage,
                    updatedAt: incomingMessage.createdAt,
                  }
                : conversation,
            )
            .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        }

        // First message of a brand-new conversation — refetch the list
        // so it appears without requiring a manual page refresh.
        refreshConversations();
        return previousConversations;
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [currentUserId]);

  // ---------------------------------------------------------------------
  // Initial data loading
  // ---------------------------------------------------------------------
  useEffect(() => {
    const loadConversations = async () => {
      setIsLoadingConversations(true);
      await refreshConversations();
      setIsLoadingConversations(false);
    };

    loadConversations();
  }, []);

  useEffect(() => {
    const loadCurrentUserProfile = async () => {
      try {
        const response = await api.get("/user/profile");
        setProfileData(response.data.data);
      } catch (error) {
        console.error("Failed to load profile:", error);
      }
    };

    loadCurrentUserProfile();
  }, []);

  // Keep the message thread scrolled to the latest message.
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Close the emoji picker when the user clicks outside of it.
  useEffect(() => {
    if (!showEmojiPicker) return;

    const handleClickOutside = (event) => {
      const clickedInsidePicker = event.target.closest(".EmojiPickerReact");
      const clickedTrigger = event.target.closest("[data-emoji-trigger]");

      if (!clickedInsidePicker && !clickedTrigger) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showEmojiPicker]);

  // ---------------------------------------------------------------------
  // Presentation helpers
  // ---------------------------------------------------------------------

  /** Renders a user's avatar image, falling back to a generic icon. */
  const renderAvatar = (avatarUrl, sizeClassName = "w-10 h-10") => {
    if (avatarUrl) {
      return (
        <img
          src={avatarUrl}
          alt="User avatar"
          className={`${sizeClassName} rounded-full bg-brand-light object-cover shrink-0`}
        />
      );
    }

    return (
      <div
        className={`${sizeClassName} rounded-full bg-brand-light flex items-center justify-center shrink-0`}
      >
        <User className="w-1/2 h-1/2 text-brand" />
      </div>
    );
  };

  /** Returns the other participant in a 1-on-1 conversation. */
  const getConversationPartner = (conversation) => {
    return conversation.participants.find(
      (participant) => String(participant._id) !== currentUserId,
    );
  };

  const filteredConversations = conversations.filter((conversation) => {
    const partner = getConversationPartner(conversation);
    return partner?.name?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // ---------------------------------------------------------------------
  // Conversation and message actions
  // ---------------------------------------------------------------------

  const openConversation = async (conversation) => {
    setSelectedConversation(conversation);
    setMessages([]);
    setIsLoadingMessages(true);

    try {
      const response = await api.get(`/message/${conversation._id}`);
      setMessages(response.data.data);
    } catch (error) {
      console.error("Failed to load messages:", error);
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
          .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)),
      );

      setMessageText("");
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const handleEmojiSelect = (emojiData) => {
    setMessageText((previousText) => previousText + emojiData.emoji);
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      await api.delete(`/message/${messageId}`);
      setMessages((previousMessages) =>
        previousMessages.filter((message) => message._id !== messageId),
      );
    } catch (error) {
      console.error("Failed to delete message:", error);
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

      setConversations((previousConversations) =>
        previousConversations.filter(
          (conversation) => conversation._id !== conversationToDelete._id,
        ),
      );

      if (selectedConversation?._id === conversationToDelete._id) {
        setSelectedConversation(null);
        setMessages([]);
      }
    } catch (error) {
      console.error("Failed to delete conversation:", error);
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
      console.error("Failed to load contacts:", error);
    }
  };

  const startConversation = async (receiverId) => {
    try {
      const response = await api.post("/conversation", { receiverId });
      const newConversation = response.data.data;

      setConversations((previousConversations) => {
        const alreadyExists = previousConversations.some(
          (conversation) => conversation._id === newConversation._id,
        );
        return alreadyExists
          ? previousConversations
          : [newConversation, ...previousConversations];
      });

      setShowNewChatModal(false);
      openConversation(newConversation);
    } catch (error) {
      console.error("Failed to start conversation:", error);
    }
  };

  // ---------------------------------------------------------------------
  // Profile actions
  // ---------------------------------------------------------------------

  const openProfileModal = async () => {
    try {
      const response = await api.get("/user/profile");
      const currentProfile = response.data.data;

      setProfileData(currentProfile);
      setEditName(currentProfile.name || "");
      setEditBio(currentProfile.bio || "");
      setEditProfilePic(currentProfile.profilePic || AVATAR_OPTIONS[0]);
      setShowProfileModal(true);
    } catch (error) {
      console.error("Failed to load profile:", error);
    }
  };

  const handleSaveProfile = async () => {
    try {
      const response = await api.put("/user/profile", {
        name: editName.trim(),
        bio: editBio.trim(),
        profilePic: editProfilePic,
      });

      const updatedProfile = response.data.data;
      setProfileData(updatedProfile);
      setIsEditingProfile(false);

      // Keep the cached user record (used for the display name) in sync.
      const cachedUser = JSON.parse(localStorage.getItem("user")) || {};
      const mergedUser = { ...cachedUser, name: updatedProfile.name };
      localStorage.setItem("user", JSON.stringify(mergedUser));
    } catch (error) {
      console.error("Failed to update profile:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (error) {
      console.error("Failed to log out on the server:", error);
    }

    socketRef.current?.disconnect();
    logout();
    navigate("/login");
  };

  // ---------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------
  return (
    <div className="h-dvh flex flex-col bg-background font-body overflow-hidden">
      {/* ===================== Top navigation bar ===================== */}
      <header className="h-16 shrink-0 px-4 sm:px-6 flex items-center justify-between border-b border-border bg-brand">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center">
            <MessageCircle
              className="w-5 h-5 text-text-onBrand"
              fill="currentColor"
              strokeWidth={0}
            />
          </div>
          <span className="text-lg font-heading font-bold text-text-onBrand hidden sm:inline">
            Convo
          </span>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          <button
            onClick={openProfileModal}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            {renderAvatar(profileData?.profilePic, "w-9 h-9")}
            <span className="text-sm font-medium text-text-onBrand hidden sm:inline">
              {storedUser.name || "User"}
            </span>
          </button>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-sm text-text-onBrand/90 hover:text-text-onBrand border border-white/25 rounded-full px-3 py-1.5 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* ===================== Conversation list ===================== */}
        <aside
          className={`w-full sm:w-80 sm:shrink-0 bg-surface border-r border-border flex-col ${
            selectedConversation ? "hidden sm:flex" : "flex"
          }`}
        >
          <div className="p-4 space-y-3 border-b border-border shrink-0">
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

          <div className="flex-1 overflow-y-auto p-2">
            {isLoadingConversations ? (
              <p className="text-center text-sm text-text-secondary mt-6">
                Loading conversations...
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
                    className={`group w-full flex items-center gap-3 px-2 py-2.5 rounded-xl transition-colors duration-150 ${
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
                      onClick={(event) =>
                        promptDeleteConversation(conversation, event)
                      }
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-full hover:bg-error/10 text-text-secondary hover:text-error transition-all duration-150 shrink-0"
                      aria-label="Delete conversation"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* ===================== Active chat panel ===================== */}
        <main
          className={`flex-1 flex-col bg-background min-h-0 ${
            selectedConversation ? "flex" : "hidden sm:flex"
          }`}
        >
          {!selectedConversation ? (
            // Empty state shown before any conversation is selected.
            <div
              className="flex-1 flex items-center justify-center"
              style={{
                backgroundImage:
                  "radial-gradient(var(--tw-color-border) 1px, transparent 1px)",
                backgroundSize: "24px 24px",
              }}
            >
              <div className="text-center bg-surface/80 backdrop-blur-sm rounded-2xl px-10 py-8">
                <div className="w-16 h-16 rounded-full bg-brand-light flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="w-8 h-8 text-brand" />
                </div>
                <h2 className="font-heading font-bold text-text-primary text-lg">
                  Welcome to Convo
                </h2>
                <p className="text-sm text-text-secondary mt-1">
                  Select a conversation from the left
                  <br />
                  or start a new one.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div className="h-16 shrink-0 px-4 sm:px-5 flex items-center gap-3 border-b border-border bg-surface">
                <button
                  onClick={() => setSelectedConversation(null)}
                  className="sm:hidden text-text-secondary hover:text-text-primary"
                  aria-label="Back to conversation list"
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
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-text-primary truncate">
                          {partner?.name}
                        </p>
                        <p className="text-xs text-text-secondary">
                          {isPartnerOnline ? "Online" : "Offline"}
                        </p>
                      </div>
                      <MoreVertical className="w-5 h-5 text-text-secondary shrink-0" />
                    </>
                  );
                })()}
              </div>

              {/* Message thread */}
              <div className="flex-1 overflow-y-auto min-h-0 px-4 sm:px-5 py-4 space-y-3">
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
                  messages.map((message) => {
                    const senderId = String(
                      message.sender?._id || message.sender,
                    );
                    const isOwnMessage = senderId === currentUserId;

                    return (
                      <div
                        key={message._id}
                        className={`group flex items-end gap-1.5 ${
                          isOwnMessage ? "justify-end" : "justify-start"
                        }`}
                      >
                        {isOwnMessage && (
                          <button
                            onClick={() => handleDeleteMessage(message._id)}
                            className="opacity-0 group-hover:opacity-100 p-1 rounded-full hover:bg-error/10 text-text-secondary hover:text-error transition-all duration-150 mb-1"
                            aria-label="Delete message"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <div
                          className={`max-w-[75%] sm:max-w-xs px-4 py-2.5 ${
                            isOwnMessage
                              ? "bg-brand text-text-onBrand rounded-2xl rounded-br-md"
                              : "bg-surface text-text-primary border border-border rounded-2xl rounded-bl-md"
                          }`}
                        >
                          <p className="text-sm font-medium break-words">
                            {message.text}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message composer */}
              <form
                onSubmit={handleSendMessage}
                className="relative shrink-0 p-3 sm:p-4 border-t border-border bg-surface flex items-center gap-2 sm:gap-3"
                style={{
                  paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))",
                }}
              >
                {showEmojiPicker && (
                  <div className="absolute bottom-full right-4 sm:right-5 mb-2 z-20">
                    <EmojiPicker
                      onEmojiClick={handleEmojiSelect}
                      height={350}
                      width={300}
                    />
                  </div>
                )}

                <button
                  type="button"
                  data-emoji-trigger
                  onClick={() => setShowEmojiPicker((previous) => !previous)}
                  className="w-9 h-9 shrink-0 rounded-full flex items-center justify-center text-text-secondary hover:text-brand hover:bg-brand-light transition-colors duration-200"
                  aria-label="Toggle emoji picker"
                >
                  <Smile className="w-5 h-5" />
                </button>

                <input
                  type="text"
                  placeholder="Type your message..."
                  value={messageText}
                  onChange={(event) => setMessageText(event.target.value)}
                  className="flex-1 px-4 py-2 bg-background border border-border rounded-full text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand transition-all duration-200"
                />

                <button
                  type="submit"
                  disabled={!messageText.trim()}
                  className="w-10 h-10 shrink-0 rounded-full bg-brand text-text-onBrand flex items-center justify-center disabled:opacity-50 hover:bg-brand-dark transition-colors duration-200"
                  aria-label="Send message"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          )}
        </main>
      </div>

      {/* ===================== New chat modal ===================== */}
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
              <div className="p-4 border-b border-border flex items-center justify-between shrink-0">
                <h3 className="font-heading font-semibold text-text-primary">
                  Contacts
                </h3>
                <button
                  onClick={() => setShowNewChatModal(false)}
                  className="text-text-secondary hover:text-text-primary"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-2">
                {availableUsers.length === 0 ? (
                  <p className="text-center text-sm text-text-secondary p-6">
                    No contacts found
                  </p>
                ) : (
                  availableUsers.map((contact) => (
                    <button
                      key={contact._id}
                      onClick={() => startConversation(contact._id)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-background transition-colors text-left"
                    >
                      {renderAvatar(contact.profilePic, "w-10 h-10")}
                      <p className="text-sm font-medium text-text-primary">
                        {contact.name}
                      </p>
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===================== Profile modal ===================== */}
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
              className="bg-surface rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-md overflow-hidden max-h-[85dvh] overflow-y-auto"
            >
              <div className="p-4 border-b border-border flex items-center justify-between">
                <h3 className="font-heading font-semibold text-text-primary">
                  {isEditingProfile ? "Edit Profile" : "My Profile"}
                </h3>
                <button
                  onClick={() => {
                    setShowProfileModal(false);
                    setIsEditingProfile(false);
                  }}
                  className="text-text-secondary hover:text-text-primary"
                  aria-label="Close"
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
                              alt="Avatar option"
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
                        onChange={(event) => setEditName(event.target.value)}
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-all duration-200"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-text-secondary mb-1.5">
                        Bio
                      </label>
                      <textarea
                        value={editBio}
                        onChange={(event) => setEditBio(event.target.value)}
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

      {/* ===================== Delete confirmation modal ===================== */}
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
