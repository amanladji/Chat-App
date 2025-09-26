import { BarChart2, TrendingUp } from "lucide-react";
import { useChatStore } from "../store/useChatStore";
import { useEffect, useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import SentimentLineGraph from "./SentimentLineGraph";

const SentimentStats = ({ onClose, isOpen = true }) => {
  const { selectedUser } = useChatStore();
  const { authUser } = useAuthStore();
  const [showLineGraph, setShowLineGraph] = useState(false);
  const [messageLimit, setMessageLimit] = useState('25');

  // If line graph is showing, render it instead
  if (showLineGraph) {
    return (
      <SentimentLineGraph
        isOpen={showLineGraph}
        onClose={onClose}
        onBack={() => setShowLineGraph(false)}
        initialMessageLimit={messageLimit}
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
            <h2 className='text-xl font-bold'>Conversation Sentiment Analysis</h2>
          </div>
          
          {/* Message Limit Options */}
          <div className='flex items-center gap-2'>
            <div className='flex rounded-lg bg-base-200 p-1 border border-base-300'>
              {[
                { value: '25', label: '25' },
                { value: '50', label: '50' },
                { value: '100', label: '100' }
              ].map(option => (
                <button
                  key={option.value}
                  onClick={() => setMessageLimit(option.value)}
                  className={`px-3 py-1 rounded text-sm font-medium transition-all ${
                    messageLimit === option.value
                      ? 'bg-primary text-primary-content shadow-sm'
                      : 'text-base-content/60 hover:text-base-content hover:bg-base-300'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <span className='text-xs text-base-content/60'>msgs</span>
            <button className='btn btn-sm btn-circle btn-ghost ml-2' onClick={onClose}>
              &times;
            </button>
          </div>
        </div>

        {/* Show Sentiment Line Graph Button */}
        <div className='space-y-4'>
          <div className='text-center p-8'>
            <p className='text-base-content/60 mb-4'>View detailed sentiment analysis over time</p>
            
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
    </div>
  );
};

export default SentimentStats;