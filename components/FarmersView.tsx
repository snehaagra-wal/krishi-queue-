"use client";

import React, { useState, useMemo } from "react";
import {
  Users,
  Search,
  UserPlus,
  Phone,
  MapPin,
  Wheat,
  CheckCircle2,
  X,
  ShieldCheck,
} from "lucide-react";

interface FarmersViewProps {
  onReturnToDashboard?: () => void;
  showToast?: (message: string) => void;
}

export interface Farmer {
  id: string;
  name: string;
  village: string;
  phone: string;
  crops: string[];
  acres: number;
  verified: boolean;
}

const initialFarmers: Farmer[] = [
  {
    id: "F-101",
    name: "Gurpreet Singh",
    village: "Nilokheri",
    phone: "+91 98123 45671",
    crops: ["Sharbati Wheat", "Basmati 1121"],
    acres: 8.5,
    verified: true,
  },
  {
    id: "F-102",
    name: "Rameshwar Patel",
    village: "Gharaunda",
    phone: "+91 98123 45672",
    crops: ["Basmati 1121", "Mustard Seeds"],
    acres: 12.0,
    verified: true,
  },
  {
    id: "F-103",
    name: "Sukhdev Yadav",
    village: "Taraori",
    phone: "+91 98123 45673",
    crops: ["Mustard Seeds", "Gram / Chana"],
    acres: 6.0,
    verified: true,
  },
  {
    id: "F-104",
    name: "Harpreet Kaur",
    village: "Indri",
    phone: "+91 98123 45674",
    crops: ["Sharbati Wheat", "Maize"],
    acres: 14.5,
    verified: true,
  },
  {
    id: "F-105",
    name: "Balwinder Sandhu",
    village: "Karnal Rural",
    phone: "+91 98123 45675",
    crops: ["Gram / Chana", "Wheat"],
    acres: 5.0,
    verified: true,
  },
  {
    id: "F-106",
    name: "Jagtar Dhillon",
    village: "Assandh",
    phone: "+91 98123 45676",
    crops: ["Basmati 1121", "Wheat"],
    acres: 9.0,
    verified: true,
  },
];

