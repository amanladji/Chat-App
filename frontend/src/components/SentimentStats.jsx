import { BarChart2 } from "lucide-react";
import { useChatStore } from "../store/useChatStore";
import { useEffect } from "react";
import { useAuthStore } from "../store/useAuthStore";

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

const SentimentStats = ({ onClose }) => {
  const { selectedUser, getSentimentStats, stats, isStatsLoading } = useChatStore();
  const { authUser } = useAuthStore();

  useEffect(() => {
    if (selectedUser) {
      getSentimentStats(selectedUser._id);
    }
  }, [selectedUser, getSentimentStats]);

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
          <div className='flex flex-col md:flex-row gap-4'>
            <StatCard title={`Your Messages to ${selectedUser.fullName.split(" ")[0]}`} stats={stats.myStats} />
            <StatCard title={`${selectedUser.fullName.split(" ")[0]}'s Messages to You`} stats={stats.theirStats} />
          </div>
        )}
      </div>
    </div>
  );
};

export default SentimentStats;