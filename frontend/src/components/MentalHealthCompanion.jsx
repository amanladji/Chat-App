import { useState, useEffect } from "react";
import { Heart, Shield, MessageCircle, X } from "lucide-react";

const MentalHealthCompanion = ({ message, type, onDismiss, triggerId }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const [countdown, setCountdown] = useState(10); // Add countdown state

  // Auto-dismiss after 10 seconds with countdown
  useEffect(() => {
    const handleDismiss = () => {
      setIsAnimatingOut(true);
      setTimeout(() => {
        setIsVisible(false);
        onDismiss && onDismiss(triggerId);
      }, 300);
    };

    // Countdown timer
    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          handleDismiss();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Slide in animation
    const slideInTimer = setTimeout(() => {
      setIsVisible(true);
    }, 100);

    return () => {
      clearInterval(countdownInterval);
      clearTimeout(slideInTimer);
    };
  }, [onDismiss, triggerId]);

  const handleDismiss = () => {
    setIsAnimatingOut(true);
    setTimeout(() => {
      setIsVisible(false);
      onDismiss && onDismiss(triggerId);
    }, 300);
  };

  // Get appropriate icon based on message type
  const getIcon = () => {
    switch (type) {
      case "support":
        return <Heart className="h-5 w-5" />;
      case "suggestion":
        return <MessageCircle className="h-5 w-5" />;
      case "encouragement":
      default:
        return <Shield className="h-5 w-5" />;
    }
  };

  // Get appropriate styling based on message type
  const getGradientClass = () => {
    switch (type) {
      case "support":
        return "bg-gradient-to-r from-purple-600/90 to-pink-600/90";
      case "suggestion":
        return "bg-gradient-to-r from-blue-600/90 to-cyan-600/90";
      case "encouragement":
      default:
        return "bg-gradient-to-r from-emerald-600/90 to-teal-600/90";
    }
  };

  // Get border color based on message type
  const getBorderClass = () => {
    switch (type) {
      case "support":
        return "border-purple-400/50";
      case "suggestion":
        return "border-blue-400/50";
      case "encouragement":
      default:
        return "border-emerald-400/50";
    }
  };

  if (!isVisible && !isAnimatingOut) return null;

  return (
    <div
      className={`fixed top-20 right-4 max-w-sm z-50 transform transition-all duration-300 ease-out ${
        isVisible && !isAnimatingOut
          ? "translate-x-0 opacity-100"
          : "translate-x-full opacity-0"
      }`}
    >
      <div
        className={`${getGradientClass()} ${getBorderClass()} backdrop-blur-sm border rounded-xl p-4 shadow-lg ring-1 ring-white/20`}
        style={{ minWidth: "320px", maxWidth: "400px" }}
      >
        {/* Header with icon and privacy indicator */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-white/20 rounded-full">{getIcon()}</div>
            <span className="text-sm font-medium text-white">
              Mental Health Companion
            </span>
          </div>
          <div className="flex items-center space-x-2">
            {/* Privacy indicator */}
            <div className="flex items-center space-x-1 bg-white/20 px-2 py-1 rounded-full">
              <Shield className="h-3 w-3 text-white" />
              <span className="text-xs text-white font-medium">Private</span>
            </div>
            {/* Dismiss button */}
            <button
              onClick={handleDismiss}
              className="p-1 hover:bg-white/20 rounded-full transition-colors"
              title="Dismiss"
            >
              <X className="h-4 w-4 text-white" />
            </button>
          </div>
        </div>

        {/* Message content */}
        <div className="text-white text-sm leading-relaxed mb-3">{message}</div>

        {/* Footer with type indicator and dynamic countdown */}
        <div className="flex items-center justify-between text-xs text-white/80">
          <div className="flex items-center space-x-1">
            <span className="capitalize">{type}</span>
          </div>
          <div className="flex items-center space-x-1">
            <span>Auto-dismiss in {countdown}s</span>
          </div>
        </div>

        {/* Dynamic progress bar */}
        <div className="mt-2 h-0.5 bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-white/40 rounded-full transition-all duration-1000 ease-linear"
            style={{
              width: `${(countdown / 10) * 100}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default MentalHealthCompanion;
