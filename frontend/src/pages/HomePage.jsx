import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { useEffect } from "react";

import Sidebar from "../components/Sidebar";
import NoChatSelected from "../components/NoChatSelected";
import ChatContainer from "../components/ChatContainer";

const HomePage = () => {
  const { selectedUser, subscribeToAllMessages, unsubscribeFromAllMessages } =
    useChatStore();
  const { socket, authUser } = useAuthStore();

  // Subscribe to all messages globally for unread tracking
  useEffect(() => {
    console.log("🏠 HomePage mounting - setting up message subscriptions");

    // Function to attempt subscription
    const attemptSubscription = () => {
      if (socket && authUser) {
        console.log("✅ Socket and user available, subscribing to messages");
        subscribeToAllMessages();
      } else {
        console.log("⏳ Waiting for socket connection and auth...", {
          hasSocket: !!socket,
          hasAuth: !!authUser,
          socketConnected: socket?.connected,
        });
        // Retry after a delay for server environments
        setTimeout(attemptSubscription, 1000);
      }
    };

    attemptSubscription();

    return () => {
      console.log("🏠 HomePage unmounting - cleaning up subscriptions");
      unsubscribeFromAllMessages();
    };
  }, [subscribeToAllMessages, unsubscribeFromAllMessages, socket, authUser]);

  // Additional effect to handle socket connection changes
  useEffect(() => {
    if (socket?.connected && authUser) {
      console.log(
        "🔌 Socket reconnected, re-establishing message subscription"
      );
      subscribeToAllMessages();
    }
  }, [socket?.connected, authUser, subscribeToAllMessages]);

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
