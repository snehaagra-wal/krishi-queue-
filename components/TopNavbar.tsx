"use client";

import React, { useState, useEffect } from "react";
import {
  Bell,
  Settings,
  ChevronDown,
  CheckCircle2,
  Clock,
  AlertTriangle,
  LogOut,
  Sparkles,
} from "lucide-react";
import {
  subscribeToNotifications,
  type MandiNotification,
} from "@/lib/firestoreService";

interface TopNavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout?: () => void;
  managerName?: string;
  managerEmail?: string;
  managerCenter?: string;
  managerPhotoUrl?: string;
}

export default function TopNavbar({
  activeTab,
  setActiveTab,
  onLogout,
  managerName = "Saurabh",
  managerEmail = "saurabh@krishiqueue.gov.in",
  managerCenter = "APMC Mandi Hub",
  managerPhotoUrl,
}: TopNavbarProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const [notifications, setNotifications] = useState<MandiNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const unsub = subscribeToNotifications((liveNotifs) => {
      setNotifications(liveNotifs);
      setUnreadCount(liveNotifs.length);
    });
    return () => unsub();
  }, []);

  const navLinks = [
    { name: "Overview", id: "Overview" },
    { name: "Centers", id: "Centers" },
    { name: "Farmers", id: "Farmers" },
    { name: "Slots & Queue", id: "Slots & Queue" },
    { name: "Analytics", id: "Analytics" },
  ];

  return (
    <header className="w-full bg-white border-b border-zinc-200/80 sticky top-0 z-40">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
        {/* Brand Section */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="relative flex items-center justify-center">
            {/* Exactly as requested: <img src="/krishi logo.png" alt="Krishi-Queue Logo" className="w-9 h-9 object-contain" /> */}
            <img
              src="/krishi logo.png"
              alt="Krishi-Queue Logo"
              className="w-9 h-9 object-contain drop-shadow-sm transition-transform hover:scale-105 duration-200"
            />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-xl tracking-tight text-emerald-950 flex items-center gap-1.5">
              Krishi-Queue
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                Mandi Hub
              </span>
            </span>
            <span className="text-[11px] text-zinc-600 font-medium hidden sm:inline-block">
              Agricultural Queue & Slot Management
            </span>
          </div>
        </div>

        {/* Center Navigation Links (Pill Style as in Dribbble reference) */}
        <nav className="hidden md:flex items-center bg-zinc-100/90 p-1 rounded-full border border-zinc-200/60 shadow-inner">
          {navLinks.map((link) => {
            const isActive = activeTab === link.id;
            return (
              <button
                key={link.id}
                onClick={() => setActiveTab(link.id)}
                className={`px-4 py-1.5 text-xs lg:text-sm font-medium rounded-full transition-all duration-200 cursor-pointer ${
                  isActive
                    ? "bg-zinc-900 text-white shadow-sm font-semibold"
                    : "text-zinc-600 hover:text-zinc-950 hover:bg-white/60"
                }`}
              >
                {link.name}
              </button>
            );
          })}
        </nav>

        {/* Right Section: Settings, Notifications, Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Settings Button */}
          <button
            onClick={() => setActiveTab("Settings")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150 cursor-pointer border ${
              activeTab === "Settings"
                ? "bg-zinc-900 text-white border-zinc-900"
                : "border-zinc-200 text-zinc-700 hover:bg-zinc-50 hover:border-zinc-300"
            }`}
            title="Dashboard Settings"
          >
            <Settings className="w-3.5 h-3.5 text-zinc-500" />
            <span className="hidden sm:inline">Settings</span>
          </button>

          {/* Notifications Button */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowProfileMenu(false);
                setUnreadCount(0);
              }}
              className="relative p-2 rounded-full border border-zinc-200 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 transition-colors cursor-pointer"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-emerald-600 text-white text-[9px] font-extrabold flex items-center justify-center ring-2 ring-white animate-pulse">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown Modal */}
            {showNotifications && (
              <div className="absolute -right-12 sm:right-0 mt-2 w-[calc(100vw-32px)] max-w-sm sm:w-88 bg-white rounded-2xl shadow-2xl border border-zinc-200 p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-zinc-900">
                      Center Alerts
                    </span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded-full">
                      {notifications.length} Live
                    </span>
                  </div>
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="text-xs text-zinc-600 hover:text-zinc-900 cursor-pointer"
                  >
                    Close
                  </button>
                </div>
                <div className="divide-y divide-zinc-100 mt-2 max-h-72 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="py-8 px-4 text-center">
                      <Bell className="w-8 h-8 text-zinc-300 mx-auto mb-2 opacity-60" />
                      <p className="text-xs font-bold text-zinc-700">No New Notifications</p>
                      <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                        Real-time alerts will appear here when farmers log in, register, or book Mandi queue arrival slots.
                      </p>
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className="py-2.5 flex items-start gap-2.5 hover:bg-zinc-50/80 rounded-lg px-1.5 transition-colors cursor-pointer"
                      >
                        {n.type === "success" && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                        )}
                        {n.type === "warning" && (
                          <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                        )}
                        {n.type === "info" && (
                          <Clock className="w-4 h-4 text-emerald-800 mt-0.5 shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-zinc-900">
                            {n.title}
                          </p>
                          <p className="text-[11px] text-zinc-600 mt-0.5 leading-snug">
                            {n.desc}
                          </p>
                          <span className="text-[10px] text-zinc-400 font-medium mt-1 inline-block">
                            ⏱ {n.time}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Profile Section */}
          <div className="relative">
            <button
              onClick={() => {
                setShowProfileMenu(!showProfileMenu);
                setShowNotifications(false);
              }}
              className="flex items-center gap-2 p-1 sm:px-2 sm:py-1 rounded-full border border-zinc-200 hover:bg-zinc-50 transition cursor-pointer"
            >
              <div className="relative">
                {managerPhotoUrl ? (
                  <img
                    src={managerPhotoUrl}
                    alt={managerName}
                    className="w-7 h-7 rounded-full object-cover border border-emerald-300 shadow-sm"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-emerald-800 to-emerald-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                    {managerName.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-1.5 ring-white"></span>
              </div>
              <div className="hidden lg:flex flex-col text-left">
                <span className="text-xs font-semibold text-zinc-800 leading-tight">
                  {managerName}
                </span>
                <span className="text-[10px] text-zinc-600">Center Manager</span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-zinc-400 hidden sm:block" />
            </button>

            {/* Profile Menu Dropdown */}
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-zinc-200 p-2 z-50">
                <div className="px-3 py-2 border-b border-zinc-100 flex items-center gap-2.5">
                  {managerPhotoUrl ? (
                    <img
                      src={managerPhotoUrl}
                      alt={managerName}
                      className="w-9 h-9 rounded-full object-cover border border-emerald-300 shadow-sm shrink-0"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-emerald-800 to-emerald-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {managerName.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className="overflow-hidden">
                    <p className="text-xs font-semibold text-zinc-900 truncate">
                      {managerName}
                    </p>
                    <p className="text-[11px] text-zinc-600 truncate">
                      {managerEmail}
                    </p>
                    <p className="text-[10px] text-emerald-700 font-medium truncate">
                      {managerCenter}
                    </p>
                  </div>
                </div>
                <div className="py-1">
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      setActiveTab("Settings");
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs text-emerald-800 font-semibold hover:bg-emerald-50 rounded-lg transition cursor-pointer flex items-center gap-1.5"
                  >
                    <span>Edit Profile / विवरण बदलें</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      setActiveTab("Centers");
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs text-zinc-700 hover:bg-zinc-100 rounded-lg transition cursor-pointer"
                  >
                    Center Profile & Bays
                  </button>
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      setActiveTab("Slots & Queue");
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs text-zinc-700 hover:bg-zinc-100 rounded-lg transition cursor-pointer"
                  >
                    Live Queue Control
                  </button>
                  {onLogout && (
                    <div className="pt-1 mt-1 border-t border-zinc-100">
                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          onLogout();
                        }}
                        className="w-full text-left px-3 py-1.5 text-xs text-rose-700 hover:bg-rose-50 rounded-lg transition cursor-pointer font-bold flex items-center gap-1.5"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Log Out</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Navigation Row */}
      <div className="md:hidden flex items-center overflow-x-auto px-4 py-2 bg-zinc-50 border-t border-zinc-100 gap-1.5">
        {navLinks.map((link) => {
          const isActive = activeTab === link.id;
          return (
            <button
              key={link.id}
              onClick={() => setActiveTab(link.id)}
              className={`px-3 py-1 text-xs font-medium rounded-full shrink-0 ${
                isActive
                  ? "bg-zinc-900 text-white font-semibold"
                  : "text-zinc-600 hover:bg-zinc-200/60"
              }`}
            >
              {link.name}
            </button>
          );
        })}
      </div>
    </header>
  );
}
