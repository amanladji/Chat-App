import { useEffect } from "react";
import toast from "react-hot-toast";

const MessageContextMenu = ({
  x,
  y,
  onClose,
  onDelete,
  isVisible,
  messageText,
}) => {
  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(messageText);
      toast.success("Message copied to clipboard");
      onClose();
    } catch {
      // Fallback for older browsers
      try {
        const textArea = document.createElement("textarea");
        textArea.value = messageText;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
        toast.success("Message copied to clipboard");
        onClose();
      } catch {
        toast.error("Failed to copy message");
      }
    }
  };
  useEffect(() => {
    const handleClickOutside = () => {
      onClose();
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    if (isVisible) {
      document.addEventListener("click", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("click", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  return (
    <div
      className="fixed z-50 bg-[#1f1a27] border border-[#3b3346] rounded-lg shadow-lg py-2 min-w-[140px]"
      style={{
        left: `${x}px`,
        top: `${y}px`,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        className="w-full px-4 py-2 text-left text-zinc-300 hover:bg-[#2a2434] hover:text-zinc-100 flex items-center gap-2 transition-colors"
        onClick={handleCopyMessage}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
          />
        </svg>
        Copy Message
      </button>
      <button
        className="w-full px-4 py-2 text-left text-red-400 hover:bg-[#2a2434] hover:text-red-300 flex items-center gap-2 transition-colors"
        onClick={() => {
          onDelete();
          onClose();
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
          />
        </svg>
        Delete Message
      </button>
    </div>
  );
};

export default MessageContextMenu;
