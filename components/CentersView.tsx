"use client";

import React, { useState, useEffect, useMemo } from "react";
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
  PlusCircle,
  X,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import {
  subscribeToCenters,
  updateCenter,
  createCenter,
  ProcurementCenter,
  findNearestCenters,
  calculateDistanceKm,
  reverseGeocodeCoordinates,
} from "@/lib/firestoreService";

interface CentersViewProps {
  onReturnToDashboard?: () => void;
  showToast?: (message: string) => void;
}

export default function CentersView({ onReturnToDashboard, showToast }: CentersViewProps) {
  const [centers, setCenters] = useState<ProcurementCenter[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // GPS Location sorting state
  const [userCoords, setUserCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [userGeo, setUserGeo] = useState<{ state?: string; district?: string } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [selectedState, setSelectedState] = useState<string>("All");

  // New center form state
  const [newCenter, setNewCenter] = useState({
    name: "",
    code: "",
    location: "",
    district: "Jabalpur",
    state: "Madhya Pradesh",
    activeBays: "4 / 4 Bays Active",
    dailyCapacity: "400 Q / day",
    currentInflow: "0 Q",
  });

  useEffect(() => {
    setLoading(true);
    setFetchError(null);
    const unsub = subscribeToCenters(
      (realtimeCenters) => {
        setCenters(realtimeCenters || []);
        setLoading(false);
      },
      (err) => {
        console.error("Failed to subscribe to centers:", err);
        setFetchError("Failed to fetch procurement centers from Firestore.");
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  const [detectedAddress, setDetectedAddress] = useState<string | null>(null);

  const handleUseLocation = () => {
    if (!navigator.geolocation) {
      if (showToast) showToast("Geolocation is not supported by your browser.");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        setUserCoords({ lat, lon });
        try {
          const geo = await reverseGeocodeCoordinates(lat, lon);
          setUserGeo({ state: geo.state, district: geo.district });
          setDetectedAddress(geo.formattedAddress || `${lat.toFixed(4)}° N, ${lon.toFixed(4)}° E`);
          if (showToast) {
            showToast(`GPS Live: ${geo.formattedAddress} • Mandis sorted nearest first.`);
          }
        } catch (e) {
          if (showToast) showToast("Live GPS detected! Mandis sorted by nearest distance.");
        } finally {
          setIsLocating(false);
        }
      },
      (err) => {
        console.warn("GPS error:", err);
        setIsLocating(false);
        if (showToast) {
          showToast("Could not access GPS. Please enable browser location permissions.");
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const stateOptions = useMemo(() => {
    const states = Array.from(
      new Set(centers.map((c) => c.state || "Other"))
    ).filter(Boolean).sort();
    return ["All", ...states];
  }, [centers]);

  // Filter & sort centers in real time
  const filteredCenters = useMemo(() => {
    let list = centers.filter((c) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.location.toLowerCase().includes(q) ||
        c.district.toLowerCase().includes(q) ||
        (c.state || "").toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q);

      const matchesState =
        selectedState === "All" ||
        (c.state || "").toLowerCase() === selectedState.toLowerCase();

      return matchesSearch && matchesState;
    });

    if (userCoords) {
      list = findNearestCenters(
        userCoords.lat,
        userCoords.lon,
        list,
        userGeo?.state,
        userGeo?.district
      );
    }
    return list;
  }, [centers, searchQuery, userCoords, userGeo, selectedState]);

  // Toggle center status in Firestore
  const handleToggleStatus = async (center: ProcurementCenter) => {
    const nextStatusMap: Record<ProcurementCenter["status"], ProcurementCenter["status"]> = {
      Active: "Full",
      Full: "Maintenance",
      Maintenance: "Active",
    };
    const nextStatus = nextStatusMap[center.status] || "Active";

    try {
      await updateCenter(center.id, { status: nextStatus });
      if (showToast) {
        showToast(`${center.name} status updated to ${nextStatus} in Firestore.`);
      }
    } catch (err: any) {
      console.error("Error updating center status:", err);
      if (showToast) showToast("Error updating center: " + err.message);
    }
  };

  const handleAddCenterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!newCenter.name.trim()) {
      setFormError("Center Name is required.");
      return;
    }
    if (!newCenter.location.trim()) {
      setFormError("Location / Gate is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      const code =
        newCenter.code.trim() ||
        `APMC-${newCenter.district.slice(0, 3).toUpperCase()}-0${centers.length + 1}`;
      await createCenter({
        name: newCenter.name.trim(),
        code,
        location: newCenter.location.trim(),
        district: newCenter.district.trim(),
        state: newCenter.state.trim() || "Madhya Pradesh",
        activeBays: newCenter.activeBays,
        dailyCapacity: newCenter.dailyCapacity,
        currentInflow: newCenter.currentInflow,
        status: "Active",
      });

      setIsAddModalOpen(false);
      setNewCenter({
        name: "",
        code: "",
        location: "",
        district: "Jabalpur",
        state: "Madhya Pradesh",
        activeBays: "4 / 4 Bays Active",
        dailyCapacity: "400 Q / day",
        currentInflow: "0 Q",
      });

      if (showToast) {
        showToast(`Center ${newCenter.name} registered in Firestore!`);
      }
    } catch (err: any) {
      console.error("Error creating center:", err);
      setFormError(err.message || "Failed to create center.");
      if (showToast) showToast("Error creating center: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

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
              {centers.length} Regional Centers (Firestore)
            </span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-600 mt-1">
            Status of weighing scales, active inspection bays, and daily capacity across regional yards.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-full shadow-xs transition cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Add Center</span>
          </button>

          {onReturnToDashboard && (
            <button
              onClick={onReturnToDashboard}
              className="self-start sm:self-auto px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold rounded-full shadow-xs transition cursor-pointer"
            >
              &larr; Back to Dashboard
            </button>
          )}
        </div>
      </div>

      {/* 2. Simple Search Bar & GPS Locate Button */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-zinc-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto flex-1">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by center name or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-white text-zinc-900 border border-zinc-300 placeholder:text-zinc-400 rounded-full focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 font-semibold"
            />
          </div>

          <button
            type="button"
            onClick={handleUseLocation}
            disabled={isLocating}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-bold rounded-full transition cursor-pointer"
          >
            <MapPin className={`w-3.5 h-3.5 ${isLocating ? "animate-spin text-emerald-700" : "text-emerald-700"}`} />
            <span>
              {isLocating ? "Locating GPS..." : userCoords ? "📍 Sorted by Distance (GPS)" : "📍 Find Nearest Mandis (GPS)"}
            </span>
          </button>
        </div>

        <div className="flex items-center gap-3 text-xs text-zinc-600">
          <span>
            Showing <strong className="text-zinc-900 font-bold">{filteredCenters.length}</strong> of{" "}
            <strong className="text-zinc-900 font-bold">{centers.length}</strong> centers
          </span>
          {(searchQuery || selectedState !== "All") && (
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedState("All");
              }}
              className="text-emerald-700 hover:underline font-semibold cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* State Filter Buttons */}
      <div className="flex flex-wrap items-center gap-1.5 px-1">
        <span className="text-[11px] font-bold text-zinc-500 mr-1">State:</span>
        {stateOptions.map((st) => {
          const count = st === "All" ? centers.length : centers.filter((c) => c.state === st).length;
          const isSelected = selectedState === st;
          return (
            <button
              key={st}
              type="button"
              onClick={() => setSelectedState(st)}
              className={`px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                isSelected
                  ? "bg-emerald-800 text-white shadow-xs"
                  : "bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-100"
              }`}
            >
              <span>{st}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? "bg-emerald-700 text-emerald-100" : "bg-zinc-100 text-zinc-600"}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {detectedAddress && (
        <div className="px-4 py-2.5 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs flex items-center justify-between animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
            <span>
              <strong>Your Live Location:</strong> {detectedAddress} — Regional Mandis sorted nearest first.
            </span>
          </div>
          <button
            onClick={() => setDetectedAddress(null)}
            className="text-emerald-700 hover:text-emerald-950 font-bold ml-2 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

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
                <th className="py-3 px-4 text-right">Operational Status (Click to Toggle)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {fetchError ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-xs">
                    <div className="flex items-center justify-center gap-2 text-rose-600 font-semibold">
                      <AlertCircle className="w-4 h-4" />
                      <span>{fetchError}</span>
                    </div>
                  </td>
                </tr>
              ) : filteredCenters.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-zinc-500 text-xs">
                    {loading
                      ? "Loading centers from Firestore..."
                      : centers.length === 0
                      ? "No procurement centers in database. Click 'Add Center' above to create one."
                      : "No procurement centers match search criteria."}
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
                      <div className="text-[11px] text-zinc-500 pl-4.5 flex items-center gap-2 mt-0.5">
                        <span>District {center.district}, {center.state || "India"}</span>
                        {center.distanceKm !== undefined && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            📍 {center.distanceKm} km away
                          </span>
                        )}
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

                    {/* Status Badge with Click to Toggle Status */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleToggleStatus(center)}
                        title="Click to cycle status in Firestore (Active -> Full -> Maintenance)"
                        className="cursor-pointer hover:scale-105 transition-transform"
                      >
                        {getStatusBadge(center.status)}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Center Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-zinc-200">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-700" />
                <h3 className="text-sm font-bold text-zinc-900">
                  Add Procurement Center
                </h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-800 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Error Alert Banner */}
            {formError && (
              <div className="mt-3 p-2.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-800 font-medium animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleAddCenterSubmit} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Center Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Pehowa Sub-Yard"
                  value={newCenter.name}
                  onChange={(e) => setNewCenter({ ...newCenter, name: e.target.value })}
                  className="w-full px-3 py-2 bg-white text-zinc-900 border border-zinc-300 placeholder:text-zinc-400 rounded-xl focus:ring-2 focus:ring-emerald-500 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">State</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Madhya Pradesh"
                    value={newCenter.state}
                    onChange={(e) => setNewCenter({ ...newCenter, state: e.target.value })}
                    className="w-full px-3 py-2 bg-white text-zinc-900 border border-zinc-300 placeholder:text-zinc-400 rounded-xl focus:ring-2 focus:ring-emerald-500 font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">District</label>
                  <input
                    type="text"
                    value={newCenter.district}
                    onChange={(e) => setNewCenter({ ...newCenter, district: e.target.value })}
                    className="w-full px-3 py-2 bg-white text-zinc-900 border border-zinc-300 placeholder:text-zinc-400 rounded-xl focus:ring-2 focus:ring-emerald-500 font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Location / Gate</label>
                <input
                  type="text"
                  required
                  placeholder="Mandi Complex"
                  value={newCenter.location}
                  onChange={(e) => setNewCenter({ ...newCenter, location: e.target.value })}
                  className="w-full px-3 py-2 bg-white text-zinc-900 border border-zinc-300 placeholder:text-zinc-400 rounded-xl focus:ring-2 focus:ring-emerald-500 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Daily Capacity</label>
                  <input
                    type="text"
                    value={newCenter.dailyCapacity}
                    onChange={(e) => setNewCenter({ ...newCenter, dailyCapacity: e.target.value })}
                    className="w-full px-3 py-2 bg-white text-zinc-900 border border-zinc-300 placeholder:text-zinc-400 rounded-xl focus:ring-2 focus:ring-emerald-500 font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Active Bays</label>
                  <input
                    type="text"
                    value={newCenter.activeBays}
                    onChange={(e) => setNewCenter({ ...newCenter, activeBays: e.target.value })}
                    className="w-full px-3 py-2 bg-white text-zinc-900 border border-zinc-300 placeholder:text-zinc-400 rounded-xl focus:ring-2 focus:ring-emerald-500 font-semibold"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-full border border-zinc-200 text-zinc-700 font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-full bg-emerald-800 hover:bg-emerald-900 text-white font-bold cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSubmitting ? "Adding to Firestore..." : "Add Center"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
