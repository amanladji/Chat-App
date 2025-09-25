import { useEffect } from "react";
import { useFriendStore } from "../store/useFriendStore";
import { X, Check, XCircle } from "lucide-react";

const FriendRequestsModal = ({ isOpen, onClose }) => {
  const {
    pendingRequests,
    getPendingRequests,
    acceptFriendRequest,
    declineFriendRequest,
  } = useFriendStore();

  useEffect(() => {
    if (isOpen) {
      getPendingRequests();
    }
  }, [isOpen, getPendingRequests]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#1f1a27] rounded-3xl shadow-[0_8px_40px_-8px_rgba(0,0,0,0.45)] ring-1 ring-white/5 max-w-md w-full mx-4 max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-zinc-700/50">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-zinc-100">
              Friend Requests
            </h2>
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-white hover:bg-zinc-700/50 p-2 rounded-full transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Requests List */}
        <div className="p-6 max-h-96 overflow-y-auto">
          {pendingRequests.length > 0 ? (
            <div className="space-y-4">
              {pendingRequests.map((request) => (
                <div
                  key={request._id}
                  className="flex items-center justify-between p-4 bg-[#2a2434]/80 rounded-lg border border-zinc-700/50"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={request.requester.profilePic || "/avatar.png"}
                      alt={request.requester.fullName}
                      className="h-12 w-12 rounded-full object-cover border-2 border-zinc-600/50"
                    />
                    <div>
                      <p className="font-medium text-zinc-100">
                        {request.requester.fullName}
                      </p>
                      <p className="text-sm text-zinc-400">
                        {request.requester.email}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {new Date(request.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => acceptFriendRequest(request._id)}
                      className="flex items-center gap-1 px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      <Check className="h-4 w-4" />
                      Accept
                    </button>
                    <button
                      onClick={() => declineFriendRequest(request._id)}
                      className="flex items-center gap-1 px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      <XCircle className="h-4 w-4" />
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-zinc-400">No pending friend requests</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FriendRequestsModal;
