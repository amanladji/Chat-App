import { useRef, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { Image, Send, X } from "lucide-react";
import toast from "react-hot-toast";

const MessageInput = () => {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);
  const { sendMessage } = useChatStore();

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
    <div className="p-4 w-full bg-[#2a2434]/80 border-t border-zinc-700/50">
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
