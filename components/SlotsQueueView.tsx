"use client";

import React, { useState, useEffect } from "react";
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
  ChevronRight,
  Check,
} from "lucide-react";
import {
  subscribeToCheckins,
  callNextWaitingToken,
  subscribeToSlots,
  createSlot,
  updateCheckin,
  calculateMspPayout,
  getCropMspRate,
  generateGateNames,
  CheckinItem,
  SlotSchedule,
  INITIAL_SLOTS,
} from "@/lib/firestoreService";

interface SlotsQueueViewProps {
  onReturnToDashboard?: () => void;
  showToast?: (message: string) => void;
}

export default function SlotsQueueView({
  onReturnToDashboard,
  showToast,
}: SlotsQueueViewProps) {
  const [isQueuePaused, setIsQueuePaused] = useState(false);
  const [tokens, setTokens] = useState<CheckinItem[]>([]);
  const [slots, setSlots] = useState<SlotSchedule[]>(INITIAL_SLOTS);
  const [loading, setLoading] = useState(true);
  const [isCallingNext, setIsCallingNext] = useState(false);

  const [rawCheckins, setRawCheckins] = useState<CheckinItem[]>([]);

  // 1. Subscribe to checkins & filter active queue
  useEffect(() => {
    const unsubCheckins = subscribeToCheckins((allCheckins) => {
      setRawCheckins(allCheckins || []);
      // Active queue includes Waiting, Called, Serving, In Progress
      const active = (allCheckins || []).filter(
        (c) =>
          c.status === "Waiting" ||
          c.status === "Called" ||
          c.status === "Serving" ||
          c.status === "In Progress"
      );
      setTokens(active);
      setLoading(false);
    });

    const unsubSlots = subscribeToSlots((allSlots) => {
      if (allSlots && allSlots.length > 0) {
        setSlots(allSlots);
      }
    });

    return () => {
      unsubCheckins();
      unsubSlots();
    };
  }, []);

  // 2. Call Next Token via Firestore
  const handleCallNextToken = async () => {
    setIsCallingNext(true);
    try {
      const called = await callNextWaitingToken("Bay 2 (Inspection)");
      if (called) {
        if (showToast) {
          showToast(`Token #${called.tokenId} called to ${called.bay}!`);
        }
      }
    } catch (err: any) {
      console.error("Failed to call next token:", err);
      if (showToast) showToast("Error calling next token: " + err.message);
    } finally {
      setIsCallingNext(false);
    }
  };

  const handleTogglePause = () => {
    const nextState = !isQueuePaused;
    setIsQueuePaused(nextState);
    if (showToast) {
      showToast(nextState ? "Queue dispatch paused at Gate 1-A." : "Queue dispatch resumed.");
    }
  };

  const handleAddEmergencySlot = async () => {
    try {
      await createSlot({
        timeWindow: "04:30 PM - 05:30 PM (Special Overtime)",
        capacity: 10,
        booked: 2,
        status: "Upcoming",
      });
      if (showToast) {
        showToast("Emergency procurement slot saved to Firestore!");
      }
    } catch (err: any) {
      console.error("Failed to add emergency slot:", err);
      if (showToast) showToast("Failed to add slot: " + err.message);
    }
  };

  const handleAdvanceStatus = async (item: CheckinItem) => {
    try {
      if (item.status === "Waiting") {
        await updateCheckin(item.id, { status: "Called", bay: "Bay 2 (Inspection)" });
        showToast?.(`Token #${item.tokenId} called to Bay 2`);
      } else if (item.status === "Called") {
        await updateCheckin(item.id, { status: "Serving", bay: "Bay 3 (Weighbridge)" });
        showToast?.(`Token #${item.tokenId} moved to Weighbridge`);
      } else if (item.status === "Serving" || item.status === "In Progress") {
        const qty = item.quantityNum || parseFloat(item.quantity) || 35;
        const payout = calculateMspPayout(item.cropType || "Wheat", qty);
        await updateCheckin(item.id, {
          status: "Completed",
          bay: "Bay 1 (Cleared)",
          paymentStatus: "Credited",
          mspRate: payout.mspRate,
          paymentAmount: payout.totalAmount,
          totalPayout: payout.totalAmount,
          transactionId: `DBT-2026-APMC-${item.tokenId.replace(/\D/g, "") || "84"}`,
          payout: `${payout.formattedTotal} (Credited DBT)`,
        });
        showToast?.(`Token #${item.tokenId} completed and cleared: ${payout.formattedTotal}`);
      }
    } catch (err: any) {
      console.error("Error advancing status:", err);
    }
  };

  // Find currently serving token
  const currentServing = tokens.find((t) => t.status === "Serving" || t.status === "In Progress");

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
            Real-time gate dispatch control, token succession, and hourly booking schedules (Firestore Powered).
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

      {/* Action Buttons Panel */}
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
              Current Serving: <strong className="text-emerald-800 font-bold">{currentServing ? `#${currentServing.tokenId}` : "None in Bay"}</strong> • {tokens.length} Vehicles in Yard
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Action 1: Call Next Token */}
          <button
            type="button"
            disabled={isCallingNext}
            onClick={handleCallNextToken}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 text-white text-xs font-bold rounded-full shadow-xs transition cursor-pointer active:scale-95"
          >
            {isCallingNext ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Calling...</span>
              </>
            ) : (
              <>
                <ArrowRight className="w-3.5 h-3.5" />
                <span>Call Next Token</span>
              </>
            )}
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

      {/* Main Grid: Section 1 & Section 2 */}
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
                    Ordered by arrival & priority (Real-time)
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                {tokens.length} In Queue
              </span>
            </div>

            {/* Tokens List */}
            <div className="divide-y divide-zinc-100 mt-2 space-y-1">
              {tokens.length === 0 ? (
                <div className="py-8 text-center text-xs text-zinc-500">
                  {loading ? "Syncing with Firestore..." : "No active vehicles waiting in queue."}
                </div>
              ) : (
                tokens.map((token) => (
                  <div
                    key={token.id}
                    className="py-3 flex items-center justify-between gap-3 hover:bg-zinc-50/80 px-2 rounded-xl transition group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col items-center justify-center w-12 h-11 bg-zinc-50 border border-zinc-200 rounded-xl font-mono font-bold text-xs text-zinc-900">
                        {token.tokenId}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-zinc-900">
                          {token.farmerName}
                        </div>
                        <div className="text-[11px] text-zinc-600 flex items-center gap-1.5 flex-wrap">
                          <span>{token.cropType} ({token.quantity}) • {token.vehicle || "Tractor"}</span>
                          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                            MSP ₹{getCropMspRate(token.cropType)}/Q
                          </span>
                        </div>
                        <div className="text-[10px] text-zinc-600">
                          Location: <strong className="text-zinc-700">{token.bay}</strong>
                        </div>
                      </div>
                    </div>

                    <div className="text-right flex flex-col items-end gap-1">
                      {token.status === "Serving" || token.status === "In Progress" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                          Serving
                        </span>
                      ) : token.status === "Called" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-lime-50 text-lime-800 border border-lime-300">
                          Called
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-zinc-100 text-zinc-700 border border-zinc-200">
                          Waiting
                        </span>
                      )}

                      <button
                        onClick={() => handleAdvanceStatus(token)}
                        className="text-[10px] text-emerald-700 hover:text-emerald-900 font-bold underline cursor-pointer"
                        title="Advance status"
                      >
                        Advance &rarr;
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-zinc-100 text-[11px] text-zinc-600 flex items-center justify-between">
            <span>
              Next expected call in:{" "}
              <strong className="text-zinc-800 font-semibold">
                {tokens.length === 0 ? "Queue is empty (Ready)" : "~4 mins"}
              </strong>
            </span>
            <button
              onClick={handleCallNextToken}
              disabled={tokens.length === 0}
              className="text-emerald-800 font-bold hover:underline disabled:opacity-40 disabled:no-underline cursor-pointer"
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
                  Capacity allocation per hourly Mandi window (Live Checkins Synchronized)
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
                  const windowStart = slot.timeWindow.split(" - ")[0];
                  const liveCount = rawCheckins.filter(
                    (c) => c.slotTime === slot.timeWindow || (c.slotTime && c.slotTime.includes(windowStart))
                  ).length;
                  const currentBooked = Math.max(slot.booked, liveCount);
                  const percent =
                    slot.capacity > 0
                      ? Math.round((currentBooked / slot.capacity) * 100)
                      : 0;

                  return (
                    <tr
                      key={slot.id || index}
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
                            <strong className="text-zinc-900">{currentBooked}</strong> / {slot.capacity} Slots
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
