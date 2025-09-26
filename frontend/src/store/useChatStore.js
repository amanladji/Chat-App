import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,
  // --- NEW STATE FOR STATS ---
  stats: null,
  isStatsLoading: false,
  // --- NEW STATE FOR UNREAD MESSAGES ---
  unreadMessages: {}, // Object to track unread count per user ID
  // --- MENTAL HEALTH COMPANION STATE ---
  mentalHealthCompanion: null, // Current companion message object

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      // Get friends instead of all users
      const res = await axiosInstance.get("/friends");
      set({ users: res.data });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      set({ messages: res.data });
      // Mark messages as read when opening a chat
      get().markMessagesAsRead(userId);
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();

    // Create temporary message for immediate UI feedback
    const tempMessage = {
      _id: `temp-${Date.now()}`, // Temporary ID
      text: messageData.text,
      image: messageData.image,
      senderId: useAuthStore.getState().authUser._id,
      receiverId: selectedUser._id,
      createdAt: new Date().toISOString(),
      sentiment: null,
      isPending: true, // Flag to identify temp message
    };

    // Optimistically add message to UI immediately
    set({ messages: [...messages, tempMessage] });

    try {
      const res = await axiosInstance.post(
        `/messages/send/${selectedUser._id}`,
        messageData
      );

      // Replace temp message with real message from server
      const updatedMessages = get().messages.map((msg) =>
        msg._id === tempMessage._id ? res.data : msg
      );
      set({ messages: updatedMessages });
    } catch (error) {
      // Remove temp message if sending failed
      const filteredMessages = get().messages.filter(
        (msg) => msg._id !== tempMessage._id
      );
      set({ messages: filteredMessages });

      toast.error(error.response?.data?.message || "Failed to send message");
    }
  },

  deleteMessage: async (messageId, deleteType = "forMe") => {
    try {
      await axiosInstance.delete(`/messages/${messageId}`, {
        data: { deleteType },
      });

      // Don't remove from local state immediately - wait for socket event
      // This ensures consistency and proper handling of delete types

      const deleteText =
        deleteType === "forEveryone" ? "for everyone" : "for you";
      toast.success(`Message deleted ${deleteText}`);
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to delete message");
    }
  },

  // Bulk delete messages
  deleteMessages: async (messageIds, deleteType = "forMe") => {
    try {
      await axiosInstance.delete("/messages/bulk", {
        data: { messageIds, deleteType },
      });

      // Don't remove from local state immediately - wait for socket events
      // This ensures consistency and proper handling of delete types

      const deleteText =
        deleteType === "forEveryone" ? "for everyone" : "for you";
      toast.success(`${messageIds.length} message(s) deleted ${deleteText}`);
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to delete messages");
    }
  },

  // --- NEW ACTION FOR STATS ---
  getSentimentStats: async (userId) => {
    set({ isStatsLoading: true, stats: null });
    try {
      const res = await axiosInstance.get(`/messages/stats/${userId}`);
      set({ stats: res.data });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isStatsLoading: false });
    }
  },

  subscribeToMessages: () => {
    const socket = useAuthStore.getState().socket;

    // Only subscribe to message deletion events here since newMessage is handled globally
    socket.on("messageDeleted", (deletionData) => {
      const { messageId, deleteType, deletedBy, deletedForEveryone } =
        deletionData;
      const currentUserId = useAuthStore.getState().authUser._id;

      console.log("🗑️ Received deletion event:", {
        messageId,
        deleteType,
        deletedBy,
        deletedForEveryone,
        currentUser: currentUserId,
      });

      // Always remove from UI if:
      // 1. Message was deleted for everyone, OR
      // 2. Current user is the one who deleted it (for any delete type)
      const shouldRemoveFromUI =
        deletedForEveryone || deletedBy === currentUserId;

      if (shouldRemoveFromUI) {
        console.log("🗑️ Removing message from UI:", messageId);
        set({
          messages: get().messages.filter(
            (message) => message._id !== messageId
          ),
        });
      } else {
        console.log(
          "🗑️ Not removing message - other user deleted for themselves only"
        );
      }
    });

    // Listen for mental health companion messages
    socket.on("mentalHealthCompanion", (companionData) => {
      console.log(
        "🧠 Received mental health companion message:",
        companionData
      );

      // Set the companion message with visibility flag
      set({
        mentalHealthCompanion: {
          ...companionData,
          isVisible: true,
          id: companionData.triggerId,
        },
      });
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    socket.off("newMessage");
    socket.off("messageDeleted"); // Unsubscribe from deletion events
    socket.off("mentalHealthCompanion"); // Unsubscribe from companion events
  },

  // Global message subscription for unread tracking
  subscribeToAllMessages: () => {
    const socket = useAuthStore.getState().socket;
    const currentUserId = useAuthStore.getState().authUser._id;

    console.log("🔄 Setting up global message subscription");
    console.log("🔌 Socket available:", !!socket);
    console.log("👤 Current user:", currentUserId);

    if (!socket) {
      console.error("❌ No socket connection available");
      return;
    }

    // Remove any existing listeners first to prevent duplicates
    socket.off("newMessage");

    socket.on("newMessage", (newMessage) => {
      console.log("📨 Received new message:", newMessage);
      const { selectedUser, unreadMessages } = get();
      const isMessageFromMe = newMessage.senderId === currentUserId;

      console.log("📝 Message details:", {
        from: newMessage.senderId,
        currentUser: currentUserId,
        selectedUser: selectedUser?._id,
        isFromMe: isMessageFromMe,
      });

      if (!isMessageFromMe) {
        const senderId = newMessage.senderId;

        if (selectedUser && selectedUser._id === senderId) {
          // Add message to current chat if it's from the selected user
          console.log("💬 Adding message to current chat");
          set({
            messages: [...get().messages, newMessage],
          });
        } else {
          // Increment unread count for other users
          const newUnreadMessages = {
            ...unreadMessages,
            [senderId]: (unreadMessages[senderId] || 0) + 1,
          };
          console.log("🔴 Updating unread messages:", newUnreadMessages);

          // Save to localStorage for persistence
          localStorage.setItem(
            "chatApp_unreadMessages",
            JSON.stringify(newUnreadMessages)
          );

          set({
            unreadMessages: newUnreadMessages,
          });
        }
      }
    });
  },

  unsubscribeFromAllMessages: () => {
    console.log("🛑 Unsubscribing from global messages");
    const socket = useAuthStore.getState().socket;
    socket.off("newMessage");
  },

  setSelectedUser: (selectedUser) => set({ selectedUser }),

  // --- NEW ACTIONS FOR UNREAD MESSAGES ---
  markMessagesAsRead: (userId) => {
    console.log("✅ Marking messages as read for user:", userId);
    const { unreadMessages } = get();
    if (unreadMessages[userId]) {
      const newUnreadMessages = { ...unreadMessages };
      delete newUnreadMessages[userId];
      console.log("📋 Updated unread messages:", newUnreadMessages);

      // Save to localStorage for persistence
      localStorage.setItem(
        "chatApp_unreadMessages",
        JSON.stringify(newUnreadMessages)
      );

      set({ unreadMessages: newUnreadMessages });
    }
  },

  getUnreadCount: (userId) => {
    const { unreadMessages } = get();
    const count = unreadMessages[userId] || 0;
    console.log(`Unread count for user ${userId}:`, count);
    return count;
  },

  initializeUnreadCounts: async () => {
    console.log("🚀 Initializing unread counts");

    // Try to restore unread counts from localStorage
    try {
      const savedUnreadMessages = localStorage.getItem(
        "chatApp_unreadMessages"
      );
      if (savedUnreadMessages) {
        const parsedUnreadMessages = JSON.parse(savedUnreadMessages);
        console.log(
          "📱 Restored unread counts from localStorage:",
          parsedUnreadMessages
        );
        set({ unreadMessages: parsedUnreadMessages });
        return;
      }
    } catch (error) {
      console.warn("Failed to restore unread counts from localStorage:", error);
    }

    // Fallback to empty state if no saved data or error
    set({ unreadMessages: {} });
  },

  // Mental Health Companion functions
  dismissCompanionMessage: (triggerId) => {
    console.log("🧠 Dismissing companion message:", triggerId);
    set({ mentalHealthCompanion: null });
  },

  // Mental Health Settings functions
  getMentalHealthSettings: async () => {
    try {
      const res = await axiosInstance.get("/messages/mental-health/settings");
      return res.data;
    } catch (error) {
      console.error("Error fetching mental health settings:", error);
      throw error;
    }
  },

  updateMentalHealthSettings: async (settings) => {
    try {
      const res = await axiosInstance.put(
        "/messages/mental-health/settings",
        settings
      );
      return res.data;
    } catch (error) {
      console.error("Error updating mental health settings:", error);
      throw error;
    }
  },

  getMentalHealthStats: async () => {
    try {
      const res = await axiosInstance.get("/messages/mental-health/stats");
      return res.data;
    } catch (error) {
      console.error("Error fetching mental health stats:", error);
      throw error;
    }
  },
}));
