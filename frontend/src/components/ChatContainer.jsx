import { useChatStore } from "../store/useChatStore";
import { useEffect, useRef, useState } from "react";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime } from "../lib/utils";
import SentimentLineGraph from "./SentimentLineGraph"; // Import the sentiment line graph directly
import MessageContextMenu from "./MessageContextMenu";
import DeleteConfirmModal from "./DeleteConfirmModal";
import BulkDeleteConfirmModal from "./BulkDeleteConfirmModal";
import { ChevronDown } from "lucide-react"; // Add ChevronDown import
import MentalHealthCompanion from "./MentalHealthCompanion"; // Import mental health companion

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
    deleteMessage, // Add deleteMessage to destructured values
    deleteMessages, // Add bulk delete function
    subscribeToMessages,
    unsubscribeFromMessages,
    mentalHealthCompanion, // Add mental health companion state
    dismissCompanionMessage, // Add companion dismiss function
  } = useChatStore();
  const { authUser } = useAuthStore();
  const messageEndRef = useRef(null);
  const messagesContainerRef = useRef(null); // Add ref for messages container
  const prevMessageCountRef = useRef(0);
  const [selectedImage, setSelectedImage] = useState(null);

  // --- NEW STATE FOR STATS MODAL ---
  const [showStatsModal, setShowStatsModal] = useState(false);

  // --- SCROLL TO BOTTOM BUTTON STATE ---
  const [showScrollButton, setShowScrollButton] = useState(false);

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
    const wasInMultiSelectMode = isMultiSelectMode;
    setIsMultiSelectMode(!isMultiSelectMode);
    setSelectedMessages(new Set()); // Clear selections when toggling mode

    // Prevent auto-scroll when toggling modes by updating the ref
    if (!wasInMultiSelectMode && messages?.length > 0) {
      prevMessageCountRef.current = messages.length;
    }
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

  // Handle long press start - improved for mobile
  const handleLongPressStart = (message, e) => {
    // Store initial touch/mouse position for movement detection
    const startX = e.touches ? e.touches[0].clientX : e.clientX;
    const startY = e.touches ? e.touches[0].clientY : e.clientY;

    const timer = setTimeout(() => {
      // Only show context menu if it's a true long press (no significant movement)
      const isMobile = window.innerWidth < 768;
      const x = isMobile
        ? window.innerWidth / 2 - 70
        : e.touches
        ? e.touches[0].clientX
        : e.clientX;
      const y = isMobile
        ? window.innerHeight / 2 - 50
        : e.touches
        ? e.touches[0].clientY
        : e.clientY;

      setContextMenu({
        visible: true,
        x,
        y,
        messageId: message._id,
        messageText: message.text || "Image message",
      });
      setLongPressTimer(null);
    }, 800); // Increased to 800ms for mobile - less accidental triggers

    setLongPressTimer({ timer, startX, startY });
  };

  // Handle long press end - improved event handling
  const handleLongPressEnd = () => {
    if (longPressTimer && longPressTimer.timer) {
      clearTimeout(longPressTimer.timer);
      setLongPressTimer(null);
    }
  };

  // Handle touch/mouse move - cancel long press if user is scrolling/dragging
  const handleLongPressMove = (e) => {
    if (longPressTimer && longPressTimer.timer) {
      const currentX = e.touches ? e.touches[0].clientX : e.clientX;
      const currentY = e.touches ? e.touches[0].clientY : e.clientY;
      const threshold = 10; // pixels

      // If user moved more than threshold, cancel long press
      if (
        Math.abs(currentX - longPressTimer.startX) > threshold ||
        Math.abs(currentY - longPressTimer.startY) > threshold
      ) {
        clearTimeout(longPressTimer.timer);
        setLongPressTimer(null);
      }
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

    // Subscribe to socket events for message deletion
    subscribeToMessages();

    // Clear multi-select state when changing users
    setIsMultiSelectMode(false);
    setSelectedMessages(new Set());

    // Reset the message count ref for the new conversation
    prevMessageCountRef.current = 0;

    // Cleanup subscription when component unmounts or user changes
    return () => {
      unsubscribeFromMessages();
    };
  }, [
    selectedUser._id,
    getMessages,
    subscribeToMessages,
    unsubscribeFromMessages,
  ]);

  useEffect(() => {
    // Scroll to bottom when messages are loaded or new messages arrive
    const currentMessageCount = messages?.length || 0;

    if (messageEndRef.current && currentMessageCount > 0) {
      // If this is the first time loading messages (prevMessageCountRef is 0)
      // or if we're returning to a chat, scroll immediately to bottom
      if (prevMessageCountRef.current === 0) {
        // Use setTimeout to ensure DOM is fully rendered
        setTimeout(() => {
          if (messageEndRef.current) {
            messageEndRef.current.scrollIntoView({ behavior: "instant" });
          }
        }, 100);
      }
      // If new messages were truly added, scroll smoothly
      else if (currentMessageCount > prevMessageCountRef.current) {
        messageEndRef.current.scrollIntoView({ behavior: "smooth" });
      }
    }

    // Always update the count after checking
    prevMessageCountRef.current = currentMessageCount;
  }, [messages]);

  // Additional useEffect to ensure scroll to bottom on component mount
  useEffect(() => {
    if (messages?.length > 0 && messageEndRef.current) {
      setTimeout(() => {
        if (messageEndRef.current) {
          messageEndRef.current.scrollIntoView({ behavior: "instant" });
        }
      }, 200);
    }
  }, [messages?.length]);

  // Cleanup long press timer on unmount
  useEffect(() => {
    return () => {
      if (longPressTimer && longPressTimer.timer) {
        clearTimeout(longPressTimer.timer);
      }
    };
  }, [longPressTimer]);

  // Handle scroll detection for showing/hiding jump to bottom button
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      // Show button if user is not near the bottom (100px threshold)
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShowScrollButton(!isNearBottom);
    };

    // Initial check
    handleScroll();

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [messages]); // Add messages dependency to re-run when messages change

  // Function to scroll to bottom
  const scrollToBottom = () => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

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

      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 relative"
      >
        {/* Multi-select mode indicator - positioned as overlay */}
        {isMultiSelectMode && (
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 z-30 bg-[#3b3346]/95 border border-violet-400/30 rounded-lg px-4 py-2 backdrop-blur-sm shadow-lg">
            <div className="flex items-center gap-2 text-violet-400 text-sm">
              <svg
                className="w-4 h-4"
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
                {selectedMessages.size} selected
              </span>
              {selectedMessages.size === 0 && (
                <span className="text-xs text-violet-300/70 ml-1">
                  • Click messages to select
                </span>
              )}
            </div>
          </div>
        )}

        {messages.map((message, index) => {
          const isMyMessage = message.senderId === authUser._id;
          const isSelected = selectedMessages.has(message._id);
          const isLastMessage = index === messages.length - 1;

          return (
            <div
              key={message._id}
              className={`chat ${isMyMessage ? "chat-end" : "chat-start"} ${
                isMultiSelectMode ? "relative cursor-pointer" : ""
              }`}
              ref={isLastMessage ? messageEndRef : null}
              onClick={() => {
                if (isMultiSelectMode) {
                  toggleMessageSelection(message._id);
                }
              }}
            >
              {/* Selection checkbox - show for all messages in multi-select mode */}
              {isMultiSelectMode && (
                <div
                  className={`absolute top-1/2 transform -translate-y-1/2 z-20 ${
                    isMyMessage ? "left-2" : "right-2"
                  }`}
                >
                  <div
                    className={`p-1.5 rounded-full transition-all duration-200 ${
                      isSelected
                        ? "bg-violet-500 text-white shadow-lg"
                        : "bg-base-200/80 hover:bg-base-300/80 backdrop-blur-sm"
                    }`}
                  >
                    <input
                      type="checkbox"
                      className={`checkbox checkbox-xs border-2 transition-all duration-200 ${
                        isSelected
                          ? "checkbox-primary border-white"
                          : "checkbox-ghost border-base-content/50 hover:border-violet-400"
                      }`}
                      checked={isSelected}
                      onChange={(e) => {
                        e.stopPropagation();
                        toggleMessageSelection(message._id);
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
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
              <div
                className={`chat-bubble flex flex-col ${getSentimentColorClass(
                  message.sentiment
                )} cursor-pointer select-none transition-all duration-200 rounded-xl shadow-lg ${
                  message.isPending ? "opacity-70 animate-pulse" : ""
                } ${
                  isMultiSelectMode && isSelected
                    ? "ring-2 ring-violet-400 ring-opacity-60 border border-violet-400/50"
                    : ""
                } ${
                  isMultiSelectMode && !isSelected
                    ? "opacity-60 hover:opacity-80"
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
                onMouseUp={() => {
                  if (!isMultiSelectMode) {
                    handleLongPressEnd();
                  }
                }}
                onMouseMove={(e) => {
                  if (!isMultiSelectMode) {
                    handleLongPressMove(e);
                  }
                }}
                onMouseLeave={() => {
                  if (!isMultiSelectMode) {
                    handleLongPressEnd();
                  }
                }}
                onTouchStart={(e) => {
                  if (!isMultiSelectMode) {
                    handleLongPressStart(message, e);
                  }
                }}
                onTouchEnd={() => {
                  if (!isMultiSelectMode) {
                    handleLongPressEnd();
                  }
                }}
                onTouchMove={(e) => {
                  if (!isMultiSelectMode) {
                    handleLongPressMove(e);
                  }
                }}
                onTouchCancel={() => {
                  if (!isMultiSelectMode) {
                    handleLongPressEnd();
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
              <div className="chat-footer opacity-50">
                <time className="text-xs">
                  {formatMessageTime(message.createdAt)}
                </time>
              </div>
            </div>
          );
        })}

        {/* Invisible element to maintain scroll position */}
        <div ref={messageEndRef} />
      </div>

      {/* Jump to Bottom Button */}
      {showScrollButton && (
        <div className="relative">
          <button
            onClick={scrollToBottom}
            className="absolute right-4 -top-16 bg-violet-500/90 hover:bg-violet-600 text-white p-3 rounded-full shadow-lg backdrop-blur-sm transition-all duration-200 hover:scale-110 z-10 border border-violet-400/20"
            title="Jump to latest messages"
          >
            <ChevronDown className="w-5 h-5" />
          </button>
        </div>
      )}

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

      {/* --- SENTIMENT ANALYSIS GRAPH MODAL --- */}
      {showStatsModal && (
        <SentimentLineGraph
          isOpen={showStatsModal}
          onClose={() => setShowStatsModal(false)}
          onBack={() => setShowStatsModal(false)}
        />
      )}

      {/* Context Menu */}
      <MessageContextMenu
        x={contextMenu.x}
        y={contextMenu.y}
        isVisible={contextMenu.visible}
        messageText={contextMenu.messageText}
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

      {/* Mental Health Companion - Only visible to current user */}
      {mentalHealthCompanion && mentalHealthCompanion.isVisible && (
        <MentalHealthCompanion
          message={mentalHealthCompanion.message}
          type={mentalHealthCompanion.type}
          triggerId={mentalHealthCompanion.id}
          onDismiss={dismissCompanionMessage}
        />
      )}
    </div>
  );
};
export default ChatContainer;
