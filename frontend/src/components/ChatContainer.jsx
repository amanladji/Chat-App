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

  // Handle message deletion
  const handleDeleteMessage = async (messageId) => {
    await deleteMessage(messageId);
    setDeleteModal({ isOpen: false, messageId: null, messagePreview: "" });
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
      <ChatHeader onOpenStats={() => setShowStatsModal(true)} />

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message._id}
            className={`chat ${
              message.senderId === authUser._id ? "chat-end" : "chat-start"
            }`}
            ref={messageEndRef}
          >
            <div className=" chat-image avatar">
              <div className="size-10 rounded-full border">
                <img
                  src={
                    message.senderId === authUser._id
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
              )} cursor-pointer select-none`}
              onContextMenu={(e) => handleRightClick(e, message)}
              onMouseDown={(e) => {
                // Only trigger long press on left mouse button
                if (e.button === 0) {
                  handleLongPressStart(message, e);
                }
              }}
              onMouseUp={(e) => {
                // Only handle left mouse button
                if (e.button === 0) {
                  handleLongPressEnd(e);
                }
              }}
              onMouseLeave={() => {
                // Only cancel long press if context menu is not visible
                if (longPressTimer && !contextMenu.visible) {
                  clearTimeout(longPressTimer);
                  setLongPressTimer(null);
                }
              }}
              onTouchStart={(e) => handleLongPressStart(message, e)}
              onTouchEnd={(e) => handleLongPressEnd(e)}
              onTouchCancel={(e) => handleLongPressEnd(e)}
              onDragStart={(e) => e.preventDefault()} // Prevent drag during long press
              style={{ userSelect: "none" }} // Prevent text selection during long press
            >
              {message.image && (
                <img
                  src={message.image}
                  alt="Attachment"
                  className="sm:max-w-[200px] rounded-md mb-2 cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => setSelectedImage(message.image)}
                />
              )}
              {message.text && <p>{message.text}</p>}
            </div>
          </div>
        ))}
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
