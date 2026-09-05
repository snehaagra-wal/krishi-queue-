"use client";

import React, { useState, useMemo } from "react";
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
} from "lucide-react";

export interface CheckinItem {
  id: string;
  tokenId: string;
  farmerName: string;
  village: string;
  cropType: string;
  quantity: string;
  slotTime: string;
  status: "Completed" | "Waiting" | "In Progress" | "Verified";
  bay: string;
}

const initialCheckins: CheckinItem[] = [
  {
    id: "1",
    tokenId: "TK-108",
    farmerName: "Gurpreet Singh",
    village: "Nilokheri",
    cropType: "Sharbati Wheat",
    quantity: "42.5 Quintals",
    slotTime: "10:00 AM - 10:45 AM",
    status: "In Progress",
    bay: "Bay 3 (Weighbridge)",
  },
  {
    id: "2",
    tokenId: "TK-107",
    farmerName: "Rameshwar Patel",
    village: "Gharaunda",
    cropType: "Basmati 1121",
    quantity: "38.0 Quintals",
    slotTime: "09:30 AM - 10:15 AM",
    status: "Completed",
    bay: "Bay 1 (Cleared)",
  },
  {
    id: "3",
    tokenId: "TK-106",
    farmerName: "Sukhdev Yadav",
    village: "Taraori",
    cropType: "Mustard Seeds",
    quantity: "24.2 Quintals",
    slotTime: "10:30 AM - 11:15 AM",
    status: "Waiting",
    bay: "Gate 1-A Queue",
  },
  {
    id: "4",
    tokenId: "TK-105",
    farmerName: "Harpreet Kaur",
    village: "Indri",
    cropType: "Sharbati Wheat",
    quantity: "51.0 Quintals",
    slotTime: "09:00 AM - 09:45 AM",
    status: "Completed",
    bay: "Bay 4 (Silo 2)",
  },
  {
    id: "5",
    tokenId: "TK-104",
    farmerName: "Balwinder Sandhu",
    village: "Karnal Rural",
    cropType: "Gram / Chana",
    quantity: "19.8 Quintals",
    slotTime: "11:00 AM - 11:45 AM",
    status: "Verified",
    bay: "Bay 2 (Moisture Test)",
  },
  {
    id: "6",
    tokenId: "TK-103",
    farmerName: "Jagtar Dhillon",
    village: "Assandh",
    cropType: "Basmati 1121",
    quantity: "44.0 Quintals",
    slotTime: "08:30 AM - 09:15 AM",
    status: "Completed",
    bay: "Bay 3 (Cleared)",
  },
];

export default function RecentFarmerCheckins() {
  const [items, setItems] = useState<CheckinItem[]>(initialCheckins);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("All");
  const [selectedRows, setSelectedRows] = useState<Record<string, boolean>>({
    "1": true, // Match Dribbble screenshot where one row is checked by default
  });
  const [showFilterDropdown, setShowFilterDropdown] = useState<boolean>(false);
  const [activeActionMenu, setActiveActionMenu] = useState<string | null>(null);
  const [selectedFarmerDetails, setSelectedFarmerDetails] = useState<CheckinItem | null>(null);

  // Filtered rows based on search and status dropdown
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        item.farmerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.tokenId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.cropType.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.village.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        selectedStatus === "All" || item.status === selectedStatus;

      return matchesSearch && matchesStatus;
    });
  }, [items, searchQuery, selectedStatus]);

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

  const getStatusBadge = (status: CheckinItem["status"]) => {
    switch (status) {
      case "Completed":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
            Completed
          </span>
        );
      case "In Progress":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-lime-50 text-lime-900 border border-lime-300">
            <span className="w-1.5 h-1.5 rounded-full bg-lime-600 animate-pulse"></span>
            In Progress
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
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-zinc-200/80 shadow-xs flex flex-col justify-between h-full">
      {/* Table Header with Search & Filter (Matching Dribbble Layout) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-100">
        <div>
          <h3 className="text-base sm:text-lg font-extrabold text-zinc-900 tracking-tight">
            Recent Farmer Check-ins
          </h3>
          <p className="text-xs text-zinc-600">
            Live token verification, crop variety & bay assignment
          </p>
        </div>

        {/* Search & Filter Controls */}
        <div className="flex items-center gap-2">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-full w-36 sm:w-44 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
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
                {["All", "Completed", "In Progress", "Waiting", "Verified"].map(
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
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto -mx-5 sm:mx-0 mt-2 flex-1">
        <table className="w-full text-left border-collapse min-w-[560px]">
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
              <th className="py-2.5 px-3">Crop & Quantity</th>
              <th className="py-2.5 px-3">Slot Time</th>
              <th className="py-2.5 px-3">Status</th>
              <th className="py-2.5 px-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 text-xs">
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-zinc-600">
                  No farmer check-ins match your search filter.
                </td>
              </tr>
            ) : (
              filteredItems.map((row) => {
                const isChecked = !!selectedRows[row.id];
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
                      {row.tokenId}
                    </td>

                    {/* Farmer Name & Village */}
                    <td className="py-3 px-3">
                      <div className="font-semibold text-zinc-900">
                        {row.farmerName}
                      </div>
                      <div className="text-[11px] text-zinc-600">
                        {row.village} • {row.bay}
                      </div>
                    </td>

                    {/* Crop Type & Quantity */}
                    <td className="py-3 px-3">
                      <div className="font-medium text-zinc-800">
                        {row.cropType}
                      </div>
                      <div className="text-[11px] text-zinc-600 font-medium">
                        {row.quantity}
                      </div>
                    </td>

                    {/* Slot Time */}
                    <td className="py-3 px-3 text-zinc-600 whitespace-nowrap">
                      {row.slotTime}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      {getStatusBadge(row.status)}
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
                        <div className="absolute right-2 top-8 w-44 bg-white rounded-xl shadow-xl border border-zinc-200 p-1.5 z-40 text-left animate-in fade-in zoom-in-95 duration-100">
                          <button
                            onClick={() => {
                              setSelectedFarmerDetails(row);
                              setActiveActionMenu(null);
                            }}
                            className="w-full px-2.5 py-1.5 text-xs text-zinc-700 hover:bg-zinc-100 rounded-lg flex items-center gap-2 transition cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5 text-zinc-500" />
                            <span>View Gate Pass</span>
                          </button>
                          <button
                            onClick={() => {
                              alert(`Printing slip for ${row.tokenId} (${row.farmerName})`);
                              setActiveActionMenu(null);
                            }}
                            className="w-full px-2.5 py-1.5 text-xs text-zinc-700 hover:bg-zinc-100 rounded-lg flex items-center gap-2 transition cursor-pointer"
                          >
                            <Printer className="w-3.5 h-3.5 text-zinc-500" />
                            <span>Print Weigh Slip</span>
                          </button>
                          <button
                            onClick={() => {
                              alert(`Notified ${row.farmerName} via Mandi SMS gateway.`);
                              setActiveActionMenu(null);
                            }}
                            className="w-full px-2.5 py-1.5 text-xs text-emerald-800 hover:bg-emerald-50 rounded-lg flex items-center gap-2 transition cursor-pointer font-medium"
                          >
                            <Clock className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Send SMS Alert</span>
                          </button>
                        </div>
                      )}
                    </td>
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
