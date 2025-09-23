import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";

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
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to remove friend");
    }
  },

  // Clear search results
  clearSearchResults: () => {
    set({ searchResults: [] });
  },
}));
