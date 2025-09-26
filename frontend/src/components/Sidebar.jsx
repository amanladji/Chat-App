import { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useFriendStore } from "../store/useFriendStore";
import { useAuthStore } from "../store/useAuthStore";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import AddFriendModal from "./AddFriendModal";
import FriendRequestsModal from "./FriendRequestsModal";
import ContactContextMenu from "./ContactContextMenu";
import RemoveFriendModal from "./RemoveFriendModal";
import { Users, UserPlus, Bell } from "lucide-react";

const Sidebar = () => {
  const {
    getUsers,
    users,
    selectedUser,
    setSelectedUser,
    isUsersLoading,
    getUnreadCount,
    markMessagesAsRead,
    initializeUnreadCounts,
  } = useChatStore();
  const { pendingRequests, getPendingRequests } = useFriendStore();
  const { onlineUsers } = useAuthStore();

  const [showOnlineOnly, setShowOnlineOnly] = useState(false);
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  const [showRequestsModal, setShowRequestsModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [friendToRemove, setFriendToRemove] = useState(null);
  const [contextMenu, setContextMenu] = useState({
    isOpen: false,
    position: { x: 0, y: 0 },
    friend: null,
  });
  const [longPressTimer, setLongPressTimer] = useState(null);

  useEffect(() => {
    getUsers();
    getPendingRequests();
    initializeUnreadCounts();
  }, [getUsers, getPendingRequests, initializeUnreadCounts]);

  // Cleanup long press timer on unmount
  useEffect(() => {
    return () => {
      if (longPressTimer) {
        clearTimeout(longPressTimer);
      }
    };
  }, [longPressTimer]);

  const handleContactRightClick = (e, user) => {
    e.preventDefault();
    setContextMenu({
      isOpen: true,
      position: { x: e.clientX, y: e.clientY },
      friend: user,
    });
  };

  const closeContextMenu = () => {
    setContextMenu({ isOpen: false, position: { x: 0, y: 0 }, friend: null });
  };

  const handleLongPressStart = (e, user) => {
    const timer = setTimeout(() => {
      const rect = e.currentTarget.getBoundingClientRect();
      setContextMenu({
        isOpen: true,
        position: {
          x: rect.left + rect.width / 2,
          y: rect.top,
        },
        friend: user,
      });
    }, 500);
    setLongPressTimer(timer);
  };

  const handleLongPressEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  const handleRemoveFriend = (friend) => {
    setFriendToRemove(friend);
    setShowRemoveModal(true);
  };

  const filteredUsers = showOnlineOnly
    ? users.filter((user) => onlineUsers.includes(user._id))
    : users;

  if (isUsersLoading) return <SidebarSkeleton />;

  return (
    <aside className="h-full w-20 lg:w-72 border-r border-[#3b3346] bg-[#2a2434] flex flex-col transition-all duration-200 text-zinc-100">
      <div className="border-b border-[#3b3346] w-full p-5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Users className="size-6 text-violet-400" />
            <span className="font-medium hidden lg:block text-zinc-100">
              Contacts
            </span>
          </div>

          {/* Friend management buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowRequestsModal(true)}
              className="relative btn btn-sm bg-[#3b3346] hover:bg-[#4a4357] border-[#3b3346] text-zinc-300 hover:text-zinc-100"
              title="Friend Requests"
            >
              <Bell className="size-4" />
              {pendingRequests && pendingRequests.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-violet-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {pendingRequests.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setShowAddFriendModal(true)}
              className="btn btn-sm bg-violet-500 hover:bg-violet-400 border-violet-500 text-white"
              title="Add Friend"
            >
              <UserPlus className="size-4" />
            </button>
          </div>
        </div>

        {/* Online filter toggle */}
        <div className="mt-3 hidden lg:flex items-center gap-2">
          <label className="cursor-pointer flex items-center gap-2">
            <input
              type="checkbox"
              checked={showOnlineOnly}
              onChange={(e) => setShowOnlineOnly(e.target.checked)}
              className="checkbox checkbox-sm [--chkbg:#6d55e6] [--chkfg:#fff] border-[#3b3346]"
            />
            <span className="text-sm text-zinc-300">Show online only</span>
          </label>
          <span className="text-xs text-zinc-500">
            ({onlineUsers.length - 1} online)
          </span>
        </div>
      </div>

      <div className="overflow-y-auto w-full py-3 bg-[#2a2434]">
        {filteredUsers.map((user) => (
          <button
            key={user._id}
            onClick={() => {
              // Clear any pending long press when clicking
              if (longPressTimer) {
                clearTimeout(longPressTimer);
                setLongPressTimer(null);
              }
              setSelectedUser(user);
              markMessagesAsRead(user._id);
            }}
            onContextMenu={(e) => handleContactRightClick(e, user)}
            onTouchStart={(e) => {
              // Start long press timer for touch devices
              handleLongPressStart(e, user);
            }}
            onTouchEnd={() => {
              // Clear long press timer on touch end
              handleLongPressEnd();
            }}
            onTouchMove={() => {
              // Cancel long press if user moves finger (scrolling)
              handleLongPressEnd();
            }}
            className={`
              w-full p-3 flex items-center gap-3
              hover:bg-[#3b3346] transition-colors text-left
              ${
                selectedUser?._id === user._id
                  ? "bg-[#3b3346] ring-1 ring-violet-400/50 border-l-2 border-violet-400"
                  : ""
              }
            `}
          >
            <div className="relative mx-auto lg:mx-0">
              <img
                src={user.profilePic || "/avatar.png"}
                alt={user.name}
                className="size-12 object-cover rounded-full ring-2 ring-[#3b3346]"
              />
              {onlineUsers.includes(user._id) && (
                <span
                  className="absolute bottom-0 right-0 size-3 bg-green-500 
                  rounded-full ring-2 ring-[#2a2434]"
                />
              )}
              {/* Unread message indicator for mobile */}
              {getUnreadCount(user._id) > 0 && (
                <span className="absolute -top-1 -right-1 bg-violet-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center lg:hidden">
                  {getUnreadCount(user._id) > 9
                    ? "9+"
                    : getUnreadCount(user._id)}
                </span>
              )}
            </div>

            {/* User info - only visible on larger screens */}
            <div className="hidden lg:block text-left min-w-0 flex-1">
              <div className="font-medium truncate text-zinc-100">
                {user.fullName}
              </div>
              <div className="text-sm text-zinc-400 flex items-center justify-between">
                <span>
                  {onlineUsers.includes(user._id) ? "Online" : "Offline"}
                </span>
                {getUnreadCount(user._id) > 0 && (
                  <span className="bg-violet-500 text-white text-xs rounded-full px-2 py-0.5 ml-2 min-w-[20px] text-center">
                    {getUnreadCount(user._id)}
                  </span>
                )}
              </div>
            </div>
          </button>
        ))}

        {filteredUsers.length === 0 && (
          <div className="text-center text-zinc-400 py-4">
            <div>No friends yet</div>
            <div className="text-xs mt-1 text-zinc-500">
              Add friends to start chatting
            </div>
          </div>
        )}

        {filteredUsers.length > 0 && (
          <div className="text-xs text-zinc-500 text-center py-2 px-4">
            Right-click or long-press contacts for options
          </div>
        )}
      </div>

      {/* Friend Management Modals */}
      <AddFriendModal
        isOpen={showAddFriendModal}
        onClose={() => setShowAddFriendModal(false)}
      />

      <FriendRequestsModal
        isOpen={showRequestsModal}
        onClose={() => setShowRequestsModal(false)}
      />

      {/* Contact Context Menu */}
      <ContactContextMenu
        isOpen={contextMenu.isOpen}
        onClose={closeContextMenu}
        position={contextMenu.position}
        friend={contextMenu.friend}
        onSelectUser={setSelectedUser}
        onRemoveFriend={handleRemoveFriend}
      />

      {/* Remove Friend Modal */}
      <RemoveFriendModal
        isOpen={showRemoveModal}
        onClose={() => setShowRemoveModal(false)}
        friend={friendToRemove}
      />
    </aside>
  );
};
export default Sidebar;
