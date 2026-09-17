"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Search,
  Filter,
  MoreHorizontal,
  CheckCircle2,
  Clock,
  AlertCircle,
  Eye,
  Printer,
  ChevronDown,
  RefreshCw,
  SlidersHorizontal,
  PlusCircle,
  XCircle,
  Trash2,
  Check,
  Building2,
  Wheat,
  Archive,
  History,
  Sparkles,
  Zap,
} from "lucide-react";
import {
  subscribeToCheckins,
  createCheckin,
  updateCheckin,
  deleteCheckin,
  getNextSequentialToken,
  getCropMspRate,
  calculateMspPayout,
  CheckinItem,
  CheckinStatus,
} from "@/lib/firestoreService";

interface RecentFarmerCheckinsProps {
  showToast?: (message: string) => void;
  managerCenter?: string;
}

export default function RecentFarmerCheckins({ showToast, managerCenter }: RecentFarmerCheckinsProps) {
  const [items, setItems] = useState<CheckinItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("All");
  const [selectedRows, setSelectedRows] = useState<Record<string, boolean>>({});
  const [showFilterDropdown, setShowFilterDropdown] = useState<boolean>(false);
  const [activeActionMenu, setActiveActionMenu] = useState<string | null>(null);
  const [selectedFarmerDetails, setSelectedFarmerDetails] = useState<CheckinItem | null>(null);

  // Tab state: Live Queue vs Procurement History / Audit Archive vs Cancelled (Requirement 9)
  const [activeTab, setActiveTab] = useState<"live" | "archive" | "cancelled">("live");

  // Walk-in modal state
  const [isWalkinModalOpen, setIsWalkinModalOpen] = useState(false);
  const [walkinName, setWalkinName] = useState("");
  const [walkinPhone, setWalkinPhone] = useState("");
  const [walkinVillage, setWalkinVillage] = useState("");
  const [walkinCrop, setWalkinCrop] = useState("Sharbati Wheat (Grade A)");
  const [walkinQuantity, setWalkinQuantity] = useState("35");
  const [walkinVehicle, setWalkinVehicle] = useState("");
  const [isSubmittingWalkin, setIsSubmittingWalkin] = useState(false);
  const [walkinError, setWalkinError] = useState("");
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Status updating spinner ID
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);

  // Real-time Firestore subscription
  useEffect(() => {
    setLoading(true);
    setFetchError(null);
    const unsubscribe = subscribeToCheckins(
      (realtimeCheckins) => {
        setItems(realtimeCheckins);
        setLoading(false);
      },
      (err) => {
        console.error("Failed to subscribe to checkins:", err);
        setFetchError(err.message || "Failed to load live checkins from Firestore.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Filtered rows based on tab, search and status dropdown
  const liveCount = useMemo(() => items.filter((i) => i.status !== "Completed" && i.status !== "Cancelled").length, [items]);
  const archiveCount = useMemo(() => items.filter((i) => i.status === "Completed").length, [items]);
  const cancelledCount = useMemo(() => items.filter((i) => i.status === "Cancelled").length, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // 1. Tab filter (Requirement 9)
      if (activeTab === "live") {
        if (item.status === "Completed" || item.status === "Cancelled") return false;
      } else if (activeTab === "archive") {
        if (item.status !== "Completed") return false;
      } else if (activeTab === "cancelled") {
        if (item.status !== "Cancelled") return false;
      }

      // 2. Status dropdown filter
      if (selectedStatus !== "All" && item.status !== selectedStatus) {
        return false;
      }

      // 3. Search query
      const q = searchQuery.toLowerCase();
      if (!q) return true;
      return (
        item.farmerName?.toLowerCase().includes(q) ||
        item.tokenId?.toLowerCase().includes(q) ||
        item.cropType?.toLowerCase().includes(q) ||
        item.village?.toLowerCase().includes(q)
      );
    });
  }, [items, activeTab, selectedStatus, searchQuery]);

  const toggleSelectAll = () => {
    if (Object.keys(selectedRows).length === filteredItems.length) {
      setSelectedRows({});
    } else {
      const all: Record<string, boolean> = {};
      filteredItems.forEach((item) => {
        all[item.id] = true;
      });
      setSelectedRows(all);
    }
  };

  const toggleRow = (id: string) => {
    setSelectedRows((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleUpdateStatus = async (
    id: string,
    newStatus: CheckinStatus,
    newBay?: string
  ) => {
    setUpdatingStatusId(id);
    try {
      const updates: Partial<CheckinItem> = { status: newStatus };
      if (newBay) updates.bay = newBay;
      if (newStatus === "Completed") {
        const item = items.find((it) => it.id === id);
        const crop = item?.cropType || "Wheat";
        const qty = item?.quantityNum || (item ? parseFloat(item.quantity) : 35) || 35;
        const payout = calculateMspPayout(crop, qty);

        updates.paymentStatus = "Credited";
        updates.mspRate = payout.mspRate;
        updates.paymentAmount = payout.totalAmount;
        updates.totalPayout = payout.totalAmount;
        updates.transactionId = `DBT-2026-${(item?.center || "APMC").slice(0, 3).toUpperCase()}-${(item?.tokenId || "TK-1").replace(/\D/g, "")}84`;
        updates.payout = `${payout.formattedTotal} (Credited DBT)`;
      } else if (newStatus === "Serving" || newStatus === "In Progress") {
        updates.paymentStatus = "Processing";
      }

      await updateCheckin(id, updates);
      setActiveActionMenu(null);
      if (showToast) {
        if (newStatus === "Completed") {
          showToast(`Token cleared! Transferred to Procurement History & Audit Archive.`);
        } else if (newStatus === "Cancelled") {
          showToast(`Token cancelled and removed from live queue.`);
        } else {
          showToast(`Token status updated to "${newStatus}".`);
        }
      }
    } catch (err: any) {
      console.error("Error updating status:", err);
      if (showToast) showToast("Error updating: " + (err.message || "Failed"));
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const handleDeleteCheckin = async (id: string, tokenId: string) => {
    if (!confirm(`Are you sure you want to remove token #${tokenId} from the queue?`)) {
      return;
    }
    try {
      await deleteCheckin(id);
      setActiveActionMenu(null);
      if (showToast) {
        showToast(`Token #${tokenId} removed from queue.`);
      }
    } catch (err: any) {
      console.error("Error deleting checkin:", err);
      if (showToast) showToast("Error deleting: " + err.message);
    }
  };

  const handleWalkinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setWalkinError("");

    const cleanPhone = walkinPhone.replace(/\D/g, "").slice(-10);
    if (!walkinName.trim()) {
      setWalkinError("Farmer Name is required.");
      return;
    }
    if (!walkinVillage.trim()) {
      setWalkinError("Village / Tehsil is required.");
      return;
    }
    if (!walkinVehicle.trim()) {
      setWalkinError("Vehicle / Tractor Number is required.");
      return;
    }

    setIsSubmittingWalkin(true);
    try {
      // Strictly sequential token starting from #TK-1 (Requirements 8 & 13)
      const generatedToken = await getNextSequentialToken();
      const qtyNum = parseFloat(walkinQuantity) || 35;
      const payout = calculateMspPayout(walkinCrop, qtyNum);

      await createCheckin({
        tokenId: generatedToken,
        farmerName: walkinName.trim(),
        farmerPhone: cleanPhone.length === 10 ? `+91 ${cleanPhone}` : "",
        village: walkinVillage.trim(),
        cropType: walkinCrop,
        quantity: `${qtyNum} Quintals`,
        quantityNum: qtyNum,
        slotTime: "Walk-in Entry",
        slotDate: new Date().toISOString().split("T")[0],
        status: "Waiting",
        bay: "Gate 1-A (Arrival)",
        vehicle: walkinVehicle.trim(),
        center: managerCenter || "Krishi Upaj Mandi Hub",
        payout: payout.formattedTotal,
        mspRate: payout.mspRate,
        paymentAmount: payout.totalAmount,
        totalPayout: payout.totalAmount,
      });

      setIsWalkinModalOpen(false);
      setWalkinName("");
      setWalkinPhone("");
      setWalkinVillage("");
      setWalkinVehicle("");
      if (showToast) {
        showToast(`Walk-in Gate Entry created! Token #${generatedToken} registered.`);
      }
    } catch (err: any) {
      console.error("Error registering walk-in:", err);
      setWalkinError(err.message || "Error saving walk-in to Firestore.");
      if (showToast) showToast("Error: " + err.message);
    } finally {
      setIsSubmittingWalkin(false);
    }
  };

  const getStatusBadge = (status: CheckinStatus) => {
    switch (status) {
      case "Completed":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
            Completed
          </span>
        );
      case "In Progress":
      case "Serving":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-lime-50 text-lime-900 border border-lime-300">
            <span className="w-1.5 h-1.5 rounded-full bg-lime-600 animate-pulse"></span>
            {status}
          </span>
        );
      case "Called":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
            Called
          </span>
        );
      case "Waiting":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            Waiting
          </span>
        );
      case "Verified":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-200">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-600"></span>
            Verified
          </span>
        );
      case "Cancelled":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
            Cancelled
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-zinc-200/80 shadow-xs flex flex-col justify-between h-full">
      {/* Table Header with Search & Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-100">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-extrabold text-zinc-900 tracking-tight">
              Mandi Procurement & Queue System
            </h3>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Live Firestore Sync"></span>
          </div>
          <p className="text-xs text-zinc-600">
            e-NAM Gate check-in, real-time weighing & direct DBT settlement
          </p>
        </div>

        {/* Search, Filter & Gate Entry Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search farmer, token..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs text-zinc-900 bg-white border border-zinc-300 rounded-full w-32 sm:w-48 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all font-semibold placeholder:text-zinc-400 shadow-2xs"
            />
          </div>

          {/* Filter Dropdown Button */}
          <div className="relative">
            <button
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-700 bg-zinc-50 border border-zinc-200 rounded-full hover:bg-zinc-100 transition cursor-pointer"
            >
              <SlidersHorizontal className="w-3 h-3 text-zinc-500" />
              <span>Filters</span>
              {selectedStatus !== "All" && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
              )}
            </button>

            {/* Filter Menu */}
            {showFilterDropdown && (
              <div className="absolute right-0 mt-2 w-44 bg-white rounded-2xl shadow-xl border border-zinc-200 p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-2 py-1 text-[11px] font-bold text-zinc-600 uppercase tracking-wider">
                  Filter by Status
                </div>
                {["All", "Completed", "In Progress", "Called", "Waiting", "Verified"].map(
                  (status) => (
                    <button
                      key={status}
                      onClick={() => {
                        setSelectedStatus(status);
                        setShowFilterDropdown(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 text-xs rounded-lg transition flex items-center justify-between cursor-pointer ${
                        selectedStatus === status
                          ? "bg-emerald-50 text-emerald-900 font-bold"
                          : "text-zinc-600 hover:bg-zinc-50"
                      }`}
                    >
                      <span>{status}</span>
                      {selectedStatus === status && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      )}
                    </button>
                  )
                )}
              </div>
            )}
          </div>

          {/* Quick Walk-in Button */}
          <button
            onClick={() => setIsWalkinModalOpen(true)}
            className="flex items-center gap-1 px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-full shadow-xs transition cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>+ Gate Entry</span>
          </button>
        </div>
      </div>

      {/* 3 Segmented Mode Tabs: Live Queue vs Procurement History / Audit Archive vs Cancelled (Requirement 9) */}
      <div className="flex items-center gap-2 pt-2 border-b border-zinc-100">
        <button
          type="button"
          onClick={() => setActiveTab("live")}
          className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === "live"
              ? "border-emerald-700 text-emerald-950"
              : "border-transparent text-zinc-500 hover:text-zinc-800"
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Live Queue & Weighbridge</span>
          <span className={`text-[10px] px-2 py-0.2 rounded-full font-black ${
            activeTab === "live" ? "bg-emerald-100 text-emerald-900" : "bg-zinc-100 text-zinc-600"
          }`}>
            {liveCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("archive")}
          className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === "archive"
              ? "border-emerald-700 text-emerald-950"
              : "border-transparent text-zinc-500 hover:text-zinc-800"
          }`}
        >
          <Archive className="w-3.5 h-3.5" />
          <span>Procurement History & Audit Archive</span>
          <span className={`text-[10px] px-2 py-0.2 rounded-full font-black ${
            activeTab === "archive" ? "bg-emerald-100 text-emerald-900" : "bg-zinc-100 text-zinc-600"
          }`}>
            {archiveCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("cancelled")}
          className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === "cancelled"
              ? "border-rose-600 text-rose-950"
              : "border-transparent text-zinc-500 hover:text-zinc-800"
          }`}
        >
          <XCircle className="w-3.5 h-3.5" />
          <span>Cancelled Tokens</span>
          <span className={`text-[10px] px-2 py-0.2 rounded-full font-black ${
            activeTab === "cancelled" ? "bg-rose-100 text-rose-900" : "bg-zinc-100 text-zinc-600"
          }`}>
            {cancelledCount}
          </span>
        </button>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto -mx-5 sm:mx-0 mt-2 flex-1">
        <table className="w-full text-left border-collapse min-w-[620px]">
          <thead>
            <tr className="border-b border-zinc-100 text-[11px] font-semibold text-zinc-600 uppercase tracking-wider">
              <th className="py-2.5 px-4 w-10">
                <input
                  type="checkbox"
                  checked={
                    filteredItems.length > 0 &&
                    filteredItems.every((item) => selectedRows[item.id])
                  }
                  onChange={toggleSelectAll}
                  className="rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
              </th>
              <th className="py-2.5 px-3">Token ID</th>
              <th className="py-2.5 px-3">Farmer & Village</th>
              {activeTab === "archive" ? (
                <>
                  <th className="py-2.5 px-3">Crop Variety</th>
                  <th className="py-2.5 px-3">MSP Rate (₹/Q)</th>
                  <th className="py-2.5 px-3">Net Weight</th>
                  <th className="py-2.5 px-3 text-right">DBT Amount (₹)</th>
                  <th className="py-2.5 px-3 text-center">Payment Status</th>
                  <th className="py-2.5 px-3 text-right">Transaction ID</th>
                </>
              ) : (
                <>
                  <th className="py-2.5 px-3">Crop & Quantity</th>
                  <th className="py-2.5 px-3">Slot / Bay</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 text-xs">
            {fetchError ? (
              <tr>
                <td colSpan={activeTab === "archive" ? 9 : 7} className="py-8 text-center text-xs">
                  <div className="flex items-center justify-center gap-2 text-rose-600 font-semibold">
                    <AlertCircle className="w-4 h-4" />
                    <span>{fetchError}</span>
                  </div>
                </td>
              </tr>
            ) : filteredItems.length === 0 ? (
              <tr>
                <td colSpan={activeTab === "archive" ? 9 : 7} className="py-8 text-center text-zinc-600">
                  {loading
                    ? "Loading live data from Firestore..."
                    : activeTab === "archive"
                    ? "No completed procurements in audit archive yet. As farmers complete weighing & verification, records will archive here."
                    : activeTab === "cancelled"
                    ? "No cancelled tokens recorded."
                    : "No active farmers in queue. Click '+ Gate Entry' or wait for farmers to book slots."}
                </td>
              </tr>
            ) : (
              filteredItems.map((row) => {
                const isChecked = !!selectedRows[row.id];
                const mspRate = row.mspRate || getCropMspRate(row.cropType);
                const calcAmount =
                  row.totalPayout ||
                  row.paymentAmount ||
                  Math.round((row.quantityNum || parseFloat(row.quantity) || 35) * mspRate);

                return (
                  <tr
                    key={row.id}
                    className={`transition-colors group hover:bg-zinc-50/80 ${
                      isChecked ? "bg-emerald-50/30" : ""
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="py-3 px-4">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleRow(row.id)}
                        className="rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      />
                    </td>

                    {/* Token ID */}
                    <td className="py-3 px-3 font-semibold text-zinc-900 font-mono">
                      #{row.tokenId}
                    </td>

                    {/* Farmer Name & Village */}
                    <td className="py-3 px-3">
                      <div className="font-semibold text-zinc-900">
                        {row.farmerName}
                      </div>
                      <div className="text-[11px] text-zinc-600">
                        {row.village} {row.farmerPhone && !row.farmerPhone.startsWith("FARMER-") && /^\+?91?\d{10}$/.test(row.farmerPhone.replace(/[\s-]/g, "")) ? `• ${row.farmerPhone}` : ""}
                      </div>
                    </td>

                    {activeTab === "archive" ? (
                      <>
                        {/* Crop Variety */}
                        <td className="py-3 px-3 font-medium text-zinc-800">
                          {row.cropType}
                        </td>

                        {/* Official Notified MSP Rate (Requirement 5) */}
                        <td className="py-3 px-3 font-bold text-emerald-800">
                          ₹{mspRate.toLocaleString("en-IN")}
                        </td>

                        {/* Net Weight */}
                        <td className="py-3 px-3 font-bold text-zinc-900">
                          {row.quantity}
                        </td>

                        {/* Total Calculated Amount */}
                        <td className="py-3 px-3 text-right font-black text-emerald-950 font-mono">
                          ₹{calcAmount.toLocaleString("en-IN")}
                        </td>

                        {/* Payment Status */}
                        <td className="py-3 px-3 text-center">
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                            <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                            <span>Credited DBT</span>
                          </span>
                        </td>

                        {/* Transaction ID */}
                        <td className="py-3 px-3 text-right font-mono text-[11px] text-zinc-600">
                          {row.transactionId || `DBT-2026-KRN-${row.tokenId.replace(/\D/g, "")}84`}
                        </td>
                      </>
                    ) : (
                      <>
                        {/* Crop Type & Quantity with Notified MSP badge (Requirement 5) */}
                        <td className="py-3 px-3">
                          <div className="font-medium text-zinc-800">
                            {row.cropType}
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[11px] text-zinc-600 font-bold">
                              {row.quantity}
                            </span>
                            <span className="text-[10px] bg-emerald-50 text-emerald-800 font-bold px-1.5 py-0.2 rounded border border-emerald-200">
                              MSP: ₹{mspRate}/Q
                            </span>
                          </div>
                        </td>

                        {/* Slot / Bay */}
                        <td className="py-3 px-3 text-zinc-600 whitespace-nowrap">
                          <div className="font-semibold text-zinc-900">{row.bay}</div>
                          <div className="text-[10px] text-zinc-500">{row.slotTime}</div>
                        </td>

                        {/* Status Direct Manager Control */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <select
                              value={row.status}
                              disabled={updatingStatusId === row.id}
                              onChange={(e) => {
                                const newStatus = e.target.value as CheckinStatus;
                                let newBay = row.bay;
                                if (newStatus === "Waiting") newBay = "Gate 1-A Queue";
                                else if (newStatus === "Called") newBay = "Gate 1-B (Inspection)";
                                else if (newStatus === "In Progress" || newStatus === "Serving") newBay = "Gate 1-C (Weighbridge)";
                                else if (newStatus === "Verified") newBay = "Gate 1-B (Moisture Test)";
                                else if (newStatus === "Completed") newBay = "Main Entry Gate (Cleared)";
                                handleUpdateStatus(row.id, newStatus, newBay);
                              }}
                              className={`text-[11px] font-bold py-1 px-2.5 rounded-full border cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${
                                row.status === "Completed"
                                  ? "bg-emerald-50 text-emerald-900 border-emerald-300 font-semibold"
                                  : row.status === "In Progress" || row.status === "Serving"
                                  ? "bg-blue-50 text-blue-900 border-blue-300 font-semibold"
                                  : row.status === "Called"
                                  ? "bg-amber-50 text-amber-900 border-amber-300 font-semibold"
                                  : row.status === "Verified"
                                  ? "bg-teal-50 text-teal-900 border-teal-300 font-semibold"
                                  : row.status === "Cancelled"
                                  ? "bg-rose-50 text-rose-900 border-rose-300 font-semibold"
                                  : "bg-zinc-100 text-zinc-900 border-zinc-300 font-semibold"
                              }`}
                            >
                              <option value="Waiting" className="text-zinc-900 bg-white">⏳ In Queue</option>
                              <option value="Called" className="text-zinc-900 bg-white">📢 Called to Bay</option>
                              <option value="In Progress" className="text-zinc-900 bg-white">⚖️ Weighing (Weighbridge)</option>
                              <option value="Verified" className="text-zinc-900 bg-white">🔬 Moisture Passed</option>
                              <option value="Completed" className="text-zinc-900 bg-white">✅ Complete & Move to Archive</option>
                              <option value="Cancelled" className="text-zinc-900 bg-white">❌ Cancel Token</option>
                            </select>
                            {updatingStatusId === row.id && (
                              <RefreshCw className="w-3.5 h-3.5 text-emerald-600 animate-spin" />
                            )}
                          </div>
                        </td>

                        {/* Action 3-dots Menu */}
                        <td className="py-3 px-3 text-right relative">
                          <button
                            onClick={() =>
                              setActiveActionMenu(
                                activeActionMenu === row.id ? null : row.id
                              )
                            }
                            className="p-1 rounded-md text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 transition cursor-pointer"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>

                          {/* Dropdown Popup Menu */}
                          {activeActionMenu === row.id && (
                            <div className="absolute right-2 top-8 w-56 bg-white rounded-xl shadow-xl border border-zinc-200 p-1.5 z-40 text-left animate-in fade-in zoom-in-95 duration-100">
                              <div className="px-2 py-1 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                                Manage Token
                              </div>
                              <button
                                onClick={() => handleUpdateStatus(row.id, "Completed", "Cleared Gate")}
                                className="w-full text-left px-2 py-1.5 text-xs text-emerald-800 hover:bg-emerald-50 rounded-lg transition font-bold flex items-center gap-1.5 cursor-pointer"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Complete & Transfer to Archive</span>
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(row.id, "Cancelled")}
                                className="w-full text-left px-2 py-1.5 text-xs text-rose-700 hover:bg-rose-50 rounded-lg transition font-bold flex items-center gap-1.5 cursor-pointer"
                              >
                                <XCircle className="w-3.5 h-3.5 text-rose-600" />
                                <span>Cancel Token</span>
                              </button>
                              <button
                                onClick={() => handleDeleteCheckin(row.id, row.tokenId)}
                                className="w-full text-left px-2 py-1.5 text-xs text-zinc-600 hover:bg-zinc-100 rounded-lg transition flex items-center gap-1.5 cursor-pointer mt-1 pt-1 border-t border-zinc-100"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-zinc-400" />
                                <span>Delete Record</span>
                              </button>
                            </div>
                          )}
                        </td>
                      </>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer */}
      <div className="mt-3 pt-3 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-600">
        <span>
          Showing <strong className="text-zinc-800 font-semibold">{filteredItems.length}</strong> of{" "}
          <strong className="text-zinc-800 font-semibold">{items.length}</strong> check-ins
        </span>
        <button
          onClick={() => {
            setSearchQuery("");
            setSelectedStatus("All");
          }}
          className="text-emerald-700 hover:text-emerald-800 font-medium transition cursor-pointer"
        >
          Reset Filters
        </button>
      </div>

      {/* Modal for Walk-in Gate Entry */}
      {isWalkinModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-zinc-200">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-emerald-700" />
                <span className="text-base font-bold text-zinc-900">
                  Walk-in Gate Entry Registration
                </span>
              </div>
              <button
                onClick={() => setIsWalkinModalOpen(false)}
                className="text-zinc-500 hover:text-zinc-800 font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Walk-in Error Alert */}
            {walkinError && (
              <div className="mt-3 p-2.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-800">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{walkinError}</span>
              </div>
            )}

            <form onSubmit={handleWalkinSubmit} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Farmer Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Baldev Singh"
                  value={walkinName}
                  onChange={(e) => setWalkinName(e.target.value)}
                  className="w-full px-3 py-2 text-zinc-900 bg-white border border-zinc-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-semibold placeholder:text-zinc-400 shadow-2xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Phone Number (Optional)</label>
                  <div className="relative flex items-center">
                    <span className="absolute left-2.5 flex items-center gap-1 text-[11px] font-bold text-zinc-800 bg-zinc-100 px-1.5 py-0.5 rounded-md border border-zinc-200 select-none">
                      <span>🇮🇳</span> +91
                    </span>
                    <input
                      type="tel"
                      maxLength={10}
                      placeholder="98123 00000"
                      value={walkinPhone.replace(/^\+91\s*/, "")}
                      onChange={(e) => setWalkinPhone("+91 " + e.target.value.replace(/\D/g, "").slice(0, 10))}
                      className="w-full pl-19 px-3 py-2 text-zinc-900 bg-white border border-zinc-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-bold font-mono placeholder:text-zinc-400 shadow-2xs"
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Village / Tehsil</label>
                  <input
                    type="text"
                    placeholder="e.g. Nissing / Karnal"
                    value={walkinVillage}
                    onChange={(e) => setWalkinVillage(e.target.value)}
                    className="w-full px-3 py-2 text-zinc-900 bg-white border border-zinc-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-semibold placeholder:text-zinc-400 shadow-2xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Crop Type</label>
                  <select
                    value={walkinCrop}
                    onChange={(e) => setWalkinCrop(e.target.value)}
                    className="w-full px-3 py-2 text-zinc-900 bg-white border border-zinc-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-semibold shadow-2xs"
                  >
                    <option className="text-zinc-900">Sharbati Wheat</option>
                    <option className="text-zinc-900">Basmati 1121</option>
                    <option className="text-zinc-900">Mustard Seeds</option>
                    <option className="text-zinc-900">Gram / Chana</option>
                    <option className="text-zinc-900">Paddy PR-126</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Estimated Load (Q)</label>
                  <input
                    type="number"
                    value={walkinQuantity}
                    onChange={(e) => setWalkinQuantity(e.target.value)}
                    className="w-full px-3 py-2 text-zinc-900 bg-white border border-zinc-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-semibold placeholder:text-zinc-400 shadow-2xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Vehicle / Tractor Number</label>
                <input
                  type="text"
                  value={walkinVehicle}
                  onChange={(e) => setWalkinVehicle(e.target.value)}
                  className="w-full px-3 py-2 text-zinc-900 bg-white border border-zinc-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-semibold placeholder:text-zinc-400 shadow-2xs"
                />
              </div>

              <div className="mt-5 pt-3 border-t border-zinc-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsWalkinModalOpen(false)}
                  className="px-4 py-2 rounded-full border border-zinc-200 text-zinc-700 font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingWalkin}
                  className="px-5 py-2 rounded-full bg-emerald-800 hover:bg-emerald-900 text-white font-bold cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSubmittingWalkin ? "Creating in Firestore..." : "Generate Gate Pass"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal for viewing Gate Pass Details */}
      {selectedFarmerDetails && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-zinc-200">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-zinc-900">
                  Gate Pass Verification
                </span>
                <span className="font-mono text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                  {selectedFarmerDetails.tokenId}
                </span>
              </div>
              <button
                onClick={() => setSelectedFarmerDetails(null)}
                className="text-zinc-600 hover:text-zinc-900 text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-zinc-100">
                <span className="text-zinc-600">Farmer Name:</span>
                <span className="font-bold text-zinc-900">{selectedFarmerDetails.farmerName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-100">
                <span className="text-zinc-600">Village / Tehsil:</span>
                <span className="font-semibold text-zinc-800">{selectedFarmerDetails.village}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-100">
                <span className="text-zinc-600">Crop Variety:</span>
                <span className="font-semibold text-zinc-800">{selectedFarmerDetails.cropType}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-100">
                <span className="text-zinc-600">Registered Load:</span>
                <span className="font-bold text-emerald-800">{selectedFarmerDetails.quantity}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-100">
                <span className="text-zinc-600">Slot Window:</span>
                <span className="font-semibold text-zinc-800">{selectedFarmerDetails.slotTime}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-100">
                <span className="text-zinc-600">Assigned Inspection Bay:</span>
                <span className="font-semibold text-zinc-800">{selectedFarmerDetails.bay}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-zinc-600">Status:</span>
                <div>{getStatusBadge(selectedFarmerDetails.status)}</div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                onClick={() => setSelectedFarmerDetails(null)}
                className="px-4 py-2 rounded-full border border-zinc-200 text-xs font-medium text-zinc-700 hover:bg-zinc-50 cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => {
                  alert(`Gate pass printed for ${selectedFarmerDetails.tokenId}`);
                  setSelectedFarmerDetails(null);
                }}
                className="px-4 py-2 rounded-full bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
              >
                Print Slip
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
