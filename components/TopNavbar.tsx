"use client";

import React, { useState } from "react";
import {
  Bell,
  Settings,
  ChevronDown,
  CheckCircle2,
  Clock,
  AlertTriangle,
  LogOut,
} from "lucide-react";

interface TopNavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout?: () => void;
}

export default function TopNavbar({ activeTab, setActiveTab, onLogout }: TopNavbarProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const navLinks = [
    { name: "Overview", id: "Overview" },
    { name: "Centers", id: "Centers" },
    { name: "Farmers", id: "Farmers" },
    { name: "Slots & Queue", id: "Slots & Queue" },
    { name: "Analytics", id: "Analytics" },
  ];

  const notifications = [
    {
      id: 1,
      title: "Bay 3 Weighbridge Cleared",
      desc: "Token #TK-107 completed weighing (38.5 Quintals).",
      time: "2 mins ago",
      type: "success",
    },
    {
      id: 2,
      title: "Queue Delay Warning",
      desc: "Moisture test bay has 4 farmers waiting. Action required.",
      time: "12 mins ago",
      type: "warning",
    },
    {
      id: 3,
      title: "Daily Procurement Quota",
      desc: "Center has reached 85% of target wheat procurement.",
      time: "35 mins ago",
      type: "info",
    },
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
              }}
              className="relative p-2 rounded-full border border-zinc-200 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 transition-colors cursor-pointer"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-600 ring-2 ring-white"></span>
            </button>

            {/* Notifications Dropdown Modal */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-88 bg-white rounded-2xl shadow-2xl border border-zinc-200 p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-zinc-900">
                      Center Alerts
                    </span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded-full">
                      3 New
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
                  {notifications.map((n) => (
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
                      <div className="flex-1">
                        <p className="text-xs font-medium text-zinc-900">
                          {n.title}
                        </p>
                        <p className="text-[11px] text-zinc-600 mt-0.5">
                          {n.desc}
                        </p>
                        <span className="text-[10px] text-zinc-600 font-medium">
                          {n.time}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-2 border-t border-zinc-100 text-center">
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="text-xs font-medium text-emerald-700 hover:text-emerald-800 cursor-pointer"
                  >
                    View All Mandi Notifications &rarr;
                  </button>
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
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-emerald-800 to-emerald-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                  RS
                </div>
                <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-1.5 ring-white"></span>
              </div>
              <div className="hidden lg:flex flex-col text-left">
                <span className="text-xs font-semibold text-zinc-800 leading-tight">
                  Rajesh Sharma
                </span>
                <span className="text-[10px] text-zinc-600">Chief Officer</span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-zinc-400 hidden sm:block" />
            </button>

            {/* Profile Menu Dropdown */}
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-zinc-200 p-2 z-50">
                <div className="px-3 py-2 border-b border-zinc-100">
                  <p className="text-xs font-semibold text-zinc-900">
                    Rajesh Sharma
                  </p>
                  <p className="text-[11px] text-zinc-600">
                    rajesh.sharma@apmc-karnal.gov.in
                  </p>
                  <p className="text-[10px] text-emerald-700 font-medium mt-1">
                    APMC Karnal Hub • Yard #4
                  </p>
                </div>
                <div className="py-1">
                  <button
                    onClick={() => setShowProfileMenu(false)}
                    className="w-full text-left px-3 py-1.5 text-xs text-zinc-700 hover:bg-zinc-100 rounded-lg transition cursor-pointer"
                  >
                    Center Profile & Bays
                  </button>
                  <button
                    onClick={() => setShowProfileMenu(false)}
                    className="w-full text-left px-3 py-1.5 text-xs text-zinc-700 hover:bg-zinc-100 rounded-lg transition cursor-pointer"
                  >
                    Weighbridge Calibration
                  </button>
                  <button
                    onClick={() => setShowProfileMenu(false)}
                    className="w-full text-left px-3 py-1.5 text-xs text-zinc-700 hover:bg-zinc-100 rounded-lg transition cursor-pointer"
                  >
                    Operator Roster
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
