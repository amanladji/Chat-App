import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import {
  Camera,
  Mail,
  User,
  Edit3,
  Check,
  X,
  Shield,
  Heart,
} from "lucide-react";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import MentalHealthCompanion from "../components/MentalHealthCompanion";

const ProfilePage = () => {
  const { authUser, isUpdatingProfile, updateProfile } = useAuthStore();
  const {
    getMentalHealthSettings,
    updateMentalHealthSettings,
    getMentalHealthStats,
    mentalHealthCompanion, // Add mental health companion state
    dismissCompanionMessage, // Add companion dismiss function
  } = useChatStore();
  const navigate = useNavigate();
  const [selectedImg, setSelectedImg] = useState(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState(authUser?.fullName || "");

  // Mental health settings state
  const [localMentalHealthSettings, setLocalMentalHealthSettings] = useState({
    companionEnabled: true,
    notificationFrequency: "frequent",
  });
  const [mentalHealthStats, setMentalHealthStats] = useState(null);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [isUpdatingSettings, setIsUpdatingSettings] = useState(false);

  // Load mental health settings on component mount
  useEffect(() => {
    const loadMentalHealthData = async () => {
      setIsLoadingSettings(true);
      try {
        const [settings, stats] = await Promise.all([
          getMentalHealthSettings(),
          getMentalHealthStats(),
        ]);

        if (settings) {
          setLocalMentalHealthSettings({
            companionEnabled: settings.companionEnabled,
            notificationFrequency: settings.notificationFrequency,
          });
        }

        if (stats) {
          setMentalHealthStats(stats);
        }
      } catch (error) {
        console.error("Error loading mental health data:", error);
      } finally {
        setIsLoadingSettings(false);
      }
    };

    loadMentalHealthData();
  }, [getMentalHealthSettings, getMentalHealthStats]);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.readAsDataURL(file);

    reader.onload = async () => {
      const base64Image = reader.result;
      setSelectedImg(base64Image);
      await updateProfile({ profilePic: base64Image });
    };
  };

  const handleNameEdit = () => {
    setIsEditingName(true);
    setNewName(authUser?.fullName || "");
  };

  const handleNameSave = async () => {
    if (newName.trim() && newName.trim() !== authUser?.fullName) {
      await updateProfile({ fullName: newName.trim() });
    }
    setIsEditingName(false);
  };

  const handleNameCancel = () => {
    setNewName(authUser?.fullName || "");
    setIsEditingName(false);
  };

  // Mental health settings handlers
  const handleMentalHealthToggle = async () => {
    setIsUpdatingSettings(true);
    try {
      const newEnabled = !localMentalHealthSettings.companionEnabled;
      await updateMentalHealthSettings({
        companionEnabled: newEnabled,
      });

      setLocalMentalHealthSettings((prev) => ({
        ...prev,
        companionEnabled: newEnabled,
      }));

      toast.success(
        `Mental Health Companion ${newEnabled ? "enabled" : "disabled"}`
      );
    } catch {
      toast.error("Failed to update settings");
    } finally {
      setIsUpdatingSettings(false);
    }
  };

  const handleFrequencyChange = async (newFrequency) => {
    setIsUpdatingSettings(true);
    try {
      await updateMentalHealthSettings({
        notificationFrequency: newFrequency,
      });

      setLocalMentalHealthSettings((prev) => ({
        ...prev,
        notificationFrequency: newFrequency,
      }));

      toast.success("Notification frequency updated");
    } catch {
      toast.error("Failed to update frequency setting");
    } finally {
      setIsUpdatingSettings(false);
    }
  };

  // Testing functions
  const handleResetCooldown = async () => {
    try {
      const response = await axiosInstance.post(
        "/messages/mental-health/reset-cooldown"
      );

      if (response.status === 200) {
        toast.success("Cooldown reset successfully");
      } else {
        toast.error("Failed to reset cooldown");
      }
    } catch {
      toast.error("Failed to reset cooldown");
    }
  };

  return (
    <div className="min-h-screen pt-20 bg-gradient-to-b from-[#3c334b] to-[#2a2336]">
      <div className="max-w-2xl mx-auto p-4 py-8 min-h-[calc(100vh-5rem)]">
        <div className="bg-[#1f1a27] rounded-3xl p-8 space-y-8 shadow-[0_8px_40px_-8px_rgba(0,0,0,0.45)] ring-1 ring-white/5 relative">
          {/* Close button */}
          <button
            onClick={() => navigate("/")}
            className="absolute top-6 right-6 p-2 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-700/50 transition-colors"
            aria-label="Close profile"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="text-center">
            <h1 className="text-2xl font-semibold text-zinc-100">Profile</h1>
            <p className="mt-2 text-zinc-400">Your profile information</p>
          </div>

          {/* avatar upload section */}

          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <img
                src={selectedImg || authUser.profilePic || "/avatar.png"}
                alt="Profile"
                className="size-32 rounded-full object-cover border-4 border-zinc-600/50"
              />
              <label
                htmlFor="avatar-upload"
                className={`
                  absolute bottom-0 right-0 
                  bg-violet-500 hover:bg-violet-600 hover:scale-105
                  p-2 rounded-full cursor-pointer 
                  transition-all duration-200 shadow-lg
                  ${
                    isUpdatingProfile ? "animate-pulse pointer-events-none" : ""
                  }
                `}
              >
                <Camera className="w-5 h-5 text-white" />
                <input
                  type="file"
                  id="avatar-upload"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={isUpdatingProfile}
                />
              </label>
            </div>
            <p className="text-sm text-zinc-400">
              {isUpdatingProfile
                ? "Uploading..."
                : "Click the camera icon to update your photo"}
            </p>
          </div>

          <div className="space-y-6">
            <div className="space-y-1.5">
              <div className="text-sm text-zinc-400 flex items-center gap-2">
                <User className="w-4 h-4" />
                Full Name
              </div>
              {isEditingName ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="flex-1 px-4 py-2.5 bg-[#2a2434] rounded-lg border border-zinc-600/50 text-zinc-100 focus:border-violet-400 focus:ring-2 focus:ring-violet-400/50 outline-none transition-all"
                    placeholder="Enter your full name"
                    disabled={isUpdatingProfile}
                  />
                  <button
                    onClick={handleNameSave}
                    disabled={isUpdatingProfile || !newName.trim()}
                    className="px-3 py-2 bg-violet-500 hover:bg-violet-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleNameCancel}
                    disabled={isUpdatingProfile}
                    className="px-3 py-2 bg-zinc-600 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <p className="flex-1 px-4 py-2.5 bg-[#2a2434] rounded-lg border border-zinc-600/50 text-zinc-100">
                    {authUser?.fullName}
                  </p>
                  <button
                    onClick={handleNameEdit}
                    className="px-3 py-2 bg-zinc-600 hover:bg-zinc-700 text-white rounded-lg transition-colors flex items-center justify-center"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="text-sm text-zinc-400 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email Address
              </div>
              <p className="px-4 py-2.5 bg-[#2a2434] rounded-lg border border-zinc-600/50 text-zinc-100">
                {authUser?.email}
              </p>
            </div>
          </div>

          {/* Mental Health Companion Settings */}
          <div className="bg-gradient-to-r from-purple-900/20 to-pink-900/20 rounded-xl p-6 border border-purple-500/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg">
                <Heart className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-zinc-100">
                  Mental Health Companion
                </h2>
                <p className="text-sm text-zinc-400">
                  Privacy-focused supportive messaging
                </p>
              </div>
            </div>

            {isLoadingSettings ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-8 h-8 border-4 border-purple-600/30 border-t-purple-600 rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Companion Toggle */}
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-zinc-200 font-medium">
                      Enable Companion
                    </h3>
                    <p className="text-sm text-zinc-400">
                      Get supportive messages when negative sentiment patterns
                      are detected
                    </p>
                  </div>
                  <button
                    onClick={handleMentalHealthToggle}
                    disabled={isUpdatingSettings}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900 ${
                      localMentalHealthSettings.companionEnabled
                        ? "bg-gradient-to-r from-purple-600 to-pink-600"
                        : "bg-zinc-600"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                        localMentalHealthSettings.companionEnabled
                          ? "translate-x-6"
                          : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                {/* Notification Frequency */}
                {localMentalHealthSettings.companionEnabled && (
                  <div className="border-t border-purple-500/20 pt-6">
                    <h3 className="text-zinc-200 font-medium mb-3">
                      Notification Frequency
                    </h3>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        {
                          value: "minimal",
                          label: "Minimal",
                          desc: "12h cooldown",
                        },
                        {
                          value: "moderate",
                          label: "Moderate",
                          desc: "3h cooldown",
                        },
                        {
                          value: "frequent",
                          label: "Frequent",
                          desc: "10min cooldown",
                        },
                      ].map((option) => (
                        <button
                          key={option.value}
                          onClick={() => handleFrequencyChange(option.value)}
                          disabled={isUpdatingSettings}
                          className={`p-3 rounded-lg border-2 text-center transition-all duration-200 ${
                            localMentalHealthSettings.notificationFrequency ===
                            option.value
                              ? "border-purple-500 bg-purple-500/10 text-purple-300"
                              : "border-zinc-600 bg-zinc-800/50 text-zinc-400 hover:border-zinc-500 hover:text-zinc-300"
                          }`}
                        >
                          <div className="font-medium text-sm">
                            {option.label}
                          </div>
                          <div className="text-xs mt-1 opacity-80">
                            {option.desc}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Privacy Notice */}
                <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700/50">
                  <div className="flex items-start gap-3">
                    <Shield className="h-5 w-5 text-purple-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="text-sm font-medium text-zinc-200 mb-1">
                        Privacy First
                      </h4>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        Companion messages are only visible to you and never
                        shared with other users. Sentiment analysis is performed
                        locally on your messages to protect your privacy.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Statistics */}
                {mentalHealthStats && (
                  <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700/50">
                    <h4 className="text-sm font-medium text-zinc-200 mb-3">
                      Your Statistics
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <div className="text-zinc-400">Companion Messages</div>
                        <div className="text-lg font-semibold text-purple-300">
                          {mentalHealthStats.companionTriggerCount || 0}
                        </div>
                      </div>
                      <div>
                        <div className="text-zinc-400">Status</div>
                        <div
                          className={`text-lg font-semibold capitalize ${
                            mentalHealthStats.status === "normal"
                              ? "text-green-400"
                              : mentalHealthStats.status === "monitored"
                              ? "text-yellow-400"
                              : "text-orange-400"
                          }`}
                        >
                          {mentalHealthStats.status || "Normal"}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Testing buttons - Always visible when companion is enabled */}
                {localMentalHealthSettings.companionEnabled && (
                  <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700/50">
                    <h4 className="text-sm font-medium text-zinc-200 mb-3">
                      Testing & Debug
                    </h4>
                    <div className="flex gap-2">
                      <button
                        onClick={handleResetCooldown}
                        className="flex-1 px-3 py-2 bg-zinc-600 hover:bg-zinc-700 text-white text-xs rounded-lg transition-all duration-200 font-medium"
                      >
                        Reset Cooldown
                      </button>
                    </div>
                    <p className="text-xs text-zinc-500 mt-2">
                      Use these buttons to test the mental health companion
                      functionality
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="mt-6 bg-[#2a2434]/80 rounded-xl p-6 border border-zinc-700/50">
            <h2 className="text-lg font-medium text-zinc-100 mb-4">
              Account Information
            </h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between py-2 border-b border-zinc-700/50">
                <span className="text-zinc-300">Member Since</span>
                <span className="text-zinc-100">
                  {authUser.createdAt?.split("T")[0]}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-zinc-300">Account Status</span>
                <span className="text-green-400">Active</span>
              </div>
            </div>
          </div>
        </div>

        {/* Mental Health Companion - Show popup if active */}
        {mentalHealthCompanion && mentalHealthCompanion.isVisible && (
          <MentalHealthCompanion
            message={mentalHealthCompanion.message}
            type={mentalHealthCompanion.type}
            triggerId={mentalHealthCompanion.id}
            onDismiss={dismissCompanionMessage}
          />
        )}
      </div>
    </div>
  );
};
export default ProfilePage;
