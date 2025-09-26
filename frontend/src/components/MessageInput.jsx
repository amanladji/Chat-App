import { useRef, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { Image, Send, X, Smile } from "lucide-react";
import toast from "react-hot-toast";

const MessageInput = () => {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const fileInputRef = useRef(null);
  const { sendMessage } = useChatStore();

  // Curated emoji collection - universally supported emojis only
  const commonEmojis = [
    // Happy & Positive
    "😀",
    "😃",
    "😄",
    "😁",
    "😆",
    "😅",
    "🤣",
    "😂",
    "🙂",
    "🙃",
    "😉",
    "😊",
    "😇",
    "🥰",
    "😍",
    "🤩",
    "😘",
    "😗",
    "😚",
    "😙",
    "😋",
    "😛",
    "😜",
    "🤪",
    "😎",
    "🤓",
    "🤗",
    "🤭",
    "🤫",
    "🤔",

    // Angry & Negative
    "😠",
    "😡",
    "🤬",
    "😤",
    "😣",
    "👿",
    "💀",
    "☠️",
    "😈",
    "🔥",
    "💢",
    "💯",
    "😰",
    "😨",
    "😭",
    "😢",
    "🥺",
    "😟",
    "😞",
    "😔",
    "😕",
    "🙁",
    "☹️",
    "😣",
    "😖",
    "😫",
    "😩",
    "🥱",
    "😪",
    "😴",
    "🤤",

    // Neutral & Others
    "😐",
    "😑",
    "😶",
    "😏",
    "😒",
    "🙄",
    "😬",
    "🤐",
    "😌",
    "😴",
    "😷",
    "🤒",
    "🤕",
    "🤧",
    "🥵",
    "🥶",
    "🥴",
    "😵",
    "🤯",
    "🤠",
    "🥳",
    "🤡",

    // Hearts & Symbols
    "❤️",
    "🧡",
    "💛",
    "💚",
    "💙",
    "💜",
    "🖤",
    "🤍",
    "🤎",
    "💔",
    "❣️",
    "💕",
    "💞",
    "💓",
    "💗",
    "💖",
    "💘",
    "💝",
    "🔥",
    "⭐",
    "✨",
    "💎",
    "💯",
    "⚡",

    // Gestures & Body
    "👍",
    "👎",
    "👌",
    "✌️",
    "🤞",
    "🤟",
    "🤘",
    "🤙",
    "👈",
    "👉",
    "👆",
    "👇",
    "☝️",
    "✋",
    "🤚",
    "🖐",
    "🖖",
    "👋",
    "🤏",
    "💪",
    "🦵",
    "🦶",
    "👂",
    "👀",
    "🧠",
    "👅",
    "👄",
    "💋",
    "🦷",
    "👃",

    // Celebration & Party
    "🎉",
    "🎊",
    "🥳",
    "🎈",
    "🎁",
    "🎂",
    "🍰",
    "🧁",
    "🥂",
    "🍻",
    "🍾",
    "🎆",
    "🎇",
    "✨",
    "🌟",
    "💫",

    // Animals & Nature
    "🐶",
    "🐱",
    "🐭",
    "🐹",
    "🐰",
    "🦊",
    "🐻",
    "🐼",
    "🐨",
    "🐯",
    "🦁",
    "🐮",
    "🐷",
    "🐸",
    "🐵",
    "🙈",
    "🙉",
    "🙊",
    "🐒",
    "🐔",
    "🐧",
    "🐦",
    "🐤",
    "🐣",

    // Food & Drinks
    "🍕",
    "🍔",
    "🍟",
    "🌭",
    "🥪",
    "🌮",
    "🌯",
    "🥙",
    "🥘",
    "🍝",
    "🍜",
    "🍲",
    "🍛",
    "🍱",
    "🍘",
    "🍙",
    "🍞",
    "🥖",
    "🥨",
    "🧀",
    "🥚",
    "🍳",
    "🥓",
    "🥩",
  ];

  const handleEmojiClick = (emoji) => {
    setText((prev) => prev + emoji);
    // Don't close picker automatically - let user select multiple emojis
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() && !imagePreview) return;

    // Store the message data before clearing the form
    const messageData = {
      text: text.trim(),
      image: imagePreview,
    };

    // Clear form immediately for better UX (no delay)
    setText("");
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";

    // Send message in background - UI will update via socket when message is received
    try {
      await sendMessage(messageData);
    } catch (error) {
      console.error("Failed to send message:", error);
      // Optionally restore the form data if sending failed
      setText(messageData.text);
      if (messageData.image) {
        setImagePreview(messageData.image);
      }
    }
  };

  return (
    <div className="p-4 w-full bg-[#2a2434]/80 border-t border-zinc-700/50 relative">
      {/* Compact Emoji Picker */}
      {showEmojiPicker && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowEmojiPicker(false)}
          />

          {/* Compact Emoji Panel */}
          <div className="absolute bottom-16 left-4 bg-[#3b3346] border border-violet-400/20 rounded-xl p-3 shadow-xl z-50 w-72 animate-in slide-in-from-bottom-3 duration-200">
            {/* Simple header with close button */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-zinc-300">Emojis</span>
              <button
                type="button"
                className="p-1 rounded-full hover:bg-zinc-600/50 text-zinc-400 hover:text-white transition-colors"
                onClick={() => setShowEmojiPicker(false)}
              >
                <X className="size-3" />
              </button>
            </div>

            {/* Compact Emoji Grid */}
            <div className="grid grid-cols-8 gap-1 max-h-32 overflow-y-auto scrollbar-thin scrollbar-thumb-violet-400/20 scrollbar-track-transparent">
              {commonEmojis.map((emoji, index) => (
                <button
                  key={index}
                  type="button"
                  className="text-lg hover:bg-violet-400/10 hover:scale-110 rounded-md p-1.5 transition-all duration-150 active:scale-95 flex items-center justify-center min-h-[32px]"
                  onClick={() => handleEmojiClick(emoji)}
                >
                  {emoji}
                </button>
              ))}
            </div>

            {/* Simple footer */}
            <div className="mt-2 pt-2 border-t border-zinc-600/20">
              <p className="text-xs text-zinc-400 text-center">
                Click multiple emojis • {commonEmojis.length} available
              </p>
            </div>
          </div>
        </>
      )}

      {imagePreview && (
        <div className="mb-3 flex items-center gap-2">
          <div className="relative">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-20 h-20 object-cover rounded-lg border border-zinc-600/50"
            />
            <button
              onClick={removeImage}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-zinc-700/80 text-white hover:bg-zinc-600
              flex items-center justify-center transition-colors"
              type="button"
            >
              <X className="size-3" />
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSendMessage} className="flex items-center gap-2">
        <div className="flex-1 flex gap-2">
          <input
            type="text"
            className="w-full bg-[#3b3346] border border-zinc-600/50 rounded-lg px-4 py-2 text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-violet-400/50 focus:border-violet-400/50 transition-all"
            placeholder="Type a message..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleImageChange}
          />

          <button
            type="button"
            className={`hidden sm:flex p-2.5 rounded-full transition-all duration-200 group relative overflow-hidden ${
              showEmojiPicker
                ? "text-yellow-400 bg-yellow-400/20 shadow-lg shadow-yellow-400/20 scale-110"
                : "text-zinc-400 hover:text-yellow-400 hover:bg-yellow-400/10 hover:scale-105"
            }`}
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          >
            {/* Background glow effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/0 to-yellow-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full"></div>
            <Smile
              className={`size-5 relative z-10 transition-transform duration-200 ${
                showEmojiPicker ? "rotate-12 scale-110" : "group-hover:rotate-6"
              }`}
            />

            {/* Pulse animation when active */}
            {showEmojiPicker && (
              <div className="absolute inset-0 border-2 border-yellow-400/40 rounded-full animate-ping"></div>
            )}
          </button>

          <button
            type="button"
            className={`hidden sm:flex p-2 rounded-full transition-colors
                     ${
                       imagePreview
                         ? "text-emerald-400 bg-emerald-400/10 hover:bg-emerald-400/20"
                         : "text-zinc-400 hover:text-violet-400 hover:bg-violet-400/10"
                     }`}
            onClick={() => fileInputRef.current?.click()}
          >
            <Image size={20} />
          </button>
        </div>
        <button
          type="submit"
          className="p-2 rounded-full bg-violet-500 text-white hover:bg-violet-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!text.trim() && !imagePreview}
        >
          <Send size={22} />
        </button>
      </form>
    </div>
  );
};
export default MessageInput;
