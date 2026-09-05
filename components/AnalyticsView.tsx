"use client";

import React, { useState } from "react";
import {
  Wheat,
  Clock,
  Calendar,
  ArrowDownRight,
  ArrowUpRight,
  TrendingUp,
  Truck,
  CheckCircle2,
  Filter,
} from "lucide-react";

interface AnalyticsViewProps {
  onReturnToDashboard?: () => void;
}

export default function AnalyticsView({ onReturnToDashboard }: AnalyticsViewProps) {
  const [selectedCropFilter, setSelectedCropFilter] = useState<"all" | "wheat" | "paddy">("all");

  // 1. Weekly breakdown data (clean, straightforward)
  const weeklyData = [
    { day: "Monday", date: "31 Aug", wheat: 240, paddy: 150, trucks: 38, peak: "10 AM - 12 PM" },
    { day: "Tuesday", date: "01 Sep", wheat: 280, paddy: 170, trucks: 42, peak: "11 AM - 01 PM" },
    { day: "Wednesday", date: "02 Sep", wheat: 220, paddy: 140, trucks: 34, peak: "09 AM - 11 AM" },
    { day: "Thursday", date: "03 Sep", wheat: 310, paddy: 190, trucks: 46, peak: "01 PM - 03 PM" },
    { day: "Friday", date: "04 Sep", wheat: 260, paddy: 160, trucks: 39, peak: "10 AM - 12 PM" },
    { day: "Saturday (Today)", date: "05 Sep", wheat: 210, paddy: 120, trucks: 32, peak: "11 AM - 01 PM" },
  ];

  // Totals calculation
  const totalWheat = weeklyData.reduce((acc, curr) => acc + curr.wheat, 0); // 1,520 Q
  const totalPaddy = weeklyData.reduce((acc, curr) => acc + curr.paddy, 0); // 930 Q
  const totalGrain = totalWheat + totalPaddy; // 2,450 Q
  const totalTrucks = weeklyData.reduce((acc, curr) => acc + curr.trucks, 0);

  const wheatPercent = Math.round((totalWheat / totalGrain) * 100);
  const paddyPercent = 100 - wheatPercent;

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-200">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-200/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900">
              Procurement Analytics
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
              Weekly Overview
            </span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-600 mt-1">
            Simple breakdown of crop arrivals, wait times, and daily Mandi intake (31 Aug – 05 Sep).
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

      {/* Top Grid: Section 1 (Procurement Stats) & Section 2 (Average Wait Time) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Section 1: Total Procurement Stats (Wheat vs Paddy totals) - 7 cols */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-5 sm:p-6 border border-zinc-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center border border-emerald-100">
                  <Wheat className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-zinc-900">
                    Total Procurement Stats
                  </h2>
                  <p className="text-xs text-zinc-500">
                    Wheat vs Paddy intake for this week
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                2,450 Quintals Total
              </span>
            </div>

            {/* Split Comparison Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-2">
              {/* Wheat Card */}
              <div className="bg-[#f7faf6] rounded-2xl p-4 border border-lime-200/80">
                <div className="flex items-center justify-between text-xs text-zinc-600 font-semibold mb-1">
                  <span className="flex items-center gap-1.5 text-zinc-800">
                    <span className="w-2.5 h-2.5 rounded-full bg-lime-500"></span>
                    Sharbati & Mill Wheat
                  </span>
                  <span className="text-lime-700 font-bold">{wheatPercent}%</span>
                </div>
                <div className="text-2xl font-black text-zinc-900 mt-1">
                  {totalWheat.toLocaleString()} <span className="text-xs font-semibold text-zinc-500">Quintals</span>
                </div>
                <p className="text-[11px] text-zinc-500 mt-1">
                  Average MSP: ₹2,275 / Q • 142 Farmer Batches
                </p>
              </div>

              {/* Paddy Card */}
              <div className="bg-[#f3f8f5] rounded-2xl p-4 border border-emerald-200/80">
                <div className="flex items-center justify-between text-xs text-zinc-600 font-semibold mb-1">
                  <span className="flex items-center gap-1.5 text-zinc-800">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-700"></span>
                    Basmati & Paddy Grain
                  </span>
                  <span className="text-emerald-800 font-bold">{paddyPercent}%</span>
                </div>
                <div className="text-2xl font-black text-zinc-900 mt-1">
                  {totalPaddy.toLocaleString()} <span className="text-xs font-semibold text-zinc-500">Quintals</span>
                </div>
                <p className="text-[11px] text-zinc-500 mt-1">
                  Average MSP: ₹3,850 / Q • 89 Farmer Batches
                </p>
              </div>
            </div>

            {/* Visual Ratio Progress Bar */}
            <div className="mt-5">
              <div className="flex justify-between text-xs font-semibold text-zinc-600 mb-1.5">
                <span>Wheat ({wheatPercent}%)</span>
                <span>Paddy ({paddyPercent}%)</span>
              </div>
              <div className="w-full h-3 rounded-full bg-zinc-100 flex overflow-hidden p-0.5 border border-zinc-200">
                <div
                  className="bg-lime-500 h-full rounded-l-full transition-all duration-500"
                  style={{ width: `${wheatPercent}%` }}
                />
                <div
                  className="bg-emerald-700 h-full rounded-r-full transition-all duration-500"
                  style={{ width: `${paddyPercent}%` }}
                />
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-600">
            <span className="flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-emerald-700" />
              <span>Total vehicles processed: <strong className="text-zinc-800">{totalTrucks} Trucks/Trolleys</strong></span>
            </span>
            <span className="text-emerald-800 font-semibold">
              100% Target Met
            </span>
          </div>
        </div>

        {/* Section 2: Average Wait Time Card - 5 cols */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-5 sm:p-6 border border-zinc-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center border border-amber-100">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-zinc-900">
                    Average Wait Time
                  </h2>
                  <p className="text-xs text-zinc-500">
                    Gate check-in to weighbridge clearance
                  </p>
                </div>
              </div>
            </div>

            {/* Big Wait Time Display */}
            <div className="my-3">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl sm:text-5xl font-black tracking-tight text-zinc-900">
                  14.2
                </span>
                <span className="text-base font-bold text-zinc-600">
                  Minutes
                </span>
                <span className="ml-1 inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <ArrowDownRight className="w-3.5 h-3.5" /> -3.8m
                </span>
              </div>
              <p className="text-xs text-zinc-600 mt-1 font-medium">
                Faster than standard Mandi guideline (18.0 mins target).
              </p>
            </div>

            {/* Dwell Breakdown Steps */}
            <div className="space-y-2 mt-4 pt-3 border-t border-zinc-100 text-xs">
              <div className="flex justify-between items-center py-1">
                <span className="text-zinc-600">1. Gate Entry & QR Token:</span>
                <span className="font-semibold text-zinc-800">2.5 mins</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-zinc-600">2. Moisture & Quality Test:</span>
                <span className="font-semibold text-zinc-800">4.2 mins</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-zinc-600">3. Electronic Weighbridge A/B:</span>
                <span className="font-semibold text-zinc-800">5.0 mins</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-zinc-600">4. Unloading & e-Gate Pass:</span>
                <span className="font-semibold text-zinc-800">2.5 mins</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500">
            <span className="flex items-center gap-1.5 text-emerald-700 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Optimal flow across all 6 bays</span>
            </span>
            <span className="text-[11px]">Updated 5m ago</span>
          </div>
        </div>
      </div>

      {/* Section 3: Simple Weekly Breakdown Table of Grain Arrivals */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-zinc-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-100">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-zinc-900">
                Weekly Grain Arrivals Breakdown
              </h2>
              <span className="text-xs bg-zinc-100 text-zinc-700 font-semibold px-2 py-0.5 rounded-full">
                Past 6 Days
              </span>
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">
              Daily incoming volume, truck counts, and peak traffic hours at APMC Karnal Hub.
            </p>
          </div>

          {/* Simple Crop Filter */}
          <div className="flex items-center gap-1 bg-zinc-100/80 p-1 rounded-full border border-zinc-200 text-xs self-start sm:self-auto">
            <button
              onClick={() => setSelectedCropFilter("all")}
              className={`px-3 py-1 rounded-full font-medium transition cursor-pointer ${
                selectedCropFilter === "all"
                  ? "bg-white text-zinc-900 font-bold shadow-xs"
                  : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              All Crops
            </button>
            <button
              onClick={() => setSelectedCropFilter("wheat")}
              className={`px-3 py-1 rounded-full font-medium transition cursor-pointer ${
                selectedCropFilter === "wheat"
                  ? "bg-white text-lime-800 font-bold shadow-xs"
                  : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              Wheat Only
            </button>
            <button
              onClick={() => setSelectedCropFilter("paddy")}
              className={`px-3 py-1 rounded-full font-medium transition cursor-pointer ${
                selectedCropFilter === "paddy"
                  ? "bg-white text-emerald-800 font-bold shadow-xs"
                  : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              Paddy Only
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto mt-3">
          <table className="w-full text-left text-xs border-collapse min-w-[580px]">
            <thead>
              <tr className="border-b border-zinc-200/80 text-[11px] font-bold text-zinc-600 uppercase tracking-wider bg-zinc-50/50">
                <th className="py-3 px-4">Day & Date</th>
                {(selectedCropFilter === "all" || selectedCropFilter === "wheat") && (
                  <th className="py-3 px-3">Wheat (Q)</th>
                )}
                {(selectedCropFilter === "all" || selectedCropFilter === "paddy") && (
                  <th className="py-3 px-3">Paddy (Q)</th>
                )}
                <th className="py-3 px-3">Total Inflow</th>
                <th className="py-3 px-3">Trucks</th>
                <th className="py-3 px-3">Peak Arrival Window</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {weeklyData.map((row, index) => {
                const rowTotal =
                  selectedCropFilter === "wheat"
                    ? row.wheat
                    : selectedCropFilter === "paddy"
                    ? row.paddy
                    : row.wheat + row.paddy;

                const isToday = row.day.includes("Today");

                return (
                  <tr
                    key={row.day}
                    className={`transition-colors hover:bg-zinc-50/80 ${
                      isToday ? "bg-emerald-50/30 font-semibold" : ""
                    }`}
                  >
                    <td className="py-3 px-4">
                      <div className="font-bold text-zinc-900 flex items-center gap-1.5">
                        <span>{row.day}</span>
                        {isToday && (
                          <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                        )}
                      </div>
                      <div className="text-[11px] text-zinc-600 font-normal">
                        {row.date}, 2026
                      </div>
                    </td>

                    {(selectedCropFilter === "all" || selectedCropFilter === "wheat") && (
                      <td className="py-3 px-3 font-semibold text-lime-900">
                        {row.wheat} Q
                      </td>
                    )}

                    {(selectedCropFilter === "all" || selectedCropFilter === "paddy") && (
                      <td className="py-3 px-3 font-semibold text-emerald-900">
                        {row.paddy} Q
                      </td>
                    )}

                    <td className="py-3 px-3 font-bold text-zinc-900">
                      {rowTotal} Quintals
                    </td>

                    <td className="py-3 px-3 text-zinc-700">
                      {row.trucks} Vehicles
                    </td>

                    <td className="py-3 px-3 text-zinc-600">
                      {row.peak}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Cleared
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>

            {/* Table Summary Footer Row */}
            <tfoot>
              <tr className="border-t-2 border-zinc-200 font-bold text-zinc-900 bg-zinc-50">
                <td className="py-3 px-4">Total (Week Summary)</td>
                {(selectedCropFilter === "all" || selectedCropFilter === "wheat") && (
                  <td className="py-3 px-3 text-lime-900">{totalWheat} Q</td>
                )}
                {(selectedCropFilter === "all" || selectedCropFilter === "paddy") && (
                  <td className="py-3 px-3 text-emerald-900">{totalPaddy} Q</td>
                )}
                <td className="py-3 px-3">{totalGrain} Quintals</td>
                <td className="py-3 px-3">{totalTrucks} Vehicles</td>
                <td className="py-3 px-3 text-zinc-600 font-normal">Average Peak: 11 AM</td>
                <td className="py-3 px-4 text-right text-emerald-800">100% Rate</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
