import { useChatStore } from "../store/useChatStore";
import { useEffect } from "react";

import Sidebar from "../components/Sidebar";
import NoChatSelected from "../components/NoChatSelected";
import ChatContainer from "../components/ChatContainer";

const HomePage = () => {
  const { selectedUser, subscribeToAllMessages, unsubscribeFromAllMessages } =
    useChatStore();

  // Subscribe to all messages globally for unread tracking
  useEffect(() => {
    subscribeToAllMessages();

    return () => unsubscribeFromAllMessages();
  }, [subscribeToAllMessages, unsubscribeFromAllMessages]);

  return (
    <div className="h-screen bg-gradient-to-b from-[#3c334b] to-[#2a2336] pt-16">
      <div className="h-full">
        <div className="bg-[#1f1a27] shadow-[0_8px_40px_-8px_rgba(0,0,0,0.45)] ring-1 ring-white/5 w-full h-full">
          <div className="flex h-full overflow-hidden">
            <Sidebar />

            {!selectedUser ? <NoChatSelected /> : <ChatContainer />}
          </div>
        </div>
      </div>
    </div>
  );
};
export default HomePage;
