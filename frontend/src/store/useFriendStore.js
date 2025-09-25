import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

export const useFriendStore = create((set, get) => ({
  friends: [],
  pendingRequests: [],
  searchResults: [],
  isLoading: false,

  // Get friends list
  getFriends: async () => {
    set({ isLoading: true });
    try {
      const res = await axiosInstance.get("/friends/list");
      set({ friends: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch friends");
    } finally {
      set({ isLoading: false });
    }
  },

  // Get pending friend requests
  getPendingRequests: async () => {
    try {
      const res = await axiosInstance.get("/friends/pending");
      set({ pendingRequests: res.data });
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to fetch pending requests"
      );
    }
  },

  // Send friend request
  sendFriendRequest: async (email) => {
    try {
      const res = await axiosInstance.post("/friends/request", {
        recipientEmail: email,
      });
      toast.success("Friend request sent!");
      return res.data;
    } catch (error) {
      toast.error(
        error.response?.data?.error || "Failed to send friend request"
      );
      throw error;
    }
  },

  // Accept friend request
  acceptFriendRequest: async (requestId) => {
    try {
      await axiosInstance.put(`/friends/accept/${requestId}`);
      toast.success("Friend request accepted!");

      // Refresh friends and pending requests
      get().getFriends();
      get().getPendingRequests();

      // Also refresh the chat store to show the new friend in sidebar
      import("./useChatStore.js").then(({ useChatStore }) => {
        useChatStore.getState().getUsers();
      });
    } catch (error) {
      toast.error(
        error.response?.data?.error || "Failed to accept friend request"
      );
    }
  },

  // Decline friend request
  declineFriendRequest: async (requestId) => {
    try {
      await axiosInstance.put(`/friends/decline/${requestId}`);
      toast.success("Friend request declined");

      // Refresh pending requests
      get().getPendingRequests();
    } catch (error) {
      toast.error(
        error.response?.data?.error || "Failed to decline friend request"
      );
    }
  },

  // Search users
  searchUsers: async (query) => {
    if (!query.trim()) {
      set({ searchResults: [] });
      return;
    }

    set({ isLoading: true });
    try {
      const res = await axiosInstance.get(
        `/friends/search?query=${encodeURIComponent(query)}`
      );
      set({ searchResults: res.data });
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to search users");
      set({ searchResults: [] });
    } finally {
      set({ isLoading: false });
    }
  },

  // Remove friend
  removeFriend: async (friendId) => {
    try {
      await axiosInstance.delete(`/friends/remove/${friendId}`);
      toast.success("Friend removed");

      // Refresh friends list
      get().getFriends();

      // Also refresh the chat store to update sidebar
      import("./useChatStore.js").then(({ useChatStore }) => {
        useChatStore.getState().getUsers();
      });
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to remove friend");
    }
  },

  // Clear search results
  clearSearchResults: () => {
    set({ searchResults: [] });
  },

  // Subscribe to friend-related socket events
  subscribeToFriendEvents: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    // Listen for incoming friend requests
    socket.on("friendRequest", (data) => {
      toast.success(`${data.requester.fullName} sent you a friend request!`);
      // Refresh pending requests to show the new request
      get().getPendingRequests();
    });

    // Listen for friend request acceptance
    socket.on("friendRequestAccepted", (data) => {
      toast.success(`${data.friend.fullName} accepted your friend request!`);
      // Refresh friends list to show the new friend
      get().getFriends();

      // Also refresh the chat store to show the new friend in sidebar
      import("./useChatStore.js").then(({ useChatStore }) => {
        useChatStore.getState().getUsers();
      });
    });

    // Listen for friend removal
    socket.on("friendRemoved", () => {
      toast.info("A friend has removed you from their friend list");
      // Refresh friends list
      get().getFriends();

      // Also refresh the chat store to update sidebar
      import("./useChatStore.js").then(({ useChatStore }) => {
        useChatStore.getState().getUsers();
      });
    });
  },

  // Unsubscribe from friend-related socket events
  unsubscribeFromFriendEvents: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    socket.off("friendRequest");
    socket.off("friendRequestAccepted");
    socket.off("friendRemoved");
  },
}));
