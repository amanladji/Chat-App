

import { BarChart2, X } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";

const ChatHeader = ({ onOpenStats }) => {
  const { selectedUser, setSelectedUser } = useChatStore();
  const { onlineUsers } = useAuthStore();

  return (
    <div className='p-2.5 border-b border-base-300'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-3'>
          <div className='avatar'>
            <div className='size-10 rounded-full relative'>
              <img src={selectedUser.profilePic || "/avatar.png"} alt={selectedUser.fullName} />
            </div>
          </div>

          <div>
            <h3 className='font-medium'>{selectedUser.fullName}</h3>
            <p className='text-sm text-base-content/70'>
              {onlineUsers.includes(selectedUser._id) ? "Online" : "Offline"}
            </p>
          </div>
        </div>

        <div className='flex items-center gap-2'>
          {/* --- NEW STATS BUTTON --- */}
          <button className='btn btn-ghost btn-sm btn-circle' onClick={onOpenStats}>
            <BarChart2 className='size-5' />
          </button>
          
          <button className='btn btn-ghost btn-sm btn-circle' onClick={() => setSelectedUser(null)}>
            <X className='size-6' />
          </button>
        </div>
      </div>
    </div>
  );
};
export default ChatHeader;