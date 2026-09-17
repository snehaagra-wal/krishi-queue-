"use client";

import React from "react";
import {
  CalendarDays,
  Users,
  Wheat,
  Warehouse,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  Activity,
} from "lucide-react";

interface MetricsGridProps {
  bookingsCount?: number;
  queueCount?: number;
  procuredQuintals?: number;
  capacityPercent?: number;
  registeredFarmersCount?: number;
}

export default function MetricsGrid({
  bookingsCount = 0,
  queueCount = 0,
  procuredQuintals = 0,
  capacityPercent = 0,
  registeredFarmersCount = 0,
}: MetricsGridProps) {
  const cards = [
    {
      id: "bookings",
      title: "Total Bookings Today",
      value: `${bookingsCount}`,
      unit: "Tokens",
      badge: `${registeredFarmersCount} Farmers Reg.`,
      badgeType: "positive",
      icon: CalendarDays,
      iconBg: "bg-emerald-50 text-emerald-700 border-emerald-100",
      sparkColor: "#10b981", // green
      sparkFill: "rgba(16, 185, 129, 0.12)",
      // Smooth wave path
      path: "M 0 26 C 15 28, 25 15, 45 18 C 65 21, 75 8, 95 10 C 115 12, 125 3, 140 2",
      areaPath:
        "M 0 26 C 15 28, 25 15, 45 18 C 65 21, 75 8, 95 10 C 115 12, 125 3, 140 2 L 140 36 L 0 36 Z",
      subtext: `${registeredFarmersCount} Registered in Firestore`,
    },
    {
      id: "queue",
      title: "Farmers in Queue",
      value: `${queueCount}`,
      unit: "Active",
      badge: queueCount > 0 ? "Active Inflow" : "Zero Wait",
      badgeType: "neutral",
      icon: Users,
      iconBg: "bg-amber-50 text-amber-700 border-amber-100",
      sparkColor: "#f59e0b", // amber
      sparkFill: "rgba(245, 158, 11, 0.12)",
      // Controlled fluctuation path
      path: "M 0 12 C 20 10, 30 24, 50 20 C 70 16, 85 28, 105 18 C 120 10, 130 15, 140 12",
      areaPath:
        "M 0 12 C 20 10, 30 24, 50 20 C 70 16, 85 28, 105 18 C 120 10, 130 15, 140 12 L 140 36 L 0 36 Z",
      subtext: queueCount > 0 ? `${queueCount} vehicles in Mandi queue` : "Queue currently clear",
    },
    {
      id: "procured",
      title: "Procured Today",
      value: `${procuredQuintals}`,
      unit: "Quintals",
      badge: procuredQuintals > 0 ? `${procuredQuintals} Q Cleared` : "0 Q Intake",
      badgeType: "positive",
      icon: Wheat,
      iconBg: "bg-lime-50 text-lime-800 border-lime-100",
      sparkColor: "#84cc16", // lime green
      sparkFill: "rgba(132, 204, 22, 0.12)",
      // Rising growth curve
      path: "M 0 30 C 25 28, 40 22, 65 20 C 85 18, 100 10, 120 7 C 130 5, 135 4, 140 2",
      areaPath:
        "M 0 30 C 25 28, 40 22, 65 20 C 85 18, 100 10, 120 7 C 130 5, 135 4, 140 2 L 140 36 L 0 36 Z",
      subtext: procuredQuintals > 0 ? `${procuredQuintals} Quintals weighed & verified` : "Awaiting first batch arrival",
    },
    {
      id: "capacity",
      title: "Center Capacity",
      value: `${capacityPercent}%`,
      unit: "Utilized",
      badge: "6/6 Bays Open",
      badgeType: "optimal",
      icon: Warehouse,
      iconBg: "bg-teal-50 text-teal-800 border-teal-100",
      sparkColor: "#0d9488", // teal
      sparkFill: "rgba(13, 148, 136, 0.12)",
      // Stable high line
      path: "M 0 18 C 20 16, 35 12, 60 14 C 80 16, 95 8, 115 10 C 125 11, 135 9, 140 8",
      areaPath:
        "M 0 18 C 20 16, 35 12, 60 14 C 80 16, 95 8, 115 10 C 125 11, 135 9, 140 8 L 140 36 L 0 36 Z",
      subtext: capacityPercent > 0 ? `${capacityPercent}% bay capacity used` : "All inspection bays ready",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {cards.map((card) => {
        const IconComponent = card.icon;
        return (
          <div
            key={card.id}
            className="bg-white rounded-2xl p-4 sm:p-5 border border-zinc-200/70 shadow-xs hover:shadow-md hover:border-zinc-300 transition-all duration-200 flex flex-col justify-between group"
          >
            {/* Top row: Icon and Title */}
            <div className="flex items-center gap-2.5 mb-3">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center border shadow-xs transition-transform group-hover:scale-105 duration-200 ${card.iconBg}`}
              >
                <IconComponent className="w-4.5 h-4.5" />
              </div>
              <span className="text-xs font-semibold text-zinc-600">
                {card.title}
              </span>
            </div>

            {/* Middle row: Big Value + Sparkline */}
            <div className="flex items-end justify-between gap-2 mt-1">
              <div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight">
                    {card.value}
                  </span>
                  <span className="text-xs font-medium text-zinc-600">
                    {card.unit}
                  </span>
                </div>
              </div>

              {/* Mini Sparkline Chart */}
              <div className="w-24 sm:w-28 h-9 shrink-0 relative overflow-hidden">
                <svg
                  viewBox="0 0 140 36"
                  className="w-full h-full overflow-visible"
                  fill="none"
                >
                  <path d={card.areaPath} fill={card.sparkFill} />
                  <path
                    d={card.path}
                    stroke={card.sparkColor}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>

            {/* Bottom Row: Pill badge + Context */}
            <div className="flex items-center justify-between gap-2 mt-3 pt-2.5 border-t border-zinc-100 text-[11px]">
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold ${
                  card.badgeType === "positive"
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    : card.badgeType === "optimal"
                    ? "bg-teal-50 text-teal-800 border border-teal-200"
                    : "bg-amber-50 text-amber-800 border border-amber-200"
                }`}
              >
                {card.badgeType === "positive" && (
                  <ArrowUpRight className="w-3 h-3" />
                )}
                {card.badgeType === "neutral" && (
                  <Activity className="w-3 h-3" />
                )}
                {card.badge}
              </span>
              <span className="text-zinc-600 truncate">{card.subtext}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
