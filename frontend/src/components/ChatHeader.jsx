import { TrendingUp, X, CheckSquare, Trash2, CheckCheck } from "lucide-react";
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
      <div className="p-2.5 border-b border-zinc-700/50 bg-[#2a2434]/80 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onToggleMultiSelect}
              className="p-2 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-700/50 transition-colors"
            >
              <X className="size-5" />
            </button>
            <span className="font-medium text-zinc-100">
              {selectedMessagesCount} selected
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onSelectAll}
              className="px-3 py-2 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-700/50 transition-colors text-sm"
              title="Select All Messages"
            >
              <CheckCheck className="size-4" />
            </button>

            <button
              onClick={onClearSelections}
              className="px-3 py-2 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-700/50 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={selectedMessagesCount === 0}
            >
              Clear
            </button>

            <button
              onClick={onDeleteSelected}
              className="px-3 py-2 rounded-lg bg-red-600/80 text-white hover:bg-red-600 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
    <div className="p-2.5 border-b border-zinc-700/50 bg-[#2a2434]/80 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="avatar">
            <div className="size-10 rounded-full relative border-2 border-zinc-600/50">
              <img
                src={selectedUser.profilePic || "/avatar.png"}
                alt={selectedUser.fullName}
              />
            </div>
          </div>

          <div>
            <h3 className="font-medium text-zinc-100">
              {selectedUser.fullName}
            </h3>
            <p className="text-sm text-zinc-400">
              {onlineUsers.includes(selectedUser._id) ? "Online" : "Offline"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Multi-select toggle button */}
          <button
            className="p-2 rounded-full text-zinc-400 hover:text-violet-400 hover:bg-zinc-700/50 transition-colors"
            onClick={onToggleMultiSelect}
            title="Select Messages"
          >
            <CheckSquare className="size-5" />
          </button>

          {/* Stats button */}
          <button
            className="p-2 rounded-full text-zinc-400 hover:text-violet-400 hover:bg-zinc-700/50 transition-colors"
            onClick={onOpenStats}
          >
            <TrendingUp className="size-5" />
          </button>

          <button
            className="p-2 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-700/50 transition-colors"
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
