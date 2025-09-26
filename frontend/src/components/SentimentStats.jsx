import { BarChart2, TrendingUp } from "lucide-react";
import { useChatStore } from "../store/useChatStore";
import { useEffect, useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import SentimentLineGraph from "./SentimentLineGraph";

const SENTIMENT_CONFIG = {
  POSITIVE: { emoji: "😊", color: "text-success" },
  NEGATIVE: { emoji: "😠", color: "text-error" },
  NEUTRAL: { emoji: "😐", color: "text-info" },
  HELP: { emoji: "🤔", color: "text-warning" },
};

const StatCard = ({ title, stats }) => {
  const total = Object.values(stats).reduce((sum, count) => sum + count, 0);

  return (
    <div className='bg-base-200 p-4 rounded-lg flex-1'>
      <h3 className='text-lg font-bold mb-4'>{title}</h3>
      {total === 0 ? (
        <p className='text-sm text-base-content/60'>No messages to analyze.</p>
      ) : (
        <div className='space-y-2'>
          {Object.entries(SENTIMENT_CONFIG).map(([sentiment, config]) =>
            stats[sentiment] ? (
              <div key={sentiment} className='flex justify-between items-center'>
                <span className={`flex items-center gap-2 font-medium ${config.color}`}>
                  {config.emoji} {sentiment}
                </span>
                <span className='font-mono font-bold'>{stats[sentiment]}</span>
              </div>
            ) : null
          )}
        </div>
      )}
    </div>
  );
};

const SentimentStats = ({ onClose, isOpen = true }) => {
  const { selectedUser, getSentimentStats, stats, isStatsLoading } = useChatStore();
  const { authUser } = useAuthStore();
  const [showLineGraph, setShowLineGraph] = useState(false);

  useEffect(() => {
    if (selectedUser) {
      getSentimentStats(selectedUser._id);
    }
  }, [selectedUser, getSentimentStats]);

  // If line graph is showing, render it instead
  if (showLineGraph) {
    return (
      <SentimentLineGraph
        isOpen={showLineGraph}
        onClose={onClose}
        onBack={() => setShowLineGraph(false)}
      />
    );
  }

  // Don't render if not open
  if (!isOpen) return null;

  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75'
      onClick={onClose}
    >
      <div
        className='bg-base-100 rounded-lg shadow-xl p-6 w-full max-w-2xl'
        onClick={(e) => e.stopPropagation()}
      >
        <div className='flex justify-between items-center border-b border-base-300 pb-3 mb-4'>
          <div className='flex items-center gap-2'>
            <BarChart2 className='text-primary' />
            <h2 className='text-xl font-bold'>Sentiment Statistics</h2>
          </div>
          <button className='btn btn-sm btn-circle btn-ghost' onClick={onClose}>
            &times;
          </button>
        </div>

        {isStatsLoading && <div className='text-center p-8'>Loading statistics...</div>}

        {stats && !isStatsLoading && (
          <div className='space-y-4'>
            <div className='flex flex-col md:flex-row gap-4'>
              <StatCard title={`Your Messages to ${selectedUser.fullName.split(" ")[0]}`} stats={stats.myStats} />
              <StatCard title={`${selectedUser.fullName.split(" ")[0]}'s Messages to You`} stats={stats.theirStats} />
            </div>
            
            {/* Sentiment Line Graph Button */}
            <div className='border-t border-base-300 pt-4'>
              <div className='flex justify-center'>
                <button 
                  className='btn btn-primary gap-2 btn-wide'
                  onClick={() => setShowLineGraph(true)}
                >
                  <TrendingUp size={18} />
                  View Sentiment Over Time
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Show button even when no stats available */}
        {(!stats || (stats && Object.keys(stats.myStats || {}).length === 0 && Object.keys(stats.theirStats || {}).length === 0)) && !isStatsLoading && (
          <div className='space-y-4'>
            <div className='text-center p-8'>
              <p className='text-base-content/60 mb-4'>No sentiment data available yet.</p>
              <p className='text-sm text-base-content/40 mb-6'>Start chatting to see sentiment analysis!</p>
              
              <button 
                className='btn btn-primary gap-2'
                onClick={() => setShowLineGraph(true)}
              >
                <TrendingUp size={18} />
                View Sentiment Over Time
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SentimentStats;