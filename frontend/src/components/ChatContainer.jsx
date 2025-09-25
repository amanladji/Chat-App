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

// Helper function to get the correct color class
const getSentimentColorClass = (sentiment) => {
  // ... (no changes in this function)
  switch (sentiment) {
    case "POSITIVE":
      return "chat-bubble-success dark:bg-green-500";
    case "NEGATIVE":
      return "chat-bubble-error dark:bg-red-500";
    case "NEUTRAL":
      return "chat-bubble-info dark:bg-blue-500";
    default:
      return "";
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
  });

  // --- LONG PRESS STATE ---
  const [longPressTimer, setLongPressTimer] = useState(null);

  // --- MULTI-SELECT STATE ---
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [selectedMessages, setSelectedMessages] = useState(new Set());

  // Handle message deletion
  const handleDeleteMessage = async (messageId) => {
    await deleteMessage(messageId);
    setDeleteModal({ isOpen: false, messageId: null, messagePreview: "" });
  };

  // Handle multi-select message deletion
  const handleDeleteSelectedMessages = async () => {
    const messageIds = Array.from(selectedMessages);
    try {
      // Use the bulk delete function
      await deleteMessages(messageIds);

      // Clear selection and exit multi-select mode
      setSelectedMessages(new Set());
      setIsMultiSelectMode(false);
    } catch (error) {
      console.error("Error deleting selected messages:", error);
    }
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
    setDeleteModal({
      isOpen: true,
      messageId,
      messagePreview: messageText,
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
      <div className="flex-1 flex flex-col overflow-auto">
        <ChatHeader />
        <MessageSkeleton />
        <MessageInput />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-auto">
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
                  ? "bg-primary/5 rounded-lg p-1 -m-1"
                  : ""
              } ${
                isMultiSelectMode
                  ? "hover:bg-base-200/50 rounded-lg p-1 -m-1 transition-colors"
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
                    isMyMessage ? "-left-8" : "-right-8"
                  }`}
                >
                  <input
                    type="checkbox"
                    className="checkbox checkbox-sm"
                    checked={isSelected}
                    onChange={(e) => {
                      e.stopPropagation(); // Prevent triggering parent click
                      toggleMessageSelection(message._id);
                    }}
                    onClick={(e) => e.stopPropagation()} // Also prevent click bubbling
                  />
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
                )} cursor-pointer select-none ${
                  isMultiSelectMode && isSelected
                    ? "ring-2 ring-primary ring-opacity-50"
                    : ""
                } ${
                  isMultiSelectMode
                    ? "hover:ring-1 hover:ring-primary hover:ring-opacity-30"
                    : ""
                }`}
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
          setDeleteModal({ isOpen: false, messageId: null, messagePreview: "" })
        }
        onConfirm={() => handleDeleteMessage(deleteModal.messageId)}
        messagePreview={deleteModal.messagePreview}
      />
    </div>
  );
};
export default ChatContainer;
