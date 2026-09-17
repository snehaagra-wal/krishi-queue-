"use client";

import React, { useState, useEffect, useMemo } from "react";
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
  Trash2,
  RefreshCw,
  AlertCircle,
  Landmark,
  Edit3,
} from "lucide-react";
import {
  subscribeToFarmers,
  createFarmer,
  deleteFarmer,
  updateFarmer,
  verifyFarmerAadhaar,
  Farmer,
  isRealPhoneNumber,
} from "@/lib/firestoreService";

interface FarmersViewProps {
  onReturnToDashboard?: () => void;
  showToast?: (message: string) => void;
}

export default function FarmersView({
  onReturnToDashboard,
  showToast,
}: FarmersViewProps) {
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Edit Farmer modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingFarmer, setEditingFarmer] = useState<Farmer | null>(null);
  const [editName, setEditName] = useState("");
  const [editVillage, setEditVillage] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editCrops, setEditCrops] = useState("");
  const [editAcres, setEditAcres] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Form state - Add farmer modal form state
  const [newFarmer, setNewFarmer] = useState({
    name: "",
    village: "",
    phone: "",
    cropInput: "",
    acres: "",
    aadhaar: "",
    bankAccountNumber: "",
    bankName: "State Bank of India",
    ifscCode: "",
  });

  // Subscribe in real-time to Firestore farmers collection (Zero mock data fallback)
  useEffect(() => {
    setLoading(true);
    setFetchError(null);
    const unsubscribe = subscribeToFarmers(
      (realtimeFarmers) => {
        setFarmers(realtimeFarmers || []);
        setLoading(false);
      },
      (err) => {
        console.error("Failed to subscribe to farmers:", err);
        setFetchError("Failed to fetch farmers from Firestore. Please check connection.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Filter farmers in real time based on search query (Name or Village or Phone)
  const filteredFarmers = useMemo(() => {
    return farmers.filter((f) => {
      const q = searchQuery.toLowerCase();
      const phoneClean = isRealPhoneNumber(f.phone) ? f.phone : "";
      return (
        f.name.toLowerCase().includes(q) ||
        f.village.toLowerCase().includes(q) ||
        (phoneClean && phoneClean.includes(q))
      );
    });
  }, [farmers, searchQuery]);

  // Handle adding new farmer into Firestore with strict validation
  const handleAddFarmerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanPhone = newFarmer.phone.replace(/\D/g, "").slice(-10);

    if (!newFarmer.name.trim()) {
      setFormError("किसान का पूरा नाम आवश्यक है (Farmer full name is required).");
      return;
    }

    if (!newFarmer.village.trim()) {
      setFormError("गाँव या तहसील का नाम आवश्यक है (Village / Tehsil is required).");
      return;
    }

    const cleanAadhaar = newFarmer.aadhaar.replace(/\D/g, "");
    if (newFarmer.aadhaar.trim() && cleanAadhaar.length !== 12) {
      setFormError("आधार नंबर ठीक 12 अंकों का होना चाहिए (Aadhaar must be exactly 12 digits).");
      return;
    }

    setIsSubmitting(true);
    try {
      const isAadhaarProvided = cleanAadhaar.length === 12;

      const farmerData: Omit<Farmer, "id"> = {
        name: newFarmer.name.trim(),
        village: newFarmer.village.trim(),
        phone: cleanPhone.length === 10 ? `+91 ${cleanPhone}` : "",
        crops: newFarmer.cropInput
          ? newFarmer.cropInput.split(",").map((c) => c.trim()).filter(Boolean)
          : ["Sharbati Wheat", "Paddy"],
        acres: Number(newFarmer.acres) || 4.0,
        verified: isAadhaarProvided,
        aadhaarVerified: isAadhaarProvided,
        aadhaarNumber: isAadhaarProvided ? cleanAadhaar : undefined,
        bankAccountNumber: newFarmer.bankAccountNumber.replace(/\D/g, "") || undefined,
        bankName: newFarmer.bankName.trim() || undefined,
        ifscCode: newFarmer.ifscCode.trim().toUpperCase() || undefined,
      };

      await createFarmer(farmerData);
      setIsAddModalOpen(false);

      // Reset form
      setNewFarmer({
        name: "",
        village: "",
        phone: "",
        cropInput: "",
        acres: "",
        aadhaar: "",
        bankAccountNumber: "",
        bankName: "State Bank of India",
        ifscCode: "",
      });

      if (showToast) {
        showToast(`Farmer ${farmerData.name} saved to Firestore successfully!`);
      }
    } catch (err: any) {
      console.error("Error creating farmer in Firestore:", err);
      setFormError(err.message || "Error saving farmer to database.");
      if (showToast) showToast("Error saving farmer: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEdit = (farmer: Farmer) => {
    setEditingFarmer(farmer);
    setEditName(farmer.name);
    setEditVillage(farmer.village);
    const hasValidPhone = isRealPhoneNumber(farmer.phone);
    setEditPhone(hasValidPhone ? farmer.phone.replace(/\D/g, "").slice(-10) : "");
    setEditCrops(farmer.crops ? farmer.crops.join(", ") : "Wheat, Paddy");
    setEditAcres(String(farmer.acres || 4.0));
    setEditError(null);
    setIsEditModalOpen(true);
  };

  const handleSaveEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFarmer) return;
    setEditError(null);

    const cleanPhone = editPhone.replace(/\D/g, "").slice(-10);
    if (!editName.trim()) {
      setEditError("Farmer name is required.");
      return;
    }
    if (!editVillage.trim()) {
      setEditError("Village / Tehsil is required.");
      return;
    }

    setIsSavingEdit(true);
    try {
      await updateFarmer(editingFarmer.id, {
        name: editName.trim(),
        village: editVillage.trim(),
        phone: cleanPhone.length === 10 ? `+91 ${cleanPhone}` : "",
        acres: Number(editAcres) || 4.0,
        crops: editCrops ? editCrops.split(",").map((c) => c.trim()).filter(Boolean) : ["Wheat", "Paddy"],
      });

      setIsEditModalOpen(false);
      if (showToast) {
        showToast(`Farmer ${editName} profile updated successfully in Firestore!`);
      }
    } catch (err: any) {
      console.error("Error updating farmer in Firestore:", err);
      setEditError(err.message || "Failed to update farmer.");
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDeleteFarmer = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove ${name} from registered farmers?`)) {
      return;
    }
    try {
      await deleteFarmer(id);
      if (showToast) {
        showToast(`Farmer ${name} deleted successfully.`);
      }
    } catch (err: any) {
      console.error("Error deleting farmer:", err);
      if (showToast) showToast("Error deleting: " + err.message);
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
              {farmers.length} Registered (Firestore)
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
        {/* Search Bar */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by farmer name, village..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-white text-zinc-900 border border-zinc-300 placeholder:text-zinc-400 rounded-full focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 font-semibold"
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
                <th className="py-3 px-3">Verification</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {fetchError ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-xs">
                    <div className="flex items-center justify-center gap-2 text-rose-600 font-semibold">
                      <AlertCircle className="w-4 h-4" />
                      <span>{fetchError}</span>
                    </div>
                  </td>
                </tr>
              ) : filteredFarmers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-zinc-500 text-xs">
                    {loading
                      ? "Loading farmers from Firestore..."
                      : farmers.length === 0
                      ? "No registered farmers in database. Click 'Register New Farmer' above to add."
                      : "No farmers found matching search query."}
                  </td>
                </tr>
              ) : (
                filteredFarmers.map((farmer) => (
                  <tr
                    key={farmer.id}
                    className="hover:bg-zinc-50/80 transition-colors group"
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
                            {farmer.id.length > 8 ? farmer.id.slice(0, 8).toUpperCase() : farmer.id}
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

                    {/* Contact & Bank A/C */}
                    <td className="py-3 px-3">
                      {isRealPhoneNumber(farmer.phone) ? (
                        <div className="flex items-center gap-1 font-mono text-zinc-800 font-semibold text-xs">
                          <Phone className="w-3 h-3 text-zinc-400 shrink-0" />
                          <span>{farmer.phone}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-xs">
                          <Phone className="w-3 h-3 text-zinc-300 shrink-0" />
                          <span className="text-zinc-400 italic font-medium font-sans">
                            Not Found
                          </span>
                        </div>
                      )}
                      <div className="text-[10px] text-zinc-600 font-sans mt-0.5 flex items-center gap-1">
                        <Landmark className="w-3 h-3 text-emerald-700 shrink-0" />
                        {farmer.bankAccountNumber ? (
                          <span>•••• {farmer.bankAccountNumber.slice(-4)} ({farmer.bankName || "Bank"})</span>
                        ) : (
                          <span className="text-zinc-400 italic">No Bank Linked</span>
                        )}
                      </div>
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
                    <td className="py-3 px-3">
                      {farmer.aadhaarVerified || farmer.verified ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                          <span>Aadhaar Verified</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={async () => {
                            const aadhaar = window.prompt(
                              `Enter 12-digit Aadhaar number to verify identity for ${farmer.name}:`
                            );
                            if (aadhaar) {
                              const cleanDigits = aadhaar.replace(/\D/g, "");
                              if (cleanDigits.length === 12) {
                                await verifyFarmerAadhaar(farmer.id, cleanDigits);
                                if (showToast) {
                                  showToast(`Aadhaar verified for ${farmer.name}! Status updated in database.`);
                                }
                              } else {
                                alert("Invalid Aadhaar! Please enter exactly 12 digits.");
                              }
                            }
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 transition cursor-pointer"
                          title="Click to verify Aadhaar with UIDAI"
                        >
                          <ShieldCheck className="w-3 h-3 text-amber-700" />
                          <span>Verify Aadhaar</span>
                        </button>
                      )}
                    </td>

                    {/* Action: Edit and Delete */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEdit(farmer)}
                          className="p-1.5 rounded-lg text-zinc-500 hover:text-emerald-700 hover:bg-emerald-50 transition cursor-pointer"
                          title="Edit Farmer Profile"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteFarmer(farmer.id, farmer.name)}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                          title="Delete Farmer Record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Add Farmer Modal */}
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
                    Add farmer to Mandi Queue Firestore database
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

            {/* Modal Error Alert Banner */}
            {formError && (
              <div className="mt-3 p-2.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-800 font-medium animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Modal Form */}
            <form onSubmit={handleAddFarmerSubmit} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sneha Agrawal"
                  value={newFarmer.name}
                  onChange={(e) =>
                    setNewFarmer({ ...newFarmer, name: e.target.value })
                  }
                  className="w-full px-3 py-2 text-xs bg-white text-zinc-900 border border-zinc-300 placeholder:text-zinc-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Village / Tehsil *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Nissing"
                    value={newFarmer.village}
                    onChange={(e) =>
                      setNewFarmer({ ...newFarmer, village: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs bg-white text-zinc-900 border border-zinc-300 placeholder:text-zinc-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Mobile Number (Optional)
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-2.5 flex items-center gap-1 text-[11px] font-bold text-zinc-800 bg-zinc-100 px-1.5 py-0.5 rounded-md border border-zinc-200 select-none">
                      <span>🇮🇳</span> +91
                    </span>
                    <input
                      type="tel"
                      maxLength={10}
                      placeholder="98123 00000"
                      value={newFarmer.phone.replace(/^\+91\s*/, "")}
                      onChange={(e) =>
                        setNewFarmer({
                          ...newFarmer,
                          phone: "+91 " + e.target.value.replace(/\D/g, "").slice(0, 10),
                        })
                      }
                      className="w-full pl-19 pr-3 py-2 text-xs bg-white text-zinc-900 border border-zinc-300 placeholder:text-zinc-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold font-mono tracking-wider"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Registered Crops
                  </label>
                  <input
                    type="text"
                    placeholder="Wheat, Paddy, Mustard"
                    value={newFarmer.cropInput}
                    onChange={(e) =>
                      setNewFarmer({ ...newFarmer, cropInput: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs bg-white text-zinc-900 border border-zinc-300 placeholder:text-zinc-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Landholding (Acres)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    placeholder="e.g. 8.5"
                    value={newFarmer.acres}
                    onChange={(e) =>
                      setNewFarmer({ ...newFarmer, acres: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs bg-white text-zinc-900 border border-zinc-300 placeholder:text-zinc-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Aadhaar Number (12 Digits - Optional)
                </label>
                <input
                  type="text"
                  maxLength={14}
                  placeholder="e.g. 5412 8923 1045"
                  value={newFarmer.aadhaar}
                  onChange={(e) =>
                    setNewFarmer({ ...newFarmer, aadhaar: e.target.value })
                  }
                  className="w-full px-3 py-2 text-xs bg-white text-zinc-900 border border-zinc-300 placeholder:text-zinc-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold font-mono"
                />
              </div>

              {/* Bank Account Details Section for DBT */}
              <div className="pt-2 border-t border-zinc-200/70">
                <div className="flex items-center gap-1.5 mb-2 text-xs font-bold text-zinc-900">
                  <Landmark className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Bank Account Details (e-NAM DBT Payouts)</span>
                </div>

                <div className="space-y-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-700 mb-0.5">
                      Bank Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. State Bank of India, Punjab National Bank, HDFC"
                      value={newFarmer.bankName}
                      onChange={(e) =>
                        setNewFarmer({ ...newFarmer, bankName: e.target.value })
                      }
                      className="w-full px-3 py-1.5 text-xs bg-white text-zinc-900 border border-zinc-300 placeholder:text-zinc-400 rounded-xl focus:ring-2 focus:ring-emerald-500 font-semibold"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-zinc-700 mb-0.5">
                        Account Number
                      </label>
                      <input
                        type="text"
                        maxLength={18}
                        placeholder="e.g. 38192019481"
                        value={newFarmer.bankAccountNumber}
                        onChange={(e) =>
                          setNewFarmer({
                            ...newFarmer,
                            bankAccountNumber: e.target.value.replace(/\D/g, ""),
                          })
                        }
                        className="w-full px-3 py-1.5 text-xs bg-white text-zinc-900 border border-zinc-300 placeholder:text-zinc-400 rounded-xl focus:ring-2 focus:ring-emerald-500 font-semibold font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-zinc-700 mb-0.5">
                        IFSC Code
                      </label>
                      <input
                        type="text"
                        maxLength={11}
                        placeholder="e.g. SBIN0001244"
                        value={newFarmer.ifscCode}
                        onChange={(e) =>
                          setNewFarmer({
                            ...newFarmer,
                            ifscCode: e.target.value.toUpperCase(),
                          })
                        }
                        className="w-full px-3 py-1.5 text-xs bg-white text-zinc-900 border border-zinc-300 placeholder:text-zinc-400 rounded-xl focus:ring-2 focus:ring-emerald-500 font-semibold font-mono uppercase"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-zinc-50 rounded-2xl border border-zinc-200 flex items-center gap-2 text-[11px] text-zinc-600">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  If Aadhaar is provided, the farmer is marked Verified immediately; otherwise, status can be verified anytime.
                </span>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 rounded-full transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 rounded-full shadow-xs transition cursor-pointer flex items-center gap-1.5"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      <span>Saving to Firestore...</span>
                    </>
                  ) : (
                    <span>Register Farmer</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* 5. Edit Farmer Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-zinc-200 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-900">
                    Edit Farmer Profile
                  </h3>
                  <p className="text-[11px] text-zinc-500">
                    Correct details directly in Firestore
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-800 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {editError && (
              <div className="mt-3 p-2.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-800 font-medium">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleSaveEditSubmit} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-zinc-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 bg-white text-zinc-900 border border-zinc-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-semibold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">
                    Mobile Number (Optional)
                  </label>
                  <input
                    type="tel"
                    maxLength={10}
                    placeholder="Optional"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value.replace(/\D/g, ""))}
                    className="w-full px-3 py-2 bg-white text-zinc-900 border border-zinc-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-semibold font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">
                    Village / Tehsil *
                  </label>
                  <input
                    type="text"
                    required
                    value={editVillage}
                    onChange={(e) => setEditVillage(e.target.value)}
                    className="w-full px-3 py-2 bg-white text-zinc-900 border border-zinc-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">
                    Land Area (Acres)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={editAcres}
                    onChange={(e) => setEditAcres(e.target.value)}
                    className="w-full px-3 py-2 bg-white text-zinc-900 border border-zinc-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">
                    Registered Crops
                  </label>
                  <input
                    type="text"
                    value={editCrops}
                    onChange={(e) => setEditCrops(e.target.value)}
                    placeholder="e.g. Wheat, Basmati"
                    className="w-full px-3 py-2 bg-white text-zinc-900 border border-zinc-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-semibold"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-zinc-700 hover:bg-zinc-100 rounded-full transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="px-5 py-2 font-bold bg-emerald-800 hover:bg-emerald-900 text-white rounded-full transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                >
                  {isSavingEdit ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Changes</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
