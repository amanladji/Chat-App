import { UserMinus, MessageCircle } from "lucide-react";

const ContactContextMenu = ({
  isOpen,
  onClose,
  position,
  friend,
  onSelectUser,
  onRemoveFriend,
}) => {
  if (!isOpen) return null;

  const handleStartChat = () => {
    onSelectUser(friend);
    onClose();
  };

  const handleRemoveFriend = () => {
    onRemoveFriend(friend);
    onClose();
  };

  return (
    <>
      {/* Backdrop to close menu */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      {/* Context Menu */}
      <div
        className="fixed bg-base-100 border border-base-300 rounded-lg shadow-lg py-1 z-50 min-w-32"
        style={{
          left: position.x,
          top: position.y,
          transform: "translate(-50%, 0)",
        }}
      >
        <button
          onClick={handleStartChat}
          className="flex items-center gap-2 px-3 py-2 hover:bg-base-200 w-full text-left text-sm"
        >
          <MessageCircle className="size-4" />
          Start Chat
        </button>

        <button
          onClick={handleRemoveFriend}
          className="flex items-center gap-2 px-3 py-2 hover:bg-base-200 w-full text-left text-sm text-red-600"
        >
          <UserMinus className="size-4" />
          Remove Friend
        </button>
      </div>
    </>
  );
};

export default ContactContextMenu;
