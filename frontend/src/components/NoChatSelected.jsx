const NoChatSelected = () => {
  return (
    <div className="w-full flex flex-1 flex-col items-center justify-center p-16 bg-[#1f1a27]/95">
      <div className="max-w-md text-center space-y-6">
        {/* Icon Display */}
        <div className="flex justify-center gap-4 mb-4">
          <div className="relative">
            <div className="w-16 h-16 flex items-center justify-center animate-bounce">
              <img 
                src="/sentio-logo.png" 
                alt="Sentio Logo" 
                className="w-16 h-16 rounded-2xl"
              />
            </div>
          </div>
        </div>

        {/* Welcome Text */}
        <h2 className="text-2xl font-bold text-zinc-100">Welcome to Sentio!</h2>
        <p className="text-zinc-400">
          Realtime Chat & Sentiment Analysis
        </p>
        <p className="text-zinc-400">
          Select a conversation from the sidebar to start chatting
        </p>
      </div>
    </div>
  );
};

export default NoChatSelected;
