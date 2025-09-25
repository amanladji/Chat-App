import { useState } from "react";
import { useFriendStore } from "../store/useFriendStore";
import { useChatStore } from "../store/useChatStore";
import { UserMinus } from "lucide-react";

const RemoveFriendModal = ({ isOpen, onClose, friend }) => {
  const { removeFriend } = useFriendStore();
  const { selectedUser, setSelectedUser, getUsers } = useChatStore();
  const [isRemoving, setIsRemoving] = useState(false);

  if (!isOpen || !friend) return null;

  const handleRemoveFriend = async () => {
    setIsRemoving(true);
    try {
      await removeFriend(friend._id);

      // If the removed friend was selected, clear the selection
      if (selectedUser?._id === friend._id) {
        setSelectedUser(null);
      }

      // Refresh the users list in chat store
      getUsers();

      onClose();
    } catch (error) {
      console.error("Error removing friend:", error);
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-base-100 rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-shrink-0">
            <UserMinus className="size-8 text-red-500" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Remove Friend</h3>
            <p className="text-sm text-base-content/70">
              Are you sure you want to remove {friend.fullName} from your
              friends list?
            </p>
          </div>
        </div>

        <div className="bg-base-200 rounded-lg p-3 mb-4">
          <div className="flex items-center gap-3">
            <img
              src={friend.profilePic || "/avatar.png"}
              alt={friend.fullName}
              className="size-10 rounded-full object-cover"
            />
            <div>
              <div className="font-medium">{friend.fullName}</div>
              <div className="text-sm text-base-content/70">{friend.email}</div>
            </div>
          </div>
        </div>

        <p className="text-sm text-base-content/70 mb-6">
          You can always send them a friend request again later if you change
          your mind.
        </p>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            disabled={isRemoving}
            className="btn btn-ghost"
          >
            Cancel
          </button>
          <button
            onClick={handleRemoveFriend}
            disabled={isRemoving}
            className="btn btn-error"
          >
            {isRemoving ? (
              <span className="loading loading-spinner loading-sm" />
            ) : (
              "Remove Friend"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RemoveFriendModal;
