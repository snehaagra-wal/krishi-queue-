"use client";

import React, { useState, useEffect } from "react";
import {
  RotateCcw,
  Sparkles,
  TrendingUp,
  Info,
  Layers,
  ArrowUpRight,
  Wheat,
} from "lucide-react";
import { subscribeToCheckins, CheckinItem } from "@/lib/firestoreService";

interface SlotData {
  time: string;
  wheat: number; // in Quintals (lime segment)
  paddy: number; // in Quintals (deep emerald segment)
  capacity: number; // line point (0-100 scale)
  trucks: number;
  highlight?: boolean;
}

export default function CropInflowChart() {
  const [timeRange, setTimeRange] = useState<"today" | "weekly" | "monthly">("today");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [animationKey, setAnimationKey] = useState<number>(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [checkins, setCheckins] = useState<CheckinItem[]>([]);

  useEffect(() => {
    // Subscribe to live Firestore checkins for real-time chart data
    const unsubscribe = subscribeToCheckins((items) => {
      setCheckins(items);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Trigger smooth entrance animation on mount
    const timer = setTimeout(() => setIsLoaded(true), 50);
    return () => clearTimeout(timer);
  }, [animationKey, checkins]);

  const handleReplayAnimation = () => {
    setIsLoaded(false);
    setTimeout(() => {
      setAnimationKey((prev) => prev + 1);
    }, 40);
  };

  // Compute live hourly buckets from Firestore checkins
  const slotLabels = ["08 AM", "10 AM", "12 PM", "02 PM", "04 PM", "06 PM", "08 PM"];

  const data: SlotData[] = slotLabels.map((timeLabel) => {
    const matched = checkins.filter((c) => {
      const t = (c.slotTime || "").toUpperCase();
      if (timeLabel === "08 AM") return t.includes("08:00") || t.includes("8:00") || t.includes("08 AM");
      if (timeLabel === "10 AM") return t.includes("09:00") || t.includes("10:00") || t.includes("10 AM");
      if (timeLabel === "12 PM") return t.includes("11:00") || t.includes("12:00") || t.includes("12 PM");
      if (timeLabel === "02 PM") return t.includes("01:00") || t.includes("02:00") || t.includes("02 PM");
      if (timeLabel === "04 PM") return t.includes("03:00") || t.includes("04:00") || t.includes("04 PM");
      if (timeLabel === "06 PM") return t.includes("05:00") || t.includes("06:00") || t.includes("06 PM");
      if (timeLabel === "08 PM") return t.includes("07:00") || t.includes("08:00") || t.includes("08 PM");
      return false;
    });

    let wheat = 0;
    let paddy = 0;

    matched.forEach((c) => {
      const q = c.quantityNum || parseFloat(c.quantity) || 0;
      const crop = (c.cropType || "").toLowerCase();
      if (crop.includes("wheat")) {
        wheat += q;
      } else {
        paddy += q;
      }
    });

    return {
      time: timeLabel,
      wheat: Math.round(wheat),
      paddy: Math.round(paddy),
      capacity: Math.min(100, Math.round(((wheat + paddy) / 40) * 100)),
      trucks: matched.length,
      highlight: matched.length > 0,
    };
  });

  const totalInflowQuintals = data.reduce((sum, d) => sum + d.wheat + d.paddy, 0);
  const peakSlot = [...data].sort((a, b) => (b.wheat + b.paddy) - (a.wheat + a.paddy))[0];

  // SVG dimensions for the overlay line graph
  const svgWidth = 560;
  const svgHeight = 220;
  const maxVal = Math.max(...data.map((d) => d.wheat + d.paddy), 40); // Dynamic scale

  // Calculate coordinates for the line chart (total inflow curve)
  const linePoints = data.map((d, i) => {
    const x = 40 + i * ((svgWidth - 80) / (data.length - 1));
    const total = d.wheat + d.paddy;
    // When total is 0, line stays flat at base level
    const y = total === 0 ? svgHeight - 25 : svgHeight - 25 - (total / (maxVal * 1.2)) * (svgHeight - 55);
    return { x, y, total };
  });

  // Create smooth Bezier curve path through points
  const createSmoothPath = (points: { x: number; y: number }[]) => {
    if (points.length === 0) return "";
    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i === 0 ? 0 : i - 1];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[i + 2 < points.length ? i + 2 : i + 1];

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
    return path;
  };

  const smoothLinePath = createSmoothPath(linePoints);
  const areaPath = `${smoothLinePath} L ${linePoints[linePoints.length - 1].x} ${svgHeight - 10} L ${linePoints[0].x} ${svgHeight - 10} Z`;

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-zinc-200/80 shadow-xs flex flex-col justify-between h-full relative overflow-hidden">
      {/* Top Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-zinc-100">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg sm:text-xl font-extrabold tracking-tight text-zinc-900">
              Hourly Crop Inflow Trend
            </h2>
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
              <TrendingUp className="w-3 h-3" /> Live Telemetry
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Sum of all grain arrivals & gate weigh-in clearances across the system
          </p>
        </div>

        {/* Legend and Replay Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Legend Items (matching Dribbble's Profit & Loss style) */}
          <div className="flex items-center gap-3 text-xs font-semibold">
            <div className="flex items-center gap-1.5 text-zinc-700">
              <span className="w-2.5 h-2.5 rounded-full bg-[#047857] shadow-xs ring-2 ring-emerald-200"></span>
              <span>Paddy (Processed)</span>
            </div>
            <div className="flex items-center gap-1.5 text-zinc-700">
              <span className="w-2.5 h-2.5 rounded-full bg-[#84cc16] shadow-xs ring-2 ring-lime-200"></span>
              <span>Wheat (Inflow)</span>
            </div>
          </div>

          {/* Time range switcher */}
          <div className="hidden md:flex items-center bg-zinc-100/90 p-0.5 rounded-full border border-zinc-200/70 text-xs">
            {(["today", "weekly", "monthly"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setTimeRange(tab)}
                className={`px-2.5 py-1 rounded-full font-medium transition cursor-pointer capitalize ${
                  timeRange === tab
                    ? "bg-white text-zinc-900 shadow-xs font-semibold"
                    : "text-zinc-600 hover:text-zinc-900"
                }`}
              >
                {tab === "today" ? "Today" : tab}
              </button>
            ))}
          </div>

          {/* Replay Animation Button */}
          <button
            onClick={handleReplayAnimation}
            className="p-1.5 rounded-full border border-zinc-200 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 transition cursor-pointer"
            title="Replay Entrance Animation"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Chart Canvas */}
      <div
        key={animationKey}
        className="relative mt-5 pt-4 pb-2 flex-1 flex flex-col justify-end min-h-[260px] select-none"
      >
        {/* Y-Axis Horizontal Grid Lines and Labels */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-8 pr-2">
          {[50, 40, 30, 20, 10, 0].map((val) => (
            <div key={val} className="flex items-center gap-3 w-full">
              <span className="text-[10px] font-semibold text-zinc-400 w-6 text-right shrink-0">
                {val === 0 ? "00k" : `${val}k`}
              </span>
              <div className="flex-1 h-px border-b border-dashed border-zinc-200/70"></div>
            </div>
          ))}
        </div>

        {/* SVG Overlay Line Graph (Smooth Flow Curve) */}
        <div className="absolute inset-0 pl-10 pr-4 pb-8 pointer-events-none overflow-visible">
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            preserveAspectRatio="none"
            className="w-full h-full overflow-visible"
          >
            <defs>
              <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#84cc16" stopOpacity="0.18" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Smooth Fill Area */}
            <path
              d={areaPath}
              fill="url(#areaGradient)"
              className={isLoaded ? "opacity-100 transition-opacity duration-1000" : "opacity-0"}
            />

            {/* Smooth Animated Curve Line */}
            <path
              d={smoothLinePath}
              fill="none"
              stroke="#047857"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={isLoaded ? "animate-draw-line" : "opacity-0"}
              style={{
                strokeDasharray: 1200,
                strokeDashoffset: isLoaded ? 0 : 1200,
              }}
            />

            {/* Pulsing Dots at Key Peak Points */}
            {linePoints.map((pt, i) => (
              <g key={i}>
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r="4"
                  fill="#ffffff"
                  stroke="#047857"
                  strokeWidth="2.5"
                  className={`transition-all duration-300 ${
                    hoveredIndex === i ? "scale-150 fill-emerald-500" : ""
                  }`}
                />
              </g>
            ))}
          </svg>
        </div>

        {/* Zero-State Overlay when totalInflowQuintals === 0 */}
        {totalInflowQuintals === 0 && (
          <div className="absolute inset-x-8 top-12 bottom-10 bg-white/85 backdrop-blur-2xs flex flex-col items-center justify-center text-center p-4 rounded-2xl border border-dashed border-emerald-300 z-20 shadow-xs animate-in fade-in duration-200">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center mb-2 border border-emerald-100">
              <Wheat className="w-5 h-5 text-emerald-700" />
            </div>
            <h4 className="text-xs font-bold text-zinc-900">
              Clean Slate Dashboard • Zero Crop Inflow
            </h4>
            <p className="text-[11px] text-zinc-500 max-w-sm mt-1 leading-relaxed">
              No arrivals recorded in Firestore yet. Once newly registered farmers (e.g. Sneha) book slots, live telemetry and inflow curves will dynamically expand here.
            </p>
          </div>
        )}

        {/* Bars Container: Capsule Rounded Pill Bars */}
        <div className="relative pl-10 pr-4 flex items-end justify-between h-[210px] z-10">
          {data.map((item, index) => {
            const isHovered = hoveredIndex === index;
            // Height percentages
            const paddyHeight = totalInflowQuintals === 0 ? 0 : (item.paddy / maxVal) * 100;
            const wheatHeight = totalInflowQuintals === 0 ? 0 : (item.wheat / maxVal) * 100;
            const totalQuintals = item.paddy + item.wheat;

            return (
              <div
                key={item.time}
                className="flex-1 flex flex-col items-center justify-end h-full group cursor-pointer relative"
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Floating Interactive Tooltip */}
                {isHovered && totalQuintals > 0 && (
                  <div className="absolute -top-16 z-30 bg-zinc-900 text-white rounded-xl px-3 py-2 text-xs shadow-xl border border-zinc-700 pointer-events-none flex flex-col gap-0.5 animate-in fade-in zoom-in-95 duration-150 whitespace-nowrap">
                    <div className="flex items-center justify-between gap-3 font-semibold border-b border-zinc-700 pb-1">
                      <span>{item.time} Slot</span>
                      <span className="text-emerald-400">{totalQuintals} Quintals</span>
                    </div>
                    <div className="flex items-center gap-2 pt-0.5 text-[11px] text-zinc-300">
                      <span>Wheat: <strong className="text-lime-400">{item.wheat}Q</strong></span>
                      <span>•</span>
                      <span>Paddy: <strong className="text-emerald-400">{item.paddy}Q</strong></span>
                    </div>
                    <div className="text-[10px] text-zinc-400">
                      {item.trucks} Trucks Registered
                    </div>
                  </div>
                )}

                {/* Capsule Pill Bar Structure */}
                <div
                  className="w-7 sm:w-9 md:w-10 flex flex-col items-center gap-1.5 justify-end h-full transition-transform duration-200 group-hover:scale-105"
                  style={{ transformOrigin: "bottom" }}
                >
                  {/* Top Capsule: Wheat Inflow */}
                  <div
                    className="w-full rounded-full bg-[#84cc16] shadow-sm transition-all duration-700 ease-out"
                    style={{
                      height: isLoaded && totalInflowQuintals > 0 ? `${wheatHeight}%` : "0%",
                      transitionDelay: `${index * 80 + 100}ms`,
                      opacity: isLoaded ? 1 : 0,
                    }}
                  />

                  {/* Bottom Capsule: Paddy Processed */}
                  <div
                    className="w-full rounded-full bg-[#047857] shadow-sm transition-all duration-700 ease-out"
                    style={{
                      height: isLoaded && totalInflowQuintals > 0 ? `${paddyHeight}%` : "0%",
                      transitionDelay: `${index * 80}ms`,
                      opacity: isLoaded ? 1 : 0,
                    }}
                  />
                </div>

                {/* Time Label on X-Axis */}
                <span
                  className={`mt-3 text-[11px] font-semibold transition-colors duration-150 ${
                    isHovered
                      ? "text-emerald-800 font-bold"
                      : "text-zinc-500"
                  }`}
                >
                  {item.time}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Insights Footer */}
      <div className="mt-2 pt-3 border-t border-zinc-100 flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-600">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
          <span>
            {totalInflowQuintals > 0 ? (
              <>
                Peak inflow: <strong className="text-zinc-800 font-semibold">{peakSlot?.time}</strong> ({peakSlot ? peakSlot.wheat + peakSlot.paddy : 0} Q recorded).
              </>
            ) : (
              <span>Telemetry active • Awaiting live grain arrivals at APMC gates.</span>
            )}
          </span>
        </div>
        <div className="flex items-center gap-1.5 font-medium text-emerald-800">
          <span>Weighbridge Status: {totalInflowQuintals > 0 ? "Active Inflow" : "Standby"}</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </div>
      </div>
    </div>
  );
}