export default function FarmersView({
  onReturnToDashboard,
  showToast,
}: FarmersViewProps) {
  const [farmers, setFarmers] = useState<Farmer[]>(initialFarmers);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form state for adding a new farmer
  const [newFarmer, setNewFarmer] = useState({
    name: "",
    village: "",
    phone: "",
    cropInput: "",
    acres: "",
  });

  // Filter farmers in real time based on search query (Name or Village)
  const filteredFarmers = useMemo(() => {
    return farmers.filter((f) => {
      const q = searchQuery.toLowerCase();
      return (
        f.name.toLowerCase().includes(q) ||
        f.village.toLowerCase().includes(q) ||
        f.phone.includes(q)
      );
    });
  }, [farmers, searchQuery]);

  // Handle adding new farmer
  const handleAddFarmerSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!newFarmer.name || !newFarmer.village || !newFarmer.phone) {
      alert("Please fill in all required fields.");
      return;
    }

    const createdFarmer: Farmer = {
      id: `F-${100 + farmers.length + 1}`,
      name: newFarmer.name.trim(),
      village: newFarmer.village.trim(),
      phone: newFarmer.phone.trim(),
      crops: newFarmer.cropInput
        ? newFarmer.cropInput.split(",").map((c) => c.trim())
        : ["Wheat"],
      acres: Number(newFarmer.acres) || 4.0,
      verified: true,
    };

    setFarmers([createdFarmer, ...farmers]);
    setIsAddModalOpen(false);

    // Reset form
    setNewFarmer({
      name: "",
      village: "",
      phone: "",
      cropInput: "",
      acres: "",
    });

    if (showToast) {
      showToast(`Farmer ${createdFarmer.name} registered successfully!`);
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-200">
      {/* 1. Header Bar with Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-200/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900">
              Registered Farmers Directory
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
              {farmers.length} Registered
            </span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-600 mt-1">
            Database of verified farmers, landholding sizes, and crop registrations at APMC Karnal Hub.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Add Farmer Button */}
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-full shadow-xs transition cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Register New Farmer</span>
          </button>

          {onReturnToDashboard && (
            <button
              onClick={onReturnToDashboard}
              className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold rounded-full shadow-xs transition cursor-pointer"
            >
              &larr; Back to Dashboard
            </button>
          )}
        </div>
      </div>

      {/* 2. Search Bar and Quick Stats Row */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-zinc-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Search Bar (Search by name or village) */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by farmer name, village..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-full focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 font-medium"
          />
        </div>

        <div className="flex items-center gap-3 text-xs text-zinc-600">
          <span>
            Showing <strong className="text-zinc-900 font-bold">{filteredFarmers.length}</strong> of{" "}
            <strong className="text-zinc-900 font-bold">{farmers.length}</strong> farmers
          </span>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="text-emerald-700 hover:underline font-semibold cursor-pointer"
            >
              Clear Search
            </button>
          )}
        </div>
      </div>

      {/* 3. Clean Farmers Table */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-zinc-200/80 shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[620px]">
            <thead>
              <tr className="border-b border-zinc-200/80 text-[11px] font-bold text-zinc-600 uppercase tracking-wider bg-zinc-50/50">
                <th className="py-3 px-4">Farmer ID & Name</th>
                <th className="py-3 px-3">Village / Tehsil</th>
                <th className="py-3 px-3">Contact Phone</th>
                <th className="py-3 px-3">Registered Crops</th>
                <th className="py-3 px-3">Landholding</th>
                <th className="py-3 px-4 text-right">Verification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filteredFarmers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-zinc-500 text-xs">
                    No farmers found matching &ldquo;{searchQuery}&rdquo;. Try another search term.
                  </td>
                </tr>
              ) : (
                filteredFarmers.map((farmer) => (
                  <tr
                    key={farmer.id}
                    className="hover:bg-zinc-50/80 transition-colors"
                  >
                    {/* Farmer Name & ID */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                          {farmer.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-zinc-900 text-xs">
                            {farmer.name}
                          </div>
                          <div className="text-[10px] text-zinc-500 font-mono">
                            {farmer.id}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Village */}
                    <td className="py-3 px-3 text-zinc-700">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-emerald-700 shrink-0" />
                        <span>{farmer.village}</span>
                      </span>
                    </td>

                    {/* Contact */}
                    <td className="py-3 px-3 text-zinc-600 font-mono">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-zinc-400 shrink-0" />
                        <span>{farmer.phone}</span>
                      </span>
                    </td>

                    {/* Registered Crops */}
                    <td className="py-3 px-3">
                      <div className="flex flex-wrap gap-1">
                        {farmer.crops.map((crop, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200"
                          >
                            {crop}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Landholding */}
                    <td className="py-3 px-3 text-zinc-700 font-medium">
                      {farmer.acres} Acres
                    </td>

                    {/* Verification Status */}
                    <td className="py-3 px-4 text-right">
                      {farmer.verified ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                          <span>e-KYC Verified</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-100 text-zinc-600">
                          Pending
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Add Farmer Modal (Clean & Easy to Explain) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-zinc-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-900">
                    Register New Farmer
                  </h3>
                  <p className="text-[11px] text-zinc-500">
                    Add farmer to Mandi Queue database
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-800 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleAddFarmerSubmit} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Farmer Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Baldev Singh"
                  value={newFarmer.name}
                  onChange={(e) =>
                    setNewFarmer({ ...newFarmer, name: e.target.value })
                  }
                  required
                  className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Village / Tehsil <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Nilokheri, Karnal"
                  value={newFarmer.village}
                  onChange={(e) =>
                    setNewFarmer({ ...newFarmer, village: e.target.value })
                  }
                  required
                  className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Mobile Number (for SMS token) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  placeholder="e.g. +91 98123 00000"
                  value={newFarmer.phone}
                  onChange={(e) =>
                    setNewFarmer({ ...newFarmer, phone: e.target.value })
                  }
                  required
                  className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Crops (comma-separated)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Wheat, Mustard"
                    value={newFarmer.cropInput}
                    onChange={(e) =>
                      setNewFarmer({ ...newFarmer, cropInput: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Land (Acres)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 7.5"
                    value={newFarmer.acres}
                    onChange={(e) =>
                      setNewFarmer({ ...newFarmer, acres: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Form Action Buttons */}
              <div className="pt-3 border-t border-zinc-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-full border border-zinc-200 text-xs font-medium text-zinc-700 hover:bg-zinc-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  Add Farmer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
