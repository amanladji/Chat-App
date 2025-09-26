import { useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { useChatStore } from '../store/useChatStore';
import { useAuthStore } from '../store/useAuthStore';
import { formatMessageTime } from '../lib/utils';
import { TrendingUp, Activity, ArrowLeft } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const SentimentLineGraph = ({ isOpen, onClose, onBack }) => {
  const { messages, users, selectedUser } = useChatStore();
  const { authUser } = useAuthStore();
  const [messageLimit, setMessageLimit] = useState('25');

  const getSentimentScore = (sentiment) => {
    switch (sentiment?.toLowerCase()) {
      case 'positive': return 1;
      case 'neutral': return 0;
      case 'negative': return -1;
      default: return 0;
    }
  };

  const filterMessagesByLimit = (messages) => {
    const limit = parseInt(messageLimit);
    return messages
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
      .slice(-limit);
  };

  const generateIndividualChartData = (userId, userType) => {
    if (!selectedUser || !messages) return null;

    // Get messages from specific user
    const userMessages = messages.filter(msg => 
      msg.senderId === userId &&
      ((msg.senderId === authUser._id && msg.receiverId === selectedUser._id) ||
       (msg.senderId === selectedUser._id && msg.receiverId === authUser._id)) &&
      msg.sentiment
    );
    
    // For individual charts, take half of the selected limit for each person
    const individualLimit = Math.floor(parseInt(messageLimit) / 2);
    const sortedMessages = userMessages
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
      .slice(-individualLimit);
    
    if (sortedMessages.length === 0) {
      return null;
    }

    const labels = sortedMessages.map((msg, index) => {
      return `Msg ${index + 1}`;
    });

    const sentimentData = sortedMessages.map(msg => getSentimentScore(msg.sentiment));
    
    const color = userType === 'sender' ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)'; // Green for sender, Red for receiver
    const bgColor = userType === 'sender' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)';

    return {
      labels,
      datasets: [
        {
          label: `${userType === 'sender' ? 'Your' : selectedUser?.fullName + "'s"} Sentiment`,
          data: sentimentData,
          borderColor: color,
          backgroundColor: bgColor,
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: color,
          pointBorderColor: 'rgb(255, 255, 255)',
          pointBorderWidth: 1,
          pointRadius: 2,
          pointHoverRadius: 4,
        },
      ],
    };
  };

  const generateChartData = () => {
    if (!selectedUser || !messages) return null;

    // Get messages between current user and selected user
    const chatMessages = messages.filter(msg => 
      ((msg.senderId === authUser._id && msg.receiverId === selectedUser._id) ||
       (msg.senderId === selectedUser._id && msg.receiverId === authUser._id)) &&
      msg.sentiment
    );
    
    // For combined chart, use the full selected limit
    const sortedMessages = chatMessages
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
      .slice(-parseInt(messageLimit));
    
    if (sortedMessages.length === 0) {
      return null;
    }

    const labels = sortedMessages.map((msg, index) => {
      return `Msg ${index + 1}`;
    });

    const sentimentData = sortedMessages.map(msg => getSentimentScore(msg.sentiment));

    return {
      labels,
      datasets: [
        {
          label: 'Overall Conversation Sentiment',
          data: sentimentData,
          borderColor: 'rgb(139, 92, 246)',
          backgroundColor: 'rgba(139, 92, 246, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: 'rgb(139, 92, 246)',
          pointBorderColor: 'rgb(255, 255, 255)',
          pointBorderWidth: 1,
          pointRadius: 2,
          pointHoverRadius: 4,
        },
      ],
    };
  };

  // Calculate overall sentiment statistics for the conversation
  // Calculate overall sentiment statistics for the conversation
  const calculateOverallStats = () => {
    if (!selectedUser || !messages) return null;

    const chatMessages = messages.filter(msg => 
      ((msg.senderId === authUser._id && msg.receiverId === selectedUser._id) ||
       (msg.senderId === selectedUser._id && msg.receiverId === authUser._id)) &&
      msg.sentiment
    );

    const limitedMessages = chatMessages
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
      .slice(-parseInt(messageLimit));
    
    if (limitedMessages.length === 0) return null;

    const sentimentCounts = { positive: 0, negative: 0, neutral: 0 };
    let totalSentiment = 0;

    limitedMessages.forEach(msg => {
      const score = getSentimentScore(msg.sentiment);
      totalSentiment += score;
      
      if (score > 0.3) sentimentCounts.positive++;
      else if (score < -0.3) sentimentCounts.negative++;
      else sentimentCounts.neutral++;
    });

    const avgSentiment = totalSentiment / limitedMessages.length;
    const totalMessages = limitedMessages.length;

    return {
      avgSentiment: avgSentiment.toFixed(2),
      totalMessages,
      sentimentCounts,
      overallMood: avgSentiment > 0.2 ? 'Positive' : 
                   avgSentiment < -0.2 ? 'Negative' : 'Neutral'
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(31, 26, 39, 0.95)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        cornerRadius: 8,
        callbacks: {
          label: function(context) {
            const value = context.parsed.y;
            const sentiment = value > 0.3 ? 'Positive' : 
                            value < -0.3 ? 'Negative' : 'Neutral';
            return `Sentiment: ${sentiment} (${value.toFixed(2)})`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
          maxTicksLimit: 8,
        },
      },
      y: {
        min: -1,
        max: 1,
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
          callback: function(value) {
            if (value === 1) return 'Positive';
            if (value === 0) return 'Neutral';
            if (value === -1) return 'Negative';
            return value.toFixed(1);
          }
        },
      },
    },
    elements: {
      point: {
        hoverBackgroundColor: 'rgb(139, 92, 246)',
      }
    }
  };

  const chartData = generateChartData();
  const senderChartData = generateIndividualChartData(authUser._id, 'sender');
  const receiverChartData = generateIndividualChartData(selectedUser?._id, 'receiver');
  const overallStats = calculateOverallStats();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-[#1f1a27]/90 backdrop-blur-xl rounded-2xl ring-1 ring-white/10 shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-[#1f1a27]/95 backdrop-blur-xl flex items-center justify-between p-6 border-b border-white/10 z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-white transition-colors"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="p-2 rounded-lg bg-violet-500/20">
              <TrendingUp className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Conversation Sentiment Analysis</h2>
              <p className="text-sm text-zinc-400">Overall sentiment trends with {selectedUser?.fullName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="p-6 pb-8 space-y-8">
          {/* Message Limit Controls */}
          <div className="flex justify-center">
            <div className="flex rounded-lg bg-[#2a2434] p-1 border border-white/10">
              {[
                { value: '25', label: '25 msgs' },
                { value: '50', label: '50 msgs' },
                { value: '100', label: '100 msgs' }
              ].map(option => (
                <button
                  key={option.value}
                  onClick={() => setMessageLimit(option.value)}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                    messageLimit === option.value
                      ? 'bg-violet-500 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Overall Statistics Cards */}
          {overallStats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-[#2a2434]/50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-white">{overallStats.totalMessages}</div>
                <div className="text-sm text-zinc-400">Total Messages</div>
              </div>
              <div className="bg-[#2a2434]/50 rounded-lg p-4 text-center">
                <div className={`text-2xl font-bold ${
                  overallStats.overallMood === 'Positive' ? 'text-green-400' :
                  overallStats.overallMood === 'Negative' ? 'text-red-400' : 'text-yellow-400'
                }`}>
                  {overallStats.overallMood}
                </div>
                <div className="text-sm text-zinc-400">Overall Mood</div>
              </div>
              <div className="bg-[#2a2434]/50 rounded-lg p-4 text-center">
                <div className={`text-2xl font-bold ${
                  parseFloat(overallStats.avgSentiment) > 0 ? 'text-green-400' :
                  parseFloat(overallStats.avgSentiment) < 0 ? 'text-red-400' : 'text-yellow-400'
                }`}>
                  {overallStats.avgSentiment}
                </div>
                <div className="text-sm text-zinc-400">Avg. Sentiment</div>
              </div>
              <div className="bg-[#2a2434]/50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-violet-400">
                  {Math.round((overallStats.sentimentCounts.positive / overallStats.totalMessages) * 100)}%
                </div>
                <div className="text-sm text-zinc-400">Positive Rate</div>
              </div>
            </div>
          )}

          {/* Individual Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Sender Chart */}
            <div className="bg-[#2a2434]/50 rounded-xl p-4 border border-white/5">
              {!senderChartData ? (
                <div className="flex flex-col items-center justify-center h-48 text-zinc-400">
                  <Activity className="w-8 h-8 mb-2 opacity-50" />
                  <p className="text-sm">No data for your messages</p>
                </div>
              ) : (
                <div className="h-56">
                  <div className="mb-3">
                    <h3 className="text-base font-medium text-white">
                      Your Sentiment Trends
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Last {Math.floor(parseInt(messageLimit) / 2)} messages from you
                    </p>
                  </div>
                  <div className="h-40">
                    <Line data={senderChartData} options={chartOptions} />
                  </div>
                </div>
              )}
            </div>

            {/* Receiver Chart */}
            <div className="bg-[#2a2434]/50 rounded-xl p-4 border border-white/5">
              {!receiverChartData ? (
                <div className="flex flex-col items-center justify-center h-48 text-zinc-400">
                  <Activity className="w-8 h-8 mb-2 opacity-50" />
                  <p className="text-sm">No data for {selectedUser?.fullName}'s messages</p>
                </div>
              ) : (
                <div className="h-56">
                  <div className="mb-3">
                    <h3 className="text-base font-medium text-white">
                      {selectedUser?.fullName}'s Sentiment Trends
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Last {Math.floor(parseInt(messageLimit) / 2)} messages from {selectedUser?.fullName}
                    </p>
                  </div>
                  <div className="h-40">
                    <Line data={receiverChartData} options={chartOptions} />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Combined Chart */}
          <div className="bg-[#2a2434]/50 rounded-xl p-4 border border-white/5">
            {!chartData ? (
              <div className="flex flex-col items-center justify-center h-64 text-zinc-400">
                <Activity className="w-12 h-12 mb-4 opacity-50" />
                <p className="text-lg">No sentiment data available</p>
                <p className="text-sm">
                  No messages with sentiment analysis found in the selected time range
                </p>
              </div>
            ) : (
              <div className="h-96">
                <div className="mb-4">
                  <h3 className="text-lg font-medium text-white">
                    Combined Conversation Sentiment Trends
                  </h3>
                  <p className="text-sm text-zinc-400">
                    Overall sentiment analysis for last {messageLimit} messages in conversation
                  </p>
                </div>
                <div className="h-80">
                  <Line data={chartData} options={chartOptions} />
                </div>
              </div>
            )}
          </div>

          {/* Legend */}
          {(chartData || senderChartData || receiverChartData) && (
            <div className="space-y-4 pb-4">
              {/* Chart Color Legend */}
              <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-zinc-300">Your Messages</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span className="text-zinc-300">{selectedUser?.fullName}'s Messages</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-violet-500"></div>
                  <span className="text-zinc-300">Combined Conversation</span>
                </div>
              </div>
              
              {/* Sentiment Range Legend */}
              <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-zinc-400">
                <span>Positive: 0.3 to 1.0</span>
                <span>•</span>
                <span>Neutral: -0.3 to 0.3</span>
                <span>•</span>
                <span>Negative: -1.0 to -0.3</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SentimentLineGraph;