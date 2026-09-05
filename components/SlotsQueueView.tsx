"use client";

import React, { useState } from "react";
import {
  CalendarDays,
  Clock,
  Play,
  Pause,
  ArrowRight,
  PlusCircle,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Truck,
  Users,
  Layers,
  Sparkles,
} from "lucide-react";

interface SlotsQueueViewProps {
  onReturnToDashboard?: () => void;
  showToast?: (message: string) => void;
}

interface QueueToken {
  id: string;
  tokenId: string;
  farmerName: string;
  crop: string;
  vehicle: string;
  bay: string;
  status: "Serving" | "Called" | "Waiting";
  arrivalTime: string;
}

interface SlotSchedule {
  timeWindow: string;
  capacity: number;
  booked: number;
  status: "Completed" | "In Progress" | "Upcoming" | "Break";
}

export default function SlotsQueueView({
  onReturnToDashboard,
  showToast,
}: SlotsQueueViewProps) {
  const [isQueuePaused, setIsQueuePaused] = useState(false);

  // 1. Current Active Queue Tokens state
  const [tokens, setTokens] = useState<QueueToken[]>([
    {
      id: "1",
      tokenId: "TK-108",
      farmerName: "Gurpreet Singh",
      crop: "Wheat (42Q)",
      vehicle: "HR-05-AB-1290",
      bay: "Bay 3 (Weighbridge A)",
      status: "Serving",
      arrivalTime: "09:45 AM",
    },
    {
      id: "2",
      tokenId: "TK-109",
      farmerName: "Balwinder Sandhu",
      crop: "Mustard (28Q)",
      vehicle: "HR-05-XY-4421",
      bay: "Bay 1 (Grading Bay)",
      status: "Called",
      arrivalTime: "09:52 AM",
    },
    {
      id: "3",
      tokenId: "TK-110",
      farmerName: "Rameshwar Patel",
      crop: "Paddy (35Q)",
      vehicle: "HR-05-C-8812",
      bay: "Gate 1-A (Next)",
      status: "Waiting",
      arrivalTime: "10:02 AM",
    },
    {
      id: "4",
      tokenId: "TK-111",
      farmerName: "Sukhdev Yadav",
      crop: "Wheat (50Q)",
      vehicle: "HR-05-TR-2391",
      bay: "Yard Bay B",
      status: "Waiting",
      arrivalTime: "10:10 AM",
    },
    {
      id: "5",
      tokenId: "TK-112",
      farmerName: "Harpreet Kaur",
      crop: "Paddy (40Q)",
      vehicle: "HR-05-JK-9014",
      bay: "Gate 1-A (Waiting)",
      status: "Waiting",
      arrivalTime: "10:15 AM",
    },
  ]);

  // 2. Time Slot Schedule state
  const [slots, setSlots] = useState<SlotSchedule[]>([
    { timeWindow: "08:00 AM - 09:00 AM", capacity: 25, booked: 25, status: "Completed" },
    { timeWindow: "09:00 AM - 10:00 AM", capacity: 25, booked: 25, status: "Completed" },
    { timeWindow: "10:00 AM - 11:00 AM", capacity: 25, booked: 25, status: "In Progress" },
    { timeWindow: "11:00 AM - 12:00 PM", capacity: 25, booked: 22, status: "Upcoming" },
    { timeWindow: "12:00 PM - 01:00 PM", capacity: 0, booked: 0, status: "Break" },
    { timeWindow: "01:00 PM - 02:00 PM", capacity: 25, booked: 20, status: "Upcoming" },
    { timeWindow: "02:00 PM - 03:00 PM", capacity: 25, booked: 16, status: "Upcoming" },
    { timeWindow: "03:00 PM - 04:00 PM", capacity: 25, booked: 9, status: "Upcoming" },
  ]);

  // 3. Queue Action Handlers
  const handleCallNextToken = () => {
    // Find first 'Waiting' token and set to 'Called', or advance
    const waitingIdx = tokens.findIndex((t) => t.status === "Waiting");
    if (waitingIdx !== -1) {
      const updated = [...tokens];
      updated[waitingIdx].status = "Called";
      updated[waitingIdx].bay = "Bay 2 (Inspection)";
      setTokens(updated);
      if (showToast) {
        showToast(`Token ${updated[waitingIdx].tokenId} called to Bay 2!`);
      }
    } else {
      // Generate new sequential token
      const nextNum = tokens.length + 108;
      const newToken: QueueToken = {
        id: String(Date.now()),
        tokenId: `TK-${nextNum}`,
        farmerName: "Jasbir Chahal",
        crop: "Wheat (38Q)",
        vehicle: "HR-05-MH-6612",
        bay: "Gate 1-A",
        status: "Called",
        arrivalTime: "Just Now",
      };
      setTokens([...tokens, newToken]);
      if (showToast) {
        showToast(`New Token #${newToken.tokenId} generated and called!`);
      }
    }
  };

  const handleTogglePause = () => {
    const nextState = !isQueuePaused;
    setIsQueuePaused(nextState);
    if (showToast) {
      showToast(nextState ? "Queue dispatch paused at Gate 1-A." : "Queue dispatch resumed.");
    }
  };

  const handleAddEmergencySlot = () => {
    const updated = [...slots];
    updated.push({
      timeWindow: "04:30 PM - 05:30 PM (Special Overtime)",
      capacity: 10,
      booked: 2,
      status: "Upcoming",
    });
    setSlots(updated);
    if (showToast) {
      showToast("Emergency procurement slot added successfully!");
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-200/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900">
              Slots & Queue Management
            </h1>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                isQueuePaused
                  ? "bg-amber-100 text-amber-800 border-amber-300"
                  : "bg-emerald-100 text-emerald-800 border-emerald-300"
              }`}
            >
              {isQueuePaused ? "● Queue Paused" : "● Live Queue Active"}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-600 mt-1">
            Real-time gate dispatch control, token succession, and hourly booking schedules.
          </p>
        </div>

        {onReturnToDashboard && (
          <button
            onClick={onReturnToDashboard}
            className="self-start sm:self-auto px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold rounded-full shadow-xs transition cursor-pointer"
          >
            &larr; Back to Dashboard
          </button>
        )}
      </div>

      {/* Action Buttons Panel (Section 3: Simple action buttons to manage queue status) */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-zinc-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center border border-emerald-100">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-zinc-900">
              Mandi Queue Dispatch Controls
            </div>
            <div className="text-[11px] text-zinc-600">
              Current Serving: <strong className="text-emerald-800 font-bold">#TK-108</strong> • 18 Vehicles in Yard
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Action 1: Call Next Token */}
          <button
            type="button"
            onClick={handleCallNextToken}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-full shadow-xs transition cursor-pointer active:scale-95"
          >
            <ArrowRight className="w-3.5 h-3.5" />
            <span>Call Next Token</span>
          </button>

          {/* Action 2: Pause / Resume Queue */}
          <button
            type="button"
            onClick={handleTogglePause}
            className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-full border transition cursor-pointer ${
              isQueuePaused
                ? "bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100"
                : "bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100"
            }`}
          >
            {isQueuePaused ? (
              <>
                <Play className="w-3.5 h-3.5 text-emerald-700" />
                <span>Resume Dispatch</span>
              </>
            ) : (
              <>
                <Pause className="w-3.5 h-3.5 text-amber-700" />
                <span>Pause Queue</span>
              </>
            )}
          </button>

          {/* Action 3: Open Emergency Slot */}
          <button
            type="button"
            onClick={handleAddEmergencySlot}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-800 text-xs font-bold rounded-full shadow-xs transition cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5 text-emerald-700" />
            <span>+ Emergency Slot</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Section 1 (Current Active Queue Tokens List) & Section 2 (Time Slot Booking Status Table) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* SECTION 1: Current Active Queue Tokens List (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-5 sm:p-6 border border-zinc-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-zinc-900">
                    Active Queue Tokens
                  </h2>
                  <p className="text-[11px] text-zinc-600">
                    Ordered by arrival & priority
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                {tokens.length} In Queue
              </span>
            </div>

            {/* Tokens List */}
            <div className="divide-y divide-zinc-100 mt-2 space-y-1">
              {tokens.map((token) => (
                <div
                  key={token.id}
                  className="py-3 flex items-center justify-between gap-3 hover:bg-zinc-50/80 px-2 rounded-xl transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col items-center justify-center w-12 h-11 bg-zinc-50 border border-zinc-200 rounded-xl font-mono font-bold text-xs text-zinc-900">
                      {token.tokenId}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-zinc-900">
                        {token.farmerName}
                      </div>
                      <div className="text-[11px] text-zinc-600">
                        {token.crop} • {token.vehicle}
                      </div>
                      <div className="text-[10px] text-zinc-600">
                        Location: <strong className="text-zinc-700">{token.bay}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    {token.status === "Serving" && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                        Serving
                      </span>
                    )}
                    {token.status === "Called" && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-lime-50 text-lime-800 border border-lime-300">
                        Called
                      </span>
                    )}
                    {token.status === "Waiting" && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-zinc-100 text-zinc-700 border border-zinc-200">
                        Waiting
                      </span>
                    )}
                    <div className="text-[10px] text-zinc-600 mt-1">
                      {token.arrivalTime}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-zinc-100 text-[11px] text-zinc-600 flex items-center justify-between">
            <span>Next expected call in: <strong className="text-zinc-800 font-semibold">~4 mins</strong></span>
            <button
              onClick={handleCallNextToken}
              className="text-emerald-800 font-bold hover:underline cursor-pointer"
            >
              Advance Queue &rarr;
            </button>
          </div>
        </div>

        {/* SECTION 2: Time Slot Booking Status Table (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-5 sm:p-6 border border-zinc-200/80 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-zinc-900">
                  Time Slot Booking Status (Today)
                </h2>
                <p className="text-[11px] text-zinc-600">
                  Capacity allocation per hourly Mandi window
                </p>
              </div>
            </div>
            <span className="text-xs text-zinc-600 font-semibold">
              Max: 25 Vehicles / Hour
            </span>
          </div>

          {/* Slots Table */}
          <div className="overflow-x-auto mt-2">
            <table className="w-full text-left text-xs border-collapse min-w-[500px]">
              <thead>
                <tr className="border-b border-zinc-200/80 text-[11px] font-bold text-zinc-600 uppercase tracking-wider bg-zinc-50/50">
                  <th className="py-2.5 px-3">Slot Window</th>
                  <th className="py-2.5 px-3">Booked / Total</th>
                  <th className="py-2.5 px-3">Capacity Fill</th>
                  <th className="py-2.5 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {slots.map((slot, index) => {
                  const percent =
                    slot.capacity > 0
                      ? Math.round((slot.booked / slot.capacity) * 100)
                      : 0;

                  return (
                    <tr
                      key={index}
                      className={`hover:bg-zinc-50/70 transition-colors ${
                        slot.status === "In Progress" ? "bg-emerald-50/30" : ""
                      }`}
                    >
                      {/* Slot Window */}
                      <td className="py-3 px-3 font-semibold text-zinc-900">
                        {slot.timeWindow}
                      </td>

                      {/* Booked / Total */}
                      <td className="py-3 px-3 text-zinc-700">
                        {slot.capacity > 0 ? (
                          <span>
                            <strong className="text-zinc-900">{slot.booked}</strong> / {slot.capacity} Slots
                          </span>
                        ) : (
                          <span className="text-zinc-600 italic">Calibration Break</span>
                        )}
                      </td>

                      {/* Capacity Progress Bar */}
                      <td className="py-3 px-3 w-40">
                        {slot.capacity > 0 ? (
                          <div>
                            <div className="flex items-center justify-between text-[10px] font-medium text-zinc-600 mb-1">
                              <span>{percent}% Filled</span>
                            </div>
                            <div className="w-full bg-zinc-100 rounded-full h-2 overflow-hidden border border-zinc-200">
                              <div
                                className={`h-full rounded-full ${
                                  percent >= 100
                                    ? "bg-zinc-800"
                                    : percent >= 80
                                    ? "bg-emerald-600"
                                    : "bg-lime-500"
                                }`}
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                          </div>
                        ) : (
                          <span className="text-[11px] text-zinc-600">—</span>
                        )}
                      </td>

                      {/* Status Badge */}
                      <td className="py-3 px-3 text-right">
                        {slot.status === "Completed" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-zinc-100 text-zinc-700 border border-zinc-200">
                            Completed
                          </span>
                        )}
                        {slot.status === "In Progress" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                            Active Now
                          </span>
                        )}
                        {slot.status === "Upcoming" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-lime-50 text-lime-800 border border-lime-300">
                            Open
                          </span>
                        )}
                        {slot.status === "Break" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            Break
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
