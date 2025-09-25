import { BarChart2, X, CheckSquare, Trash2, CheckCheck } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";

const ChatHeader = ({
  onOpenStats,
  isMultiSelectMode,
  onToggleMultiSelect,
  selectedMessagesCount,
  onSelectAll,
  onClearSelections,
  onDeleteSelected,
}) => {
  const { selectedUser, setSelectedUser } = useChatStore();
  const { onlineUsers } = useAuthStore();

  if (isMultiSelectMode) {
    return (
      <div className="p-2.5 border-b border-base-300 bg-base-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onToggleMultiSelect}
              className="btn btn-ghost btn-sm btn-circle"
            >
              <X className="size-5" />
            </button>
            <span className="font-medium">
              {selectedMessagesCount} selected
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onSelectAll}
              className="btn btn-ghost btn-sm"
              title="Select All Messages"
            >
              <CheckCheck className="size-4" />
            </button>

            <button
              onClick={onClearSelections}
              className="btn btn-ghost btn-sm"
              disabled={selectedMessagesCount === 0}
            >
              Clear
            </button>

            <button
              onClick={onDeleteSelected}
              className="btn btn-error btn-sm"
              disabled={selectedMessagesCount === 0}
            >
              <Trash2 className="size-4" />
              Delete ({selectedMessagesCount})
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-2.5 border-b border-base-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="avatar">
            <div className="size-10 rounded-full relative">
              <img
                src={selectedUser.profilePic || "/avatar.png"}
                alt={selectedUser.fullName}
              />
            </div>
          </div>

          <div>
            <h3 className="font-medium">{selectedUser.fullName}</h3>
            <p className="text-sm text-base-content/70">
              {onlineUsers.includes(selectedUser._id) ? "Online" : "Offline"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Multi-select toggle button */}
          <button
            className="btn btn-ghost btn-sm btn-circle"
            onClick={onToggleMultiSelect}
            title="Select Messages"
          >
            <CheckSquare className="size-5" />
          </button>

          {/* Stats button */}
          <button
            className="btn btn-ghost btn-sm btn-circle"
            onClick={onOpenStats}
          >
            <BarChart2 className="size-5" />
          </button>

          <button
            className="btn btn-ghost btn-sm btn-circle"
            onClick={() => setSelectedUser(null)}
          >
            <X className="size-6" />
          </button>
        </div>
      </div>
    </div>
  );
};
export default ChatHeader;
