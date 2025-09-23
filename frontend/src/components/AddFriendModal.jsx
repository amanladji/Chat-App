import { useState } from "react";
import { useFriendStore } from "../store/useFriendStore";
import { X, Search, UserPlus, Check, Clock } from "lucide-react";

const AddFriendModal = ({ isOpen, onClose }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const {
    searchResults,
    isLoading,
    searchUsers,
    sendFriendRequest,
    clearSearchResults,
  } = useFriendStore();

  const handleSearch = async (query) => {
    setSearchQuery(query);
    await searchUsers(query);
  };

  const handleSendRequest = async (email) => {
    try {
      await sendFriendRequest(email);
      // Refresh search to update status
      await searchUsers(searchQuery);
    } catch {
      // Error handled in store
    }
  };

  const handleClose = () => {
    setSearchQuery("");
    clearSearchResults();
    onClose();
  };

  const getFriendshipStatusIcon = (status) => {
    switch (status) {
      case "accepted":
        return <Check className="h-4 w-4 text-green-500" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <UserPlus className="h-4 w-4 text-blue-500" />;
    }
  };

  const getFriendshipStatusText = (status) => {
    switch (status) {
      case "accepted":
        return "Friends";
      case "pending":
        return "Pending";
      default:
        return "Add Friend";
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Add Friends
            </h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search by email or name..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Search Results */}
        <div className="p-6 max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : searchResults.length > 0 ? (
            <div className="space-y-3">
              {searchResults.map((user) => (
                <div
                  key={user._id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={user.profilePic || "/avatar.png"}
                      alt={user.fullName}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {user.fullName}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {user.email}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleSendRequest(user.email)}
                    disabled={user.friendshipStatus !== "none"}
                    className={`flex items-center gap-2 px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                      user.friendshipStatus === "none"
                        ? "bg-blue-500 hover:bg-blue-600 text-white"
                        : "bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    {getFriendshipStatusIcon(user.friendshipStatus)}
                    {getFriendshipStatusText(user.friendshipStatus)}
                  </button>
                </div>
              ))}
            </div>
          ) : searchQuery ? (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">No users found</p>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">
                Search for users by email or name to add them as friends
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddFriendModal;
