"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import {
  ApiError,
  changePassword,
  errorMessage,
  getCurrentUser,
  logout,
  logoutEverywhere,
  updateProfile,
} from "@/lib/api";

const MIN_PASSWORD_LENGTH = 8;

const inputClass =
  "w-full h-10 px-3 rounded-lg border border-slate-200 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent";

export default function SettingsPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showSignOutAllModal, setShowSignOutAllModal] = useState(false);

  useEffect(() => {
    getCurrentUser().then((user) => {
      if (user) {
        setDisplayName(user.displayName);
        setEmail(user.email);
      }
    });
  }, []);

  const handleSignOut = async () => {
    await logout();
    router.push("/login");
  };

  const handleSignOutAllDevices = async () => {
    setIsSaving(true);
    try {
      await logoutEverywhere();
      router.push("/login");
    } catch (error) {
      setFormError(errorMessage(error));
    } finally {
      setIsSaving(false);
      setShowSignOutAllModal(false);
    }
  };

  const handleSave = async () => {
    const changingPassword = Boolean(currentPassword || password || confirmPassword);
    if (!displayName.trim()) {
      setFormError("Please enter your name.");
      return;
    }
    if (changingPassword) {
      if (!currentPassword) {
        setFormError("Please enter your current password.");
        return;
      }
      if (password !== confirmPassword) {
        setFormError("The new passwords do not match.");
        return;
      }
      if (password.length < MIN_PASSWORD_LENGTH) {
        setFormError(`The new password must be at least ${MIN_PASSWORD_LENGTH} characters long.`);
        return;
      }
    }

    setFormError("");
    setIsSaving(true);
    try {
      await updateProfile({ displayName: displayName.trim() });
      window.dispatchEvent(new Event("settings-updated"));

      if (changingPassword) {
        await changePassword(currentPassword, password);
        setCurrentPassword("");
        setPassword("");
        setConfirmPassword("");
      }

      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      if (error instanceof ApiError && error.status === 400 && changingPassword) {
        setFormError("Your current password is incorrect.");
      } else {
        setFormError(errorMessage(error));
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <Sidebar />

      <main className="flex-1 flex flex-col h-full overflow-y-auto bg-slate-50/50 pb-16 md:pb-20 xl:pb-0">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-[#e2e8f0]">
          <div className="px-3 md:px-6 py-4 md:py-5">
            <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-[#1e293b] tracking-tight">Settings</h2>
                <p className="text-[#64748b] text-xs md:text-sm mt-1 hidden sm:block">Manage your profile</p>
              </div>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-colors font-semibold text-sm shrink-0"
              >
                <span className="material-symbols-outlined text-base">logout</span>
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </div>
          </div>
        </div>

        {/* Success toast */}
        {showSuccess && (
          <div
            role="status"
            className="fixed top-4 right-4 z-50 bg-emerald-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-slide-in-right"
          >
            <span className="material-symbols-outlined text-[20px]">check_circle</span>
            <span className="text-sm font-medium">Settings saved successfully.</span>
          </div>
        )}

        <div className="px-3 md:px-6 py-4 md:py-6">
          <div className="max-w-4xl mx-auto">
            {/* Profile */}
            <div className="bg-white rounded-lg border border-[#e2e8f0] p-6">
              <h3 className="text-lg font-bold text-[#1e293b] mb-6">Profile information</h3>

              <div className="flex flex-col gap-6">
                <div>
                  <label htmlFor="displayName" className="block text-sm font-medium text-slate-700 mb-2">
                    Full name
                  </label>
                  <input
                    id="displayName"
                    type="text"
                    value={displayName}
                    onChange={(e) => {
                      setDisplayName(e.target.value);
                      setFormError("");
                    }}
                    className={inputClass}
                    placeholder="Enter your name"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                    Email address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    readOnly
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-slate-50 text-slate-600 cursor-not-allowed"
                  />
                  <p className="text-xs text-slate-500 mt-1">The email address cannot be changed.</p>
                </div>
              </div>
            </div>

            {/* Password */}
            <div className="mt-6 bg-white rounded-lg border border-[#e2e8f0] p-6">
              <h3 className="text-lg font-bold text-[#1e293b] mb-1">Change password</h3>
              <p className="text-sm text-slate-500 mb-6">Leave these fields empty to keep your current password.</p>

              <div className="flex flex-col gap-6">
                <div>
                  <label htmlFor="currentPassword" className="block text-sm font-medium text-slate-700 mb-2">
                    Current password
                  </label>
                  <input
                    id="currentPassword"
                    type="password"
                    autoComplete="current-password"
                    value={currentPassword}
                    onChange={(e) => {
                      setCurrentPassword(e.target.value);
                      setFormError("");
                    }}
                    className={inputClass}
                    placeholder="Enter your current password"
                  />
                </div>

                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-slate-700 mb-2">
                    New password
                  </label>
                  <input
                    id="newPassword"
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setFormError("");
                    }}
                    className={inputClass}
                    placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
                  />
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-2">
                    Confirm new password
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setFormError("");
                    }}
                    className={inputClass}
                    placeholder="Repeat the new password"
                  />
                </div>
              </div>
            </div>

            {/* Sessions */}
            <div className="mt-6 bg-white rounded-lg border border-[#e2e8f0] p-6">
              <h3 className="text-lg font-bold text-[#1e293b] mb-1">Session management</h3>
              <p className="text-sm text-slate-500 mb-4">Sign out from every device where you are signed in.</p>
              <button
                onClick={() => setShowSignOutAllModal(true)}
                className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">devices</span>
                Sign out all devices
              </button>
            </div>

            {formError && (
              <p role="alert" className="mt-6 text-sm text-red-600 flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">error</span>
                {formError}
              </p>
            )}

            {/* Save */}
            <div className="mt-6 flex justify-end">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-6 py-2.5 bg-[#00132c] hover:bg-[#0f2545] text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className={`material-symbols-outlined text-[18px] ${isSaving ? "animate-spin" : ""}`}>
                  {isSaving ? "refresh" : "save"}
                </span>
                {isSaving ? "Saving..." : "Save changes"}
              </button>
            </div>

            {/* Sign out all devices confirmation */}
            {showSignOutAllModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <div role="dialog" aria-modal="true" className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="size-12 rounded-full flex items-center justify-center bg-red-100 flex-shrink-0">
                      <span className="material-symbols-outlined text-2xl text-red-600">logout</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-slate-900">Sign out all devices?</h3>
                      <p className="text-sm text-slate-600 mt-1">
                        You will be signed out everywhere, including this device.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowSignOutAllModal(false)}
                      disabled={isSaving}
                      className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSignOutAllDevices}
                      disabled={isSaving}
                      className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <span className="material-symbols-outlined text-[18px]">logout</span>
                      {isSaving ? "Signing out..." : "Sign out all"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
