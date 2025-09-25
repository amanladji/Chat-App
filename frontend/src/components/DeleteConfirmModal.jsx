import { AlertTriangle, Trash2, Users, User } from "lucide-react";
import { useState } from "react";

const DeleteConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  messagePreview,
  messageData = null, // Full message object
  currentUserId,
  isDeleting = false,
}) => {
  const [deleteType, setDeleteType] = useState("forMe");

  // Check if current user is the sender of this message
  const canDeleteForEveryone =
    messageData && messageData.senderId === currentUserId;

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm(deleteType);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-base-100 rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-shrink-0">
              <AlertTriangle className="size-8 text-warning" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Delete Message</h3>
              <p className="text-sm text-base-content/70">
                Choose how to delete this message
              </p>
            </div>
          </div>

          {messagePreview && (
            <div className="bg-base-200 rounded-lg p-3 mb-4 max-h-20 overflow-hidden">
              <p className="text-sm text-base-content/70 truncate">
                &quot;{messagePreview}&quot;
              </p>
            </div>
          )}

          {/* Delete Type Selection */}
          <div className="space-y-3 mb-6">
            {/* Delete for Me */}
            <div
              className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                deleteType === "forMe"
                  ? "border-primary bg-primary/10"
                  : "border-base-300 hover:border-base-content/20"
              }`}
              onClick={() => setDeleteType("forMe")}
            >
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="deleteType"
                  value="forMe"
                  checked={deleteType === "forMe"}
                  onChange={() => setDeleteType("forMe")}
                  className="radio radio-primary"
                />
                <User className="size-5 text-primary" />
                <div className="flex-1">
                  <div className="font-medium">Delete for me</div>
                  <div className="text-sm text-base-content/70">
                    Remove from your chat only
                  </div>
                </div>
              </div>
            </div>

            {/* Delete for Everyone */}
            <div
              className={`border-2 rounded-lg p-4 transition-colors ${
                canDeleteForEveryone
                  ? `cursor-pointer ${
                      deleteType === "forEveryone"
                        ? "border-error bg-error/10"
                        : "border-base-300 hover:border-base-content/20"
                    }`
                  : "border-base-300 bg-base-200 opacity-50 cursor-not-allowed"
              }`}
              onClick={() =>
                canDeleteForEveryone && setDeleteType("forEveryone")
              }
            >
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="deleteType"
                  value="forEveryone"
                  checked={deleteType === "forEveryone"}
                  onChange={() => setDeleteType("forEveryone")}
                  disabled={!canDeleteForEveryone}
                  className="radio radio-error"
                />
                <Users
                  className={`size-5 ${
                    canDeleteForEveryone ? "text-error" : "text-base-content/50"
                  }`}
                />
                <div className="flex-1">
                  <div className="font-medium">Delete for everyone</div>
                  <div className="text-sm text-base-content/70">
                    {canDeleteForEveryone
                      ? "Remove for both you and recipient"
                      : "Only available for messages you sent"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <button
              className="btn btn-ghost"
              onClick={onClose}
              disabled={isDeleting}
            >
              Cancel
            </button>
            <button
              className={`btn ${
                deleteType === "forEveryone" ? "btn-error" : "btn-warning"
              }`}
              onClick={handleConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <span className="loading loading-spinner loading-sm" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="size-4" />
                  Delete{" "}
                  {deleteType === "forEveryone" ? "for Everyone" : "for Me"}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;
