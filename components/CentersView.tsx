"use client";

import React, { useState, useMemo } from "react";
import {
  Building2,
  Search,
  MapPin,
  Layers,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Truck,
  ShieldCheck,
} from "lucide-react";

interface CentersViewProps {
  onReturnToDashboard?: () => void;
}

export interface ProcurementCenter {
  id: string;
  code: string;
  name: string;
  location: string;
  district: string;
  activeBays: string; // e.g., "6/6 Bays"
  dailyCapacity: string; // e.g., "500 Q"
  currentInflow: string; // e.g., "420 Q"
  status: "Active" | "Maintenance" | "Full";
}

const initialCenters: ProcurementCenter[] = [
  {
    id: "1",
    code: "APMC-KRN-01",
    name: "APMC Karnal Main Hub",
    location: "GT Road Yard #4",
    district: "Karnal",
    activeBays: "6 / 6 Bays Active",
    dailyCapacity: "600 Q / day",
    currentInflow: "510 Q",
    status: "Active",
  },
  {
    id: "2",
    code: "APMC-TAR-02",
    name: "Taraori Grain Yard",
    location: "Station Road, Gate 2",
    district: "Taraori",
    activeBays: "4 / 4 Bays Active",
    dailyCapacity: "400 Q / day",
    currentInflow: "320 Q",
    status: "Active",
  },
  {
    id: "3",
    code: "APMC-GHR-03",
    name: "Gharaunda Sub-Yard",
    location: "Bypass Collection Yard",
    district: "Gharaunda",
    activeBays: "5 / 5 Bays Full",
    dailyCapacity: "450 Q / day",
    currentInflow: "450 Q",
    status: "Full",
  },
  {
    id: "4",
    code: "APMC-NLK-04",
    name: "Nilokheri Grain Depot",
    location: "Depot Road Sector 3",
    district: "Nilokheri",
    activeBays: "3 / 4 Bays Active",
    dailyCapacity: "350 Q / day",
    currentInflow: "210 Q",
    status: "Active",
  },
  {
    id: "5",
    code: "APMC-ASD-05",
    name: "Assandh Procurement Yard",
    location: "Mandi Bypass Complex",
    district: "Assandh",
    activeBays: "1 / 4 Bays (Scale Calibration)",
    dailyCapacity: "300 Q / day",
    currentInflow: "80 Q",
    status: "Maintenance",
  },
  {
    id: "6",
    code: "APMC-IND-06",
    name: "Indri Silo & Collection Hub",
    location: "Canal Link Road",
    district: "Indri",
    activeBays: "4 / 4 Bays Active",
    dailyCapacity: "500 Q / day",
    currentInflow: "390 Q",
    status: "Active",
  },
];

export default function CentersView({ onReturnToDashboard }: CentersViewProps) {
  const [centers] = useState<ProcurementCenter[]>(initialCenters);
  const [searchQuery, setSearchQuery] = useState("");

  // Filter centers in real time based on search query (Name or Location)
  const filteredCenters = useMemo(() => {
    return centers.filter((c) => {
      const q = searchQuery.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.location.toLowerCase().includes(q) ||
        c.district.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q)
      );
    });
  }, [centers, searchQuery]);

  // Status Badge Component
  const getStatusBadge = (status: ProcurementCenter["status"]) => {
    switch (status) {
      case "Active":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
            Active
          </span>
        );
      case "Maintenance":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            Maintenance
          </span>
        );
      case "Full":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-800 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
            Full
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-200">
      {/* 1. Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-200/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900">
              Procurement Centers & Mandi Yards
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
              {centers.length} Regional Centers
            </span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-600 mt-1">
            Status of weighing scales, active inspection bays, and daily capacity across regional yards.
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

      {/* 2. Simple Search Bar */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-zinc-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by center name or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-full focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 font-medium"
          />
        </div>

        <div className="flex items-center gap-3 text-xs text-zinc-600">
          <span>
            Showing <strong className="text-zinc-900 font-bold">{filteredCenters.length}</strong> of{" "}
            <strong className="text-zinc-900 font-bold">{centers.length}</strong> centers
          </span>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="text-emerald-700 hover:underline font-semibold cursor-pointer"
            >
              Clear Filter
            </button>
          )}
        </div>
      </div>

      {/* 3. Clean Centers Table */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-zinc-200/80 shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[620px]">
            <thead>
              <tr className="border-b border-zinc-200/80 text-[11px] font-bold text-zinc-600 uppercase tracking-wider bg-zinc-50/50">
                <th className="py-3 px-4">Center Name & Code</th>
                <th className="py-3 px-3">Location & District</th>
                <th className="py-3 px-3">Active Weighing Bays</th>
                <th className="py-3 px-3">Capacity / Today</th>
                <th className="py-3 px-4 text-right">Operational Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filteredCenters.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-zinc-500 text-xs">
                    No procurement centers match &ldquo;{searchQuery}&rdquo;.
                  </td>
                </tr>
              ) : (
                filteredCenters.map((center) => (
                  <tr
                    key={center.id}
                    className="hover:bg-zinc-50/80 transition-colors"
                  >
                    {/* Center Name & Code */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center border border-emerald-100 font-bold">
                          <Building2 className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold text-zinc-900 text-xs">
                            {center.name}
                          </div>
                          <div className="text-[10px] text-zinc-500 font-mono">
                            {center.code}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Location & District */}
                    <td className="py-3.5 px-3 text-zinc-700">
                      <div className="flex items-center gap-1 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                        <span>{center.location}</span>
                      </div>
                      <div className="text-[11px] text-zinc-500 pl-4.5">
                        {center.district} Region
                      </div>
                    </td>

                    {/* Active Bays */}
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-1.5 font-semibold text-zinc-800">
                        <Layers className="w-3.5 h-3.5 text-zinc-400" />
                        <span>{center.activeBays}</span>
                      </div>
                    </td>

                    {/* Capacity & Inflow */}
                    <td className="py-3.5 px-3">
                      <div className="font-bold text-zinc-900">
                        {center.currentInflow} <span className="text-[10px] text-zinc-500 font-normal">/ {center.dailyCapacity}</span>
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4 text-right">
                      {getStatusBadge(center.status)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
