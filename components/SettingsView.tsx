"use client";

import React, { useState } from "react";
import {
  User,
  Bell,
  Palette,
  Shield,
  Database,
  CheckCircle2,
  Save,
  Download,
  Smartphone,
  Laptop,
  Tablet,
  LogOut,
  AlertCircle,
  Clock,
  FileSpreadsheet,
  Globe,
  Sliders,
  Moon,
  Sun,
  Monitor,
  KeyRound,
  Users,
  Check,
} from "lucide-react";

interface SettingsViewProps {
  onReturnToDashboard?: () => void;
  showToast?: (message: string) => void;
  onLogout?: () => void;
}

export default function SettingsView({
  onReturnToDashboard,
  showToast,
  onLogout,
}: SettingsViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<
    "profile" | "notifications" | "theme" | "security" | "backup"
  >("profile");

  // 1. Profile state
  const [profile, setProfile] = useState({
    name: "Rajesh Sharma",
    email: "rajesh.sharma@apmc-karnal.gov.in",
    role: "Chief Mandi Superintendent",
    phone: "+91 98120 45678",
    centerName: "APMC Karnal Main Hub",
    yardId: "Yard #4 - North Gate 1-A",
  });
  const [profileSaved, setProfileSaved] = useState(false);

  // 2. Notification preferences state
  const [notifications, setNotifications] = useState({
    smsFarmerDispatch: true,
    queueThresholdAlert: true,
    thresholdWaitMins: 20,
    thresholdQueueSize: 25,
    moistureDiscrepancyAlert: true,
    dailyEveningSummary: true,
    emergencyBroadcast: true,
  });

  // 3. Theme & Display state
  const [themeMode, setThemeMode] = useState<"light" | "dark" | "system">("light");
  const [language, setLanguage] = useState<"en" | "hi" | "pa">("en");
  const [density, setDensity] = useState<"cozy" | "compact">("cozy");
  const [highContrast, setHighContrast] = useState(false);
  const [weightUnit, setWeightUnit] = useState<"quintal" | "tonne">("quintal");

  // 4. Security & Sessions state
  const [sessions, setSessions] = useState([
    {
      id: "sess-1",
      device: "Manager Workstation (Chrome on macOS)",
      location: "APMC Admin Office, Karnal",
      ip: "192.168.1.11",
      lastActive: "Active Now",
      isCurrent: true,
      type: "laptop",
    },
    {
      id: "sess-2",
      device: "Bay 3 Weighbridge Terminal",
      location: "Electronic Weighbridge A",
      ip: "192.168.1.45",
      lastActive: "14 mins ago",
      isCurrent: false,
      type: "laptop",
    },
    {
      id: "sess-3",
      device: "Field Tablet (Safari on iPad)",
      location: "Grading Platform Bay 1",
      ip: "192.168.1.78",
      lastActive: "1 hour ago",
      isCurrent: false,
      type: "tablet",
    },
  ]);

  const [staffRoles] = useState([
    { name: "Rajesh Sharma", role: "Superintendent", access: "Full Control", status: "Active" },
    { name: "Kavita Singh", role: "Weighbridge Incharge", access: "Bays 1-4 Operations", status: "Active" },
    { name: "R. K. Verma", role: "Moisture & Quality Officer", access: "Lab Verification", status: "Active" },
    { name: "S. Rao", role: "Gate Registrar", access: "Token & Entry Passes", status: "Active" },
  ]);

  const [twoFactorAuth, setTwoFactorAuth] = useState(true);

  // 5. Data Backup & Export state
  const [exportRange, setExportRange] = useState<"today" | "week" | "month">("today");
  const [isExporting, setIsExporting] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [lastBackupTime, setLastBackupTime] = useState("Today at 04:00 PM (e-NAM Cloud)");

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaved(true);
    if (showToast) {
      showToast("Profile and account details updated successfully!");
    }
    setTimeout(() => setProfileSaved(false), 3000);
  };

  const handleRevokeSession = (sessionId: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    if (showToast) {
      showToast("Selected session was terminated.");
    }
  };

  const handleExportCSV = () => {
    setIsExporting(true);

    setTimeout(() => {
      // Create actual dummy CSV content for Krishi procurement
      const csvRows = [
        ["Token ID", "Farmer Name", "Village", "Crop Variety", "Quantity (Quintals)", "Slot Window", "Inspection Bay", "Status", "MSP Rate (INR/Q)", "Estimated Payout (INR)"],
        ["TK-108", "Gurpreet Singh", "Nilokheri", "Sharbati Wheat", "42.5", "10:00 AM - 10:45 AM", "Bay 3 (Weighbridge)", "In Progress", "2275", "96687.50"],
        ["TK-107", "Rameshwar Patel", "Gharaunda", "Basmati 1121", "38.0", "09:30 AM - 10:15 AM", "Bay 1 (Cleared)", "Completed", "3850", "146300.00"],
        ["TK-106", "Sukhdev Yadav", "Taraori", "Mustard Seeds", "24.2", "10:30 AM - 11:15 AM", "Gate 1-A Queue", "Waiting", "5650", "136730.00"],
        ["TK-105", "Harpreet Kaur", "Indri", "Sharbati Wheat", "51.0", "09:00 AM - 09:45 AM", "Bay 4 (Silo 2)", "Completed", "2275", "116025.00"],
        ["TK-104", "Balwinder Sandhu", "Karnal Rural", "Gram / Chana", "19.8", "11:00 AM - 11:45 AM", "Bay 2 (Moisture Test)", "Verified", "5440", "107712.00"],
        ["TK-103", "Jagtar Dhillon", "Assandh", "Basmati 1121", "44.0", "08:30 AM - 09:15 AM", "Bay 3 (Cleared)", "Completed", "3850", "169400.00"],
      ];

      const csvContent =
        "data:text/csv;charset=utf-8," +
        csvRows.map((e) => e.map((val) => `"${val}"`).join(",")).join("\n");

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute(
        "download",
        `krishi_queue_procurement_report_${new Date().toISOString().slice(0, 10)}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setIsExporting(false);
      if (showToast) {
        showToast("Procurement CSV report generated and downloaded!");
      }
    }, 600);
  };

  const handleManualBackup = () => {
    setIsBackingUp(true);
    setTimeout(() => {
      setIsBackingUp(false);
      setLastBackupTime(`Today at ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} (e-NAM Cloud)`);
      if (showToast) {
        showToast("Manual cloud backup to e-NAM repository synced successfully!");
      }
    }, 1200);
  };

  const subTabs = [
    { id: "profile", name: "Profile & Account", icon: User },
    { id: "notifications", name: "Notifications", icon: Bell },
    { id: "theme", name: "Theme & Display", icon: Palette },
    { id: "security", name: "Security & Access", icon: Shield },
    { id: "backup", name: "Data Backup & Export", icon: Database },
  ] as const;

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-200">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-200/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900">
              Settings & Preferences
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
              Center Admin
            </span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-600 mt-1">
            Configure APMC Karnal Hub account credentials, automated dispatch alerts, display modes, and backup jobs.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="flex items-center gap-1.5 px-4 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold rounded-full shadow-xs transition cursor-pointer"
              title="Logout from current Mandi session"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>
          )}

          {onReturnToDashboard && (
            <button
              onClick={onReturnToDashboard}
              className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold rounded-full shadow-xs transition cursor-pointer"
            >
              &larr; Back to Dashboard
            </button>
          )}
        </div>
      </div>

      {/* Main Settings Grid: Sub-navigation (left) and Panel Content (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Sub-Tab Navigation (Pill Column) */}
        <div className="lg:col-span-3 bg-white rounded-3xl p-3 border border-zinc-200/80 shadow-xs space-y-1">
          {subTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-medium transition cursor-pointer text-left ${
                  isActive
                    ? "bg-zinc-900 text-white font-semibold shadow-xs"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                }`}
              >
                <Icon
                  className={`w-4 h-4 ${
                    isActive ? "text-emerald-400" : "text-zinc-400"
                  }`}
                />
                <span>{tab.name}</span>
              </button>
            );
          })}
          {onLogout && (
            <div className="pt-2 mt-2 border-t border-zinc-100">
              <button
                type="button"
                onClick={onLogout}
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl text-xs font-bold text-rose-700 hover:bg-rose-50 transition cursor-pointer"
              >
                <LogOut className="w-4 h-4 text-rose-500" />
                <span>Log Out of Session</span>
              </button>
            </div>
          )}
        </div>

        {/* Right Settings Content Panel */}
        <div className="lg:col-span-9 bg-white rounded-3xl p-5 sm:p-7 border border-zinc-200/80 shadow-xs">
          {/* TAB 1: Profile & Account Settings */}
          {activeSubTab === "profile" && (
            <form onSubmit={handleProfileSave} className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-zinc-900">
                  Profile & Account Settings
                </h2>
                <p className="text-xs text-zinc-600 mt-0.5">
                  Update officer credentials and primary Mandi Center affiliation details.
                </p>
              </div>

              {/* Avatar & Identification Header */}
              <div className="flex flex-wrap items-center gap-4 p-4 rounded-2xl bg-zinc-50 border border-zinc-200/70">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-800 to-emerald-600 flex items-center justify-center text-white text-xl font-bold shadow-md ring-4 ring-emerald-100">
                  RS
                </div>
                <div className="flex-1 min-w-[200px]">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-zinc-900">
                      {profile.name}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      Officer ID: MGR-4029
                    </span>
                  </div>
                  <p className="text-xs text-zinc-600 mt-0.5">
                    {profile.role} • {profile.centerName}
                  </p>
                  <p className="text-[11px] text-emerald-700 font-medium mt-1">
                    ✓ Verified Officer (Aadhaar & e-NAM Verified)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => alert("Avatar photo update simulation: Selected from local storage.")}
                  className="px-3 py-1.5 bg-white hover:bg-zinc-100 border border-zinc-200 rounded-full text-xs font-medium text-zinc-700 transition cursor-pointer"
                >
                  Change Photo
                </button>
              </div>

              {/* Input Fields Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) =>
                      setProfile({ ...profile, name: e.target.value })
                    }
                    className="w-full px-3.5 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                    Official Email Address
                  </label>
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) =>
                      setProfile({ ...profile, email: e.target.value })
                    }
                    className="w-full px-3.5 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                    Designation / Role
                  </label>
                  <input
                    type="text"
                    value={profile.role}
                    onChange={(e) =>
                      setProfile({ ...profile, role: e.target.value })
                    }
                    className="w-full px-3.5 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                    Mobile Phone (for OTP & Dispatches)
                  </label>
                  <input
                    type="tel"
                    value={profile.phone}
                    onChange={(e) =>
                      setProfile({ ...profile, phone: e.target.value })
                    }
                    className="w-full px-3.5 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                    Assigned Mandi Center
                  </label>
                  <input
                    type="text"
                    value={profile.centerName}
                    onChange={(e) =>
                      setProfile({ ...profile, centerName: e.target.value })
                    }
                    className="w-full px-3.5 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                    Yard Assignment
                  </label>
                  <input
                    type="text"
                    value={profile.yardId}
                    onChange={(e) =>
                      setProfile({ ...profile, yardId: e.target.value })
                    }
                    className="w-full px-3.5 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 font-medium"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-zinc-100 flex items-center justify-between">
                {profileSaved ? (
                  <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Changes saved successfully
                  </span>
                ) : (
                  <span className="text-[11px] text-zinc-500">
                    Changes take effect immediately across all terminal bays.
                  </span>
                )}
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-full shadow-sm transition cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: Notification Preferences */}
          {activeSubTab === "notifications" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-zinc-900">
                  Notification Preferences & Queue Alerts
                </h2>
                <p className="text-xs text-zinc-600 mt-0.5">
                  Configure real-time SMS dispatches for farmers and queue congestion thresholds.
                </p>
              </div>

              <div className="space-y-4">
                {/* Toggle 1: Farmer SMS dispatch */}
                <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200/70 flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-zinc-900">
                        Automatic Farmer SMS Dispatch
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded">
                        Recommended
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-600">
                      Send automated SMS alerts to farmer’s registered mobile when token is 3 positions away from weighbridge.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setNotifications({
                        ...notifications,
                        smsFarmerDispatch: !notifications.smsFarmerDispatch,
                      })
                    }
                    className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ${
                      notifications.smsFarmerDispatch
                        ? "bg-emerald-700"
                        : "bg-zinc-300"
                    }`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                        notifications.smsFarmerDispatch
                          ? "translate-x-5"
                          : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                {/* Toggle 2: Queue Congestion Alert */}
                <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200/70 space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <span className="text-xs font-bold text-zinc-900">
                        Gate Congestion & Queue Delay Warnings
                      </span>
                      <p className="text-[11px] text-zinc-600">
                        Trigger desktop & phone alert when average gate dwell time exceeds threshold.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setNotifications({
                          ...notifications,
                          queueThresholdAlert: !notifications.queueThresholdAlert,
                        })
                      }
                      className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ${
                        notifications.queueThresholdAlert
                          ? "bg-emerald-700"
                          : "bg-zinc-300"
                      }`}
                    >
                      <div
                        className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                          notifications.queueThresholdAlert
                            ? "translate-x-5"
                            : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  {notifications.queueThresholdAlert && (
                    <div className="pt-3 border-t border-zinc-200/70 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-semibold text-zinc-700 mb-1">
                          Wait Time Alert Trigger (Minutes):
                        </label>
                        <input
                          type="number"
                          value={notifications.thresholdWaitMins}
                          onChange={(e) =>
                            setNotifications({
                              ...notifications,
                              thresholdWaitMins: Number(e.target.value),
                            })
                          }
                          className="w-full px-3 py-1.5 text-xs bg-white border border-zinc-200 rounded-xl"
                          min={5}
                          max={60}
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-zinc-700 mb-1">
                          Waiting Vehicles Threshold:
                        </label>
                        <input
                          type="number"
                          value={notifications.thresholdQueueSize}
                          onChange={(e) =>
                            setNotifications({
                              ...notifications,
                              thresholdQueueSize: Number(e.target.value),
                            })
                          }
                          className="w-full px-3 py-1.5 text-xs bg-white border border-zinc-200 rounded-xl"
                          min={5}
                          max={100}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Toggle 3: Quality / Moisture alert */}
                <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200/70 flex items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-bold text-zinc-900">
                      Moisture & Refraction Discrepancy Alerts
                    </span>
                    <p className="text-[11px] text-zinc-600">
                      Alert manager immediately if wheat moisture exceeds 12.5% during bay sampling.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setNotifications({
                        ...notifications,
                        moistureDiscrepancyAlert:
                          !notifications.moistureDiscrepancyAlert,
                      })
                    }
                    className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ${
                      notifications.moistureDiscrepancyAlert
                        ? "bg-emerald-700"
                        : "bg-zinc-300"
                    }`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                        notifications.moistureDiscrepancyAlert
                          ? "translate-x-5"
                          : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                {/* Toggle 4: Daily 6 PM summary */}
                <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200/70 flex items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-bold text-zinc-900">
                      Daily 6:00 PM Procurement Summary SMS
                    </span>
                    <p className="text-[11px] text-zinc-600">
                      Receive total quintals, truck counts, and MSP outlay directly to manager’s phone at gate close.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setNotifications({
                        ...notifications,
                        dailyEveningSummary: !notifications.dailyEveningSummary,
                      })
                    }
                    className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ${
                      notifications.dailyEveningSummary
                        ? "bg-emerald-700"
                        : "bg-zinc-300"
                    }`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                        notifications.dailyEveningSummary
                          ? "translate-x-5"
                          : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    if (showToast) showToast("Notification preferences updated!");
                  }}
                  className="px-5 py-2 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold rounded-full transition cursor-pointer"
                >
                  Save Notification Preferences
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: Theme & Display Options */}
          {activeSubTab === "theme" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-zinc-900">
                  Theme & Display Options
                </h2>
                <p className="text-xs text-zinc-600 mt-0.5">
                  Customize dashboard interface styling, mandi language preference, and measurement units.
                </p>
              </div>

              {/* Theme Mode Selection Cards */}
              <div>
                <label className="block text-xs font-bold text-zinc-800 mb-2.5">
                  Interface Theme
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { id: "light", label: "Clean Green Light", desc: "Crisp white & emerald palette (Default)", icon: Sun },
                    { id: "dark", label: "Mandi Night Mode", desc: "Low glare dark mode for night gate ops", icon: Moon },
                    { id: "system", label: "System Sync", desc: "Match operating system preferences", icon: Monitor },
                  ].map((item) => {
                    const Icon = item.icon;
                    const isSelected = themeMode === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setThemeMode(item.id as any);
                          if (showToast) showToast(`Switched theme to ${item.label}`);
                        }}
                        className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative flex flex-col justify-between ${
                          isSelected
                            ? "bg-emerald-50/60 border-emerald-600 ring-2 ring-emerald-500/20"
                            : "bg-zinc-50 border-zinc-200 hover:border-zinc-300"
                        }`}
                      >
                        {isSelected && (
                          <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-emerald-700 text-white flex items-center justify-center text-[10px]">
                            <Check className="w-3 h-3" />
                          </span>
                        )}
                        <Icon
                          className={`w-5 h-5 mb-2 ${
                            isSelected ? "text-emerald-700" : "text-zinc-500"
                          }`}
                        />
                        <div>
                          <div className="text-xs font-bold text-zinc-900">
                            {item.label}
                          </div>
                          <div className="text-[11px] text-zinc-600 mt-0.5">
                            {item.desc}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Language Preferences */}
              <div>
                <label className="block text-xs font-bold text-zinc-800 mb-2">
                  Mandi Portal Language
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { id: "en", name: "English", sub: "Standard Mandi Terminology" },
                    { id: "hi", name: "हिंदी (Hindi)", sub: "कृषि-कतार एवं स्लॉट प्रबंधन" },
                    { id: "pa", name: "ਪੰਜਾਬੀ (Punjabi)", sub: "ਕ੍ਰਿਸ਼ੀ-ਕਤਾਰ ਅਤੇ ਮੰਡੀ ਪ੍ਰਬੰਧਨ" },
                  ].map((lang) => {
                    const isSelected = language === lang.id;
                    return (
                      <button
                        key={lang.id}
                        type="button"
                        onClick={() => {
                          setLanguage(lang.id as any);
                          if (showToast) showToast(`Language preference set to ${lang.name}`);
                        }}
                        className={`p-3.5 rounded-2xl border text-left transition cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? "bg-emerald-50 border-emerald-600 text-emerald-950 font-bold"
                            : "bg-zinc-50 border-zinc-200 text-zinc-700 hover:bg-zinc-100"
                        }`}
                      >
                        <div>
                          <div className="text-xs font-bold">{lang.name}</div>
                          <div className="text-[10px] text-zinc-600">{lang.sub}</div>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-emerald-700" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Units and Density Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200/70">
                  <span className="text-xs font-bold text-zinc-900 block mb-1">
                    Measurement Units
                  </span>
                  <p className="text-[11px] text-zinc-600 mb-3">
                    Display weighing scale metrics across tokens and summary cards.
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setWeightUnit("quintal")}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer ${
                        weightUnit === "quintal"
                          ? "bg-emerald-800 text-white"
                          : "bg-white border border-zinc-200 text-zinc-700"
                      }`}
                    >
                      Quintals (Q)
                    </button>
                    <button
                      type="button"
                      onClick={() => setWeightUnit("tonne")}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer ${
                        weightUnit === "tonne"
                          ? "bg-emerald-800 text-white"
                          : "bg-white border border-zinc-200 text-zinc-700"
                      }`}
                    >
                      Metric Tonnes (MT)
                    </button>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200/70 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-bold text-zinc-900 block mb-1">
                      High Sunlight Contrast
                    </span>
                    <p className="text-[11px] text-zinc-600">
                      Enhance black/green border borders for outdoor weighing tablets under direct sun.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setHighContrast(!highContrast)}
                    className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 shrink-0 ${
                      highContrast ? "bg-emerald-700" : "bg-zinc-300"
                    }`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                        highContrast ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Security & Access Control */}
          {activeSubTab === "security" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-zinc-900">
                  Security & Access Control
                </h2>
                <p className="text-xs text-zinc-600 mt-0.5">
                  Manage active manager sessions, role permissions, and authentication credentials.
                </p>
              </div>

              {/* 2FA Toggle */}
              <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200/70 flex items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-zinc-900">
                        Two-Factor Authentication (2FA) via Aadhaar / Mandi OTP
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        Active
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-600 mt-0.5">
                      Requires 6-digit SMS OTP to approve gate bypasses and manual weighing adjustments.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setTwoFactorAuth(!twoFactorAuth)}
                  className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 shrink-0 ${
                    twoFactorAuth ? "bg-emerald-700" : "bg-zinc-300"
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                      twoFactorAuth ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Active Sessions List */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
                    Active Center Logins & Devices
                  </h3>
                  <span className="text-[11px] text-zinc-600">
                    {sessions.length} authorized sessions active
                  </span>
                </div>
                <div className="divide-y divide-zinc-100 border border-zinc-200 rounded-2xl overflow-hidden">
                  {sessions.map((sess) => (
                    <div
                      key={sess.id}
                      className="p-3.5 bg-white hover:bg-zinc-50/80 transition flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-zinc-100 text-zinc-700 flex items-center justify-center shrink-0">
                          {sess.type === "laptop" ? (
                            <Laptop className="w-4 h-4" />
                          ) : (
                            <Tablet className="w-4 h-4" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-zinc-900">
                              {sess.device}
                            </span>
                            {sess.isCurrent && (
                              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                This Browser
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-zinc-600 mt-0.5">
                            {sess.location} • IP: {sess.ip} • <span className="text-emerald-700 font-medium">{sess.lastActive}</span>
                          </div>
                        </div>
                      </div>

                      {!sess.isCurrent && (
                        <button
                          type="button"
                          onClick={() => handleRevokeSession(sess.id)}
                          className="px-3 py-1 text-xs text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-full transition cursor-pointer font-medium"
                        >
                          Revoke
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Staff Roles & Permissions */}
              <div>
                <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider mb-2.5">
                  Operator Roles & Permission Levels
                </h3>
                <div className="overflow-x-auto border border-zinc-200 rounded-2xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-600">
                      <tr>
                        <th className="py-2.5 px-4 font-semibold">Staff Member</th>
                        <th className="py-2.5 px-3 font-semibold">Role</th>
                        <th className="py-2.5 px-3 font-semibold">Access Scope</th>
                        <th className="py-2.5 px-3 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {staffRoles.map((staff, idx) => (
                        <tr key={idx} className="hover:bg-zinc-50/60">
                          <td className="py-2.5 px-4 font-bold text-zinc-900">
                            {staff.name}
                          </td>
                          <td className="py-2.5 px-3 text-zinc-700">
                            {staff.role}
                          </td>
                          <td className="py-2.5 px-3 text-zinc-600">
                            {staff.access}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                              {staff.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: Data Backup & Export */}
          {activeSubTab === "backup" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-zinc-900">
                  Data Backup & Procurement Export
                </h2>
                <p className="text-xs text-zinc-600 mt-0.5">
                  Export verified farmer weighbridge tokens as CSV or trigger manual sync with e-NAM national repository.
                </p>
              </div>

              {/* Export Card */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-zinc-50 to-emerald-50/40 border border-zinc-200/80 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-800 text-white flex items-center justify-center shadow-sm">
                      <FileSpreadsheet className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-zinc-900">
                        Export Procurement & Weighing Logs (CSV)
                      </h3>
                      <p className="text-[11px] text-zinc-600">
                        Includes Token IDs, farmer Aadhaar verification, gross/tare weights, and MSP payout values.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Range Selector */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-xs font-semibold text-zinc-700">Date Range:</span>
                  {(["today", "week", "month"] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setExportRange(r)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition cursor-pointer capitalize ${
                        exportRange === r
                          ? "bg-zinc-900 text-white font-semibold shadow-xs"
                          : "bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-100"
                      }`}
                    >
                      {r === "today" ? "Today (5 Sep)" : r === "week" ? "This Week" : "This Month"}
                    </button>
                  ))}
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleExportCSV}
                    disabled={isExporting}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-full shadow-sm transition-all hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{isExporting ? "Generating CSV Report..." : "Download Procurement CSV"}</span>
                  </button>
                </div>
              </div>

              {/* Cloud Sync & Backup Card */}
              <div className="p-5 rounded-2xl bg-zinc-50 border border-zinc-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold text-zinc-900">
                      National e-NAM Database Automated Backup
                    </h3>
                    <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                  </div>
                  <p className="text-[11px] text-zinc-600">
                    Last automatic sync: <strong className="text-zinc-800 font-semibold">{lastBackupTime}</strong>
                  </p>
                  <p className="text-[10px] text-emerald-800 font-medium">
                    ✓ All 142 daily slot records encrypted with AES-256
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleManualBackup}
                  disabled={isBackingUp}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-zinc-100 border border-zinc-300 text-zinc-800 text-xs font-bold rounded-full shadow-xs transition cursor-pointer shrink-0 disabled:opacity-50"
                >
                  <Database className="w-3.5 h-3.5 text-zinc-600" />
                  <span>{isBackingUp ? "Syncing..." : "Trigger Manual Backup"}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
