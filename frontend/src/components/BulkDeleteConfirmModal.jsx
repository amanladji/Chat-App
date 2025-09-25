import { AlertTriangle, Trash2, Users, User } from "lucide-react";
import { useState } from "react";

const BulkDeleteConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  selectedCount,
  isDeleting,
  selectedMessages = [], // Array of message objects
  currentUserId,
}) => {
  const [deleteType, setDeleteType] = useState("forMe");

  // Check if any selected messages are sent by current user
  const userSentMessages = selectedMessages.filter(
    (msg) => msg.senderId === currentUserId
  );
  const canDeleteForEveryone = userSentMessages.length > 0;

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm(deleteType);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={!isDeleting ? onClose : undefined}
      />

      {/* Modal */}
      <div className="relative bg-base-100 rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-shrink-0">
            <AlertTriangle className="size-8 text-warning" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Delete Messages</h3>
            <p className="text-sm text-base-content/70">
              Choose how to delete {selectedCount} message
              {selectedCount !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

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
            onClick={() => canDeleteForEveryone && setDeleteType("forEveryone")}
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

        {/* Warning Info */}
        <div className="bg-base-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-3">
            <Trash2 className="size-6 text-warning" />
            <div>
              <div className="font-medium text-warning">
                {deleteType === "forEveryone"
                  ? `Delete ${selectedCount} message${
                      selectedCount !== 1 ? "s" : ""
                    } for everyone?`
                  : `Delete ${selectedCount} message${
                      selectedCount !== 1 ? "s" : ""
                    } for you?`}
              </div>
              <div className="text-sm text-base-content/70 mt-1">
                {deleteType === "forEveryone"
                  ? "This will permanently remove the messages for both you and the recipient."
                  : "The other person will still see these messages."}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="btn btn-ghost"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isDeleting}
            className={`btn ${
              deleteType === "forEveryone" ? "btn-error" : "btn-warning"
            }`}
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
  );
};

export default BulkDeleteConfirmModal;
