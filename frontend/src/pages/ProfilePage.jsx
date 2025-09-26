import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { Camera, Mail, User, Edit3, Check, X } from "lucide-react";

const ProfilePage = () => {
  const { authUser, isUpdatingProfile, updateProfile } = useAuthStore();
  const navigate = useNavigate();
  const [selectedImg, setSelectedImg] = useState(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState(authUser?.fullName || "");

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
      </div>
    </div>
  );
};
export default ProfilePage;
