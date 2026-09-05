"use client";

import React, { useState } from "react";
import {
  Layers,
  ArrowUpRight,
  Sparkles,
  CheckCircle2,
  Clock,
  Radio,
  User,
  ShieldCheck,
  Play,
  Pause,
  RotateCw,
} from "lucide-react";

interface LiveQueueProgressionProps {
  onCallNext?: (tokenNumber: string) => void;
}

export default function LiveQueueProgression({ onCallNext }: LiveQueueProgressionProps) {
  const [currentTokenIndex, setCurrentTokenIndex] = useState<number>(108);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [recentCallAlert, setRecentCallAlert] = useState<string | null>(null);

  const totalSlotsToday = 142;
  const clearedTokens = currentTokenIndex - 24; // e.g. 84 cleared
  const progressPercent = Math.min(100, Math.round((clearedTokens / totalSlotsToday) * 100));

  const handleNextToken = () => {
    const nextVal = currentTokenIndex + 1;
    setCurrentTokenIndex(nextVal);
    const tokenStr = `#TK-${nextVal}`;
    setRecentCallAlert(`Token ${tokenStr} dispatched to Bay 3!`);
    if (onCallNext) {
      onCallNext(tokenStr);
    }
    setTimeout(() => {
      setRecentCallAlert(null);
    }, 3500);
  };

  const activeBays = [
    { name: "Bay 1 (Grading)", status: "Active", operator: "R. Verma", color: "bg-emerald-500" },
    { name: "Bay 2 (Moisture)", status: "Active", operator: "S. Rao", color: "bg-emerald-500" },
    { name: "Bay 3 (Weighbridge A)", status: "In Use", operator: "K. Singh", color: "bg-lime-500" },
    { name: "Bay 4 (Unloading Silo)", status: "Active", operator: "M. Das", color: "bg-emerald-500" },
  ];

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-zinc-200/80 shadow-xs flex flex-col justify-between h-full">
      {/* Top Title & Icon (Matching Dribbble layout) */}
      <div>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center border border-emerald-100 shadow-xs">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900">
                Live Token Progression
              </h3>
              <p className="text-[11px] text-zinc-600">
                Active gate & weighbridge workflow
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
            </span>
            <span className="text-[11px] font-semibold text-emerald-800">
              {isPaused ? "Paused" : "Live Feed"}
            </span>
          </div>
        </div>

        {/* Big Highlight Token Display */}
        <div className="mt-5 flex items-baseline justify-between gap-2">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black text-zinc-950 tracking-tight">
                #TK-{currentTokenIndex}
              </span>
              <span className="text-sm font-bold text-zinc-600">
                .03
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 ml-1">
                +12.5%
              </span>
            </div>
            <p className="text-xs text-zinc-600 mt-1 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Farmer: <strong className="text-zinc-800 font-semibold">Gurpreet Singh</strong> • Bay 3 (Weighbridge)
            </p>
          </div>
        </div>

        {/* Queue Progress Bar */}
        <div className="mt-4 pt-3 border-t border-zinc-100">
          <div className="flex items-center justify-between text-xs text-zinc-600 mb-1.5">
            <span className="font-medium">Daily Tokens Processed</span>
            <span className="font-bold text-zinc-900">
              {clearedTokens} / {totalSlotsToday} ({progressPercent}%)
            </span>
          </div>
          <div className="w-full bg-zinc-100 rounded-full h-2.5 overflow-hidden p-0.5 border border-zinc-200/60">
            <div
              className="bg-gradient-to-r from-emerald-700 via-emerald-600 to-lime-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-zinc-600 mt-1.5">
            <span>Expected wait: <strong className="text-zinc-700 font-semibold">~6 mins</strong></span>
            <span>Next in line: <strong className="text-emerald-800 font-semibold">#TK-{currentTokenIndex + 1}, #TK-{currentTokenIndex + 2}</strong></span>
          </div>
        </div>
      </div>

      {/* Alert toast if token called */}
      {recentCallAlert && (
        <div className="my-2 p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-medium flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{recentCallAlert}</span>
        </div>
      )}

      {/* Secondary Subsection: Active Operators & Action (Matching Dribbble "Mandatary Payments" style) */}
      <div className="mt-4 bg-zinc-50/90 rounded-2xl p-3.5 border border-zinc-200/60 flex items-center justify-between gap-3">
        <div>
          <h4 className="text-xs font-bold text-zinc-900">
            Active Gate Operators
          </h4>
          <p className="text-[11px] text-zinc-600">
            4 inspection counters active
          </p>

          {/* Avatar Stack like in Dribbble reference */}
          <div className="flex items-center -space-x-2 mt-2">
            <div className="w-6 h-6 rounded-full bg-emerald-800 border-2 border-white flex items-center justify-center text-[10px] font-bold text-white shadow-xs">
              RV
            </div>
            <div className="w-6 h-6 rounded-full bg-lime-600 border-2 border-white flex items-center justify-center text-[10px] font-bold text-white shadow-xs">
              SR
            </div>
            <div className="w-6 h-6 rounded-full bg-teal-800 border-2 border-white flex items-center justify-center text-[10px] font-bold text-white shadow-xs">
              KS
            </div>
            <div className="w-6 h-6 rounded-full bg-zinc-900 border-2 border-white flex items-center justify-center text-[9px] font-bold text-white shadow-xs">
              +4
            </div>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-col items-end gap-1.5">
          <button
            onClick={handleNextToken}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold shadow-sm transition-all hover:scale-105 active:scale-95 cursor-pointer"
            title="Call Next Farmer in Queue"
          >
            <span>Call Next</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setIsPaused(!isPaused)}
            className="text-[10px] text-zinc-600 hover:text-zinc-900 flex items-center gap-1 cursor-pointer"
          >
            {isPaused ? (
              <>
                <Play className="w-2.5 h-2.5 text-emerald-600" /> Resume Queue
              </>
            ) : (
              <>
                <Pause className="w-2.5 h-2.5 text-zinc-400" /> Pause Dispatch
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
