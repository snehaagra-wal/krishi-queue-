"use client";

import React from "react";
import {
  Calendar,
  MapPin,
  UserCheck,
  Radio,
  Clock,
  DownloadCloud,
  Layers,
  ChevronRight,
} from "lucide-react";

interface WelcomeHeaderProps {
  onExportReport?: () => void;
  onViewBays?: () => void;
  managerName?: string;
  managerCenter?: string;
  managerId?: string;
  managerPhotoUrl?: string;
}

export default function WelcomeHeader({
  onExportReport,
  onViewBays,
  managerName = "Saurabh",
  managerCenter = "APMC Mandi Hub",
  managerId = "MGR-501",
  managerPhotoUrl,
}: WelcomeHeaderProps) {
  const formattedDate = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 pt-1">
      {/* Title and Subtitle */}
      <div className="flex items-center gap-3.5">
        {managerPhotoUrl && (
          <img
            src={managerPhotoUrl}
            alt={managerName}
            className="w-12 h-12 rounded-full object-cover border-2 border-emerald-500 shadow-md shrink-0 hidden sm:block"
          />
        )}
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900">
            Welcome to Krishi-Queue
          </h1>
          <div className="flex flex-wrap items-center gap-y-1.5 gap-x-3 mt-1.5 text-xs sm:text-sm text-zinc-600">
            <div className="flex items-center gap-1.5 font-medium text-zinc-700">
              <Calendar className="w-4 h-4 text-emerald-700" />
              <span>{formattedDate}</span>
            </div>
            <span className="hidden sm:inline text-zinc-300">•</span>
            <div className="flex items-center gap-1.5 text-zinc-600">
              <MapPin className="w-3.5 h-3.5 text-emerald-700" />
              <span>Mandi Center: <strong className="text-zinc-800 font-semibold">{managerCenter}</strong></span>
            </div>
            <span className="hidden sm:inline text-zinc-300">•</span>
            <div className="flex items-center gap-1.5 text-zinc-600">
              <UserCheck className="w-3.5 h-3.5 text-emerald-700" />
              <span>Manager: <strong className="text-zinc-800 font-semibold">{managerName}</strong> (ID: {managerId})</span>
            </div>
          </div>
        </div>
      </div>

      {/* Live System Status & Quick Actions */}
      <div className="flex items-center gap-2.5 shrink-0">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-semibold shadow-xs">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
          </span>
          <span>Live Sync: 6/6 Bays Active</span>
        </div>

        <button
          onClick={onExportReport}
          className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-700 text-xs font-medium shadow-xs transition-colors cursor-pointer"
          title="Download today's gate receipt summary"
        >
          <DownloadCloud className="w-3.5 h-3.5 text-zinc-500" />
          <span>Daily Pass Summary</span>
        </button>
      </div>
    </div>
  );
}
