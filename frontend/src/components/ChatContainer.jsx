import { useChatStore } from "../store/useChatStore";
import { useEffect, useRef, useState } from "react";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime } from "../lib/utils";
import SentimentStats from "./SentimentStats"; // Import the new component
import MessageContextMenu from "./MessageContextMenu";
import DeleteConfirmModal from "./DeleteConfirmModal";
import BulkDeleteConfirmModal from "./BulkDeleteConfirmModal";

// Helper function to get the correct color class
const getSentimentColorClass = (sentiment) => {
  switch (sentiment) {
    case "POSITIVE":
      return "bg-[#0CCA98]/80 text-white border border-[#0CCA98]/50";
    case "NEGATIVE":
      return "bg-red-600/80 text-red-50 border border-red-500/50";
    case "NEUTRAL":
      return "bg-[#8B7FB8]/80 text-white border border-[#8B7FB8]/50";
    default:
      return "bg-[#2a2434] text-zinc-100 border border-zinc-700/50";
  }
};

const ChatContainer = () => {
  const {
    messages,
    getMessages,
    isMessagesLoading,
    selectedUser,
    subscribeToMessages,
    unsubscribeFromMessages,
    deleteMessage, // Add deleteMessage to destructured values
    deleteMessages, // Add bulk delete function
  } = useChatStore();
  const { authUser } = useAuthStore();
  const messageEndRef = useRef(null);
  const [selectedImage, setSelectedImage] = useState(null);

  // --- NEW STATE FOR STATS MODAL ---
  const [showStatsModal, setShowStatsModal] = useState(false);

  // --- NEW STATE FOR CONTEXT MENU ---
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    messageId: null,
    messageText: "",
  });

  // --- NEW STATE FOR DELETE CONFIRMATION ---
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    messageId: null,
    messagePreview: "",
    messageData: null,
    isDeleting: false,
  });

  // --- LONG PRESS STATE ---
  const [longPressTimer, setLongPressTimer] = useState(null);

  // --- MULTI-SELECT STATE ---
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [selectedMessages, setSelectedMessages] = useState(new Set());

  // --- BULK DELETE CONFIRMATION STATE ---
  const [bulkDeleteModal, setBulkDeleteModal] = useState({
    isOpen: false,
    selectedCount: 0,
    messageIds: [],
  });

  // Handle message deletion with type
  const handleDeleteMessage = async (deleteType) => {
    setDeleteModal((prev) => ({ ...prev, isDeleting: true }));

    try {
      await deleteMessage(deleteModal.messageId, deleteType);
      setDeleteModal({
        isOpen: false,
        messageId: null,
        messagePreview: "",
        messageData: null,
        isDeleting: false,
      });
    } catch (error) {
      console.error("Error deleting message:", error);
      setDeleteModal((prev) => ({ ...prev, isDeleting: false }));
    }
  };

  // Handle multi-select message deletion - show confirmation
  const handleDeleteSelectedMessages = () => {
    const messageIds = Array.from(selectedMessages);
    // Get the full message objects for the selected message IDs
    const selectedMessageObjects = messages.filter((msg) =>
      messageIds.includes(msg._id)
    );

    setBulkDeleteModal({
      isOpen: true,
      selectedCount: messageIds.length,
      messageIds: messageIds,
      selectedMessages: selectedMessageObjects,
      isDeleting: false,
    });
  };

  // Handle confirmed bulk delete with deletion type
  const handleConfirmedBulkDelete = async (deleteType) => {
    setBulkDeleteModal((prev) => ({ ...prev, isDeleting: true }));

    try {
      // Use the bulk delete function with the stored message IDs and deletion type
      await deleteMessages(bulkDeleteModal.messageIds, deleteType);

      // Clear selection, exit multi-select mode, and close modal
      setSelectedMessages(new Set());
      setIsMultiSelectMode(false);
      setBulkDeleteModal({
        isOpen: false,
        selectedCount: 0,
        messageIds: [],
        selectedMessages: [],
        isDeleting: false,
      });
    } catch (error) {
      console.error("Error deleting selected messages:", error);
      setBulkDeleteModal((prev) => ({ ...prev, isDeleting: false }));
    }
  };

  // Handle bulk delete cancellation
  const handleCancelBulkDelete = () => {
    setBulkDeleteModal({
      isOpen: false,
      selectedCount: 0,
      messageIds: [],
      selectedMessages: [],
      isDeleting: false,
    });
  };

  // Toggle multi-select mode
  const toggleMultiSelectMode = () => {
    setIsMultiSelectMode(!isMultiSelectMode);
    setSelectedMessages(new Set()); // Clear selections when toggling mode
  };

  // Toggle message selection
  const toggleMessageSelection = (messageId) => {
    setSelectedMessages((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) {
        newSet.delete(messageId);
      } else {
        newSet.add(messageId);
      }
      return newSet;
    });
  };

  // Select all messages (both sent and received by current user)
  const selectAllMessages = () => {
    // Select all messages in the conversation (both sent and received)
    setSelectedMessages(new Set(messages.map((msg) => msg._id)));
  };

  // Clear all selections
  const clearAllSelections = () => {
    setSelectedMessages(new Set());
  };

  // Handle right-click context menu
  const handleRightClick = (e, message) => {
    e.preventDefault();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      messageId: message._id,
      messageText: message.text || "Image message",
    });
  };

  // Handle long press start
  const handleLongPressStart = (message, e) => {
    // Prevent default behavior that might interfere
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    const timer = setTimeout(() => {
      setContextMenu({
        visible: true,
        x: window.innerWidth / 2 - 60, // Center horizontally
        y: window.innerHeight / 2 - 50, // Center vertically
        messageId: message._id,
        messageText: message.text || "Image message",
      });
      // Clear timer after showing context menu
      setLongPressTimer(null);
    }, 500); // 500ms long press

    setLongPressTimer(timer);
  };

  // Handle long press end - with better event handling
  const handleLongPressEnd = (e) => {
    // Prevent default behavior
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    // Only clear the timer if context menu is not visible
    if (longPressTimer && !contextMenu.visible) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  // Close context menu
  const closeContextMenu = () => {
    setContextMenu({
      visible: false,
      x: 0,
      y: 0,
      messageId: null,
      messageText: "",
    });
  };

  // Show delete confirmation
  const showDeleteConfirmation = (messageId, messageText) => {
    // Find the full message object
    const messageData = messages.find((msg) => msg._id === messageId);

    setDeleteModal({
      isOpen: true,
      messageId,
      messagePreview: messageText,
      messageData: messageData,
      isDeleting: false,
    });
    closeContextMenu();
  };

  useEffect(() => {
    getMessages(selectedUser._id);
    subscribeToMessages();

    // Clear multi-select state when changing users
    setIsMultiSelectMode(false);
    setSelectedMessages(new Set());

    return () => unsubscribeFromMessages();
  }, [
    selectedUser._id,
    getMessages,
    subscribeToMessages,
    unsubscribeFromMessages,
  ]);

  useEffect(() => {
    if (messageEndRef.current && messages) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Cleanup long press timer on unmount
  useEffect(() => {
    return () => {
      if (longPressTimer) {
        clearTimeout(longPressTimer);
      }
    };
  }, [longPressTimer]);

  if (isMessagesLoading) {
    // ... (no changes here)
    return (
      <div className="flex-1 flex flex-col overflow-auto bg-gradient-to-b from-[#1f1a27] to-[#2a2336]">
        <ChatHeader />
        <MessageSkeleton />
        <MessageInput />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-auto bg-gradient-to-b from-[#1f1a27] to-[#2a2336]">
      <ChatHeader
        onOpenStats={() => setShowStatsModal(true)}
        isMultiSelectMode={isMultiSelectMode}
        onToggleMultiSelect={toggleMultiSelectMode}
        selectedMessagesCount={selectedMessages.size}
        onSelectAll={selectAllMessages}
        onClearSelections={clearAllSelections}
        onDeleteSelected={handleDeleteSelectedMessages}
      />

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Multi-select mode indicator */}
        {isMultiSelectMode && (
          <div className="sticky top-0 z-30 bg-[#3b3346]/80 border border-violet-400/30 rounded-lg p-3 mb-4 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-violet-400">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="font-medium">
                Multi-select mode - {selectedMessages.size} message
                {selectedMessages.size !== 1 ? "s" : ""} selected
              </span>
            </div>
            <div className="text-xs text-base-content/70 mt-1">
              Click on messages to select/deselect them
            </div>
          </div>
        )}

        {messages.map((message) => {
          const isMyMessage = message.senderId === authUser._id;
          const isSelected = selectedMessages.has(message._id);

          return (
            <div
              key={message._id}
              className={`chat ${isMyMessage ? "chat-end" : "chat-start"} ${
                isMultiSelectMode ? "relative cursor-pointer" : ""
              } ${
                isMultiSelectMode && isSelected
                  ? "bg-primary/20 border border-primary/40 rounded-xl p-2 -m-2 shadow-lg transform scale-[1.02] transition-all duration-200"
                  : ""
              } ${
                isMultiSelectMode && !isSelected
                  ? "opacity-50 hover:opacity-75 hover:bg-base-200/30 rounded-xl p-2 -m-2 transition-all duration-200 relative"
                  : ""
              }`}
              ref={messageEndRef}
              onClick={() => {
                if (isMultiSelectMode) {
                  toggleMessageSelection(message._id);
                }
              }}
            >
              {/* Selection checkbox - show for all messages in multi-select mode */}
              {isMultiSelectMode && (
                <div
                  className={`absolute top-1/2 transform -translate-y-1/2 z-10 ${
                    isMyMessage ? "-left-10" : "-right-10"
                  }`}
                >
                  <div
                    className={`p-2 rounded-full transition-all duration-200 ${
                      isSelected
                        ? "bg-primary text-primary-content shadow-lg scale-110"
                        : "bg-base-200 hover:bg-base-300"
                    }`}
                  >
                    <input
                      type="checkbox"
                      className={`checkbox checkbox-sm border-2 transition-all duration-200 ${
                        isSelected
                          ? "checkbox-primary border-primary-content"
                          : "checkbox-ghost border-base-content/30 hover:border-primary"
                      }`}
                      checked={isSelected}
                      onChange={(e) => {
                        e.stopPropagation(); // Prevent triggering parent click
                        toggleMessageSelection(message._id);
                      }}
                      onClick={(e) => e.stopPropagation()} // Also prevent click bubbling
                    />
                  </div>
                </div>
              )}

              {/* Overlay for non-selected messages in multi-select mode */}
              {isMultiSelectMode && !isSelected && (
                <div className="absolute inset-0 bg-base-content/10 rounded-xl pointer-events-none transition-opacity duration-200"></div>
              )}

              {/* Selection indicator badge for selected messages */}
              {isMultiSelectMode && isSelected && (
                <div
                  className={`absolute -top-2 z-20 ${
                    isMyMessage ? "-left-2" : "-right-2"
                  }`}
                >
                  <div className="w-6 h-6 bg-violet-500 rounded-full flex items-center justify-center shadow-lg">
                    <svg
                      className="w-4 h-4 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                </div>
              )}

              <div className="chat-image avatar">
                <div className="size-10 rounded-full border">
                  <img
                    src={
                      isMyMessage
                        ? authUser.profilePic || "/avatar.png"
                        : selectedUser.profilePic || "/avatar.png"
                    }
                    alt="profile pic"
                  />
                </div>
              </div>
              <div className="chat-header mb-1">
                <time className="text-xs opacity-50 ml-1">
                  {formatMessageTime(message.createdAt)}
                </time>
              </div>
              <div
                className={`chat-bubble flex flex-col ${getSentimentColorClass(
                  message.sentiment
                )} cursor-pointer select-none transition-all duration-200 rounded-xl shadow-lg ${
                  isMultiSelectMode && isSelected
                    ? "ring-4 ring-violet-400 ring-opacity-60 shadow-xl transform scale-[1.05] border-2 border-violet-400/50"
                    : ""
                } ${
                  isMultiSelectMode && !isSelected
                    ? "hover:ring-2 hover:ring-violet-400/30 hover:shadow-md hover:transform hover:scale-[1.02]"
                    : ""
                } ${!isMultiSelectMode ? "hover:shadow-sm" : ""}`}
                onContextMenu={(e) => {
                  if (!isMultiSelectMode) {
                    handleRightClick(e, message);
                  }
                }}
                onMouseDown={(e) => {
                  if (!isMultiSelectMode) {
                    // Only trigger long press on left mouse button
                    if (e.button === 0) {
                      handleLongPressStart(message, e);
                    }
                  }
                }}
                onMouseUp={(e) => {
                  if (!isMultiSelectMode) {
                    // Only handle left mouse button
                    if (e.button === 0) {
                      handleLongPressEnd(e);
                    }
                  }
                }}
                onMouseLeave={() => {
                  if (!isMultiSelectMode) {
                    // Only cancel long press if context menu is not visible
                    if (longPressTimer && !contextMenu.visible) {
                      clearTimeout(longPressTimer);
                      setLongPressTimer(null);
                    }
                  }
                }}
                onTouchStart={(e) => {
                  if (!isMultiSelectMode) {
                    handleLongPressStart(message, e);
                  }
                }}
                onTouchEnd={(e) => {
                  if (!isMultiSelectMode) {
                    handleLongPressEnd(e);
                  }
                }}
                onTouchCancel={(e) => {
                  if (!isMultiSelectMode) {
                    handleLongPressEnd(e);
                  }
                }}
                onDragStart={(e) => e.preventDefault()} // Prevent drag during long press
                style={{ userSelect: "none" }} // Prevent text selection during long press
              >
                {message.image && (
                  <img
                    src={message.image}
                    alt="Attachment"
                    className="sm:max-w-[200px] rounded-md mb-2 cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent triggering message selection
                      if (!isMultiSelectMode) {
                        setSelectedImage(message.image);
                      }
                    }}
                  />
                )}
                {message.text && <p>{message.text}</p>}
              </div>
            </div>
          );
        })}
      </div>

      <MessageInput />

      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75"
          onClick={() => setSelectedImage(null)}
        >
          <img
            src={selectedImage}
            alt="Full screen attachment"
            className="max-w-[90vw] max-h-[90vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            className="absolute top-4 right-4 text-white text-3xl font-bold"
            onClick={() => setSelectedImage(null)}
          >
            &times;
          </button>
        </div>
      )}

      {/* --- NEW STATS MODAL RENDER --- */}
      {showStatsModal && (
        <SentimentStats onClose={() => setShowStatsModal(false)} />
      )}

      {/* Context Menu */}
      <MessageContextMenu
        x={contextMenu.x}
        y={contextMenu.y}
        isVisible={contextMenu.visible}
        onClose={closeContextMenu}
        onDelete={() =>
          showDeleteConfirmation(contextMenu.messageId, contextMenu.messageText)
        }
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() =>
          setDeleteModal({
            isOpen: false,
            messageId: null,
            messagePreview: "",
            messageData: null,
            isDeleting: false,
          })
        }
        onConfirm={handleDeleteMessage}
        messagePreview={deleteModal.messagePreview}
        messageData={deleteModal.messageData}
        currentUserId={authUser?._id}
        isDeleting={deleteModal.isDeleting}
      />

      {/* Bulk Delete Confirmation Modal */}
      <BulkDeleteConfirmModal
        isOpen={bulkDeleteModal.isOpen}
        onClose={handleCancelBulkDelete}
        onConfirm={handleConfirmedBulkDelete}
        selectedCount={bulkDeleteModal.selectedCount}
        isDeleting={bulkDeleteModal.isDeleting}
        selectedMessages={bulkDeleteModal.selectedMessages}
        currentUserId={authUser?._id}
      />
    </div>
  );
};
export default ChatContainer;
