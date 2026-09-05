"use client";

import React, { useState } from "react";
import {
  Wheat,
  Clock,
  Calendar,
  CheckCircle2,
  Layers,
  LogOut,
  MapPin,
  QrCode,
  Truck,
  PlusCircle,
  Building2,
  FileText,
  User,
  AlertCircle,
} from "lucide-react";

interface FarmerPortalViewProps {
  farmerName?: string;
  farmerPhone?: string;
  farmerLocation?: string;
  onLogout: () => void;
  showToast?: (message: string) => void;
}

export default function FarmerPortalView({
  farmerName = "Gurpreet Singh",
  farmerPhone = "+91 98123 45671",
  farmerLocation = "Nilokheri, Karnal",
  onLogout,
  showToast,
}: FarmerPortalViewProps) {
  // Live token state
  const [activeToken, setActiveToken] = useState({
    tokenId: "TK-108",
    status: "Serving at Bay 3",
    bay: "Electronic Weighbridge Bay 3",
    crop: "Sharbati Wheat (Grade A)",
    quantity: "42.5 Quintals",
    vehicle: "HR-05-AB-1290 (Tractor Trolley)",
    gateEntryTime: "09:40 AM",
    expectedWait: "~4 mins",
    mandi: "APMC Karnal Main Hub",
  });

  // Slot booking form state
  const [bookCenter, setBookCenter] = useState("APMC Karnal Main Hub");
  const [bookCrop, setBookCrop] = useState("Sharbati Wheat");
  const [bookQuantity, setBookQuantity] = useState("35.0");
  const [bookDate, setBookDate] = useState("2026-09-06");
  const [bookTime, setBookTime] = useState("10:00 AM - 11:00 AM");
  const [bookVehicle, setBookVehicle] = useState("HR-05-AB-1290");

  // Past Bookings & Payments History
  const [history] = useState([
    {
      id: "H-1",
      token: "TK-108",
      date: "05 Sep 2026 (Today)",
      crop: "Sharbati Wheat",
      weight: "42.5 Q",
      status: "In Progress",
      payout: "Pending Weighing",
    },
    {
      id: "H-2",
      token: "TK-089",
      date: "28 Aug 2026",
      crop: "Basmati 1121",
      weight: "38.0 Q",
      status: "Completed",
      payout: "₹1,46,300 (Credited DBT)",
    },
    {
      id: "H-3",
      token: "TK-074",
      date: "14 Aug 2026",
      crop: "Sharbati Wheat",
      weight: "45.0 Q",
      status: "Completed",
      payout: "₹1,02,375 (Credited DBT)",
    },
  ]);

  const handleBookSlotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const generatedToken = `TK-${Math.floor(120 + Math.random() * 30)}`;
    setActiveToken({
      tokenId: generatedToken,
      status: "Slot Confirmed",
      bay: "Gate 1-A Queue",
      crop: `${bookCrop} (${bookQuantity}Q)`,
      quantity: `${bookQuantity} Quintals`,
      vehicle: bookVehicle,
      gateEntryTime: bookTime,
      expectedWait: "Scheduled for tomorrow",
      mandi: bookCenter,
    });

    if (showToast) {
      showToast(`Slot booked! Your Token Number is #${generatedToken}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#edf1ed] text-zinc-900 font-sans flex flex-col antialiased">
      {/* 1. Farmer Top Header */}
      <header className="w-full bg-white border-b border-zinc-200 sticky top-0 z-40">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img
              src="/krishi logo.png"
              alt="Krishi-Queue Logo"
              className="w-9 h-9 object-contain drop-shadow-sm"
            />
            <div>
              <span className="font-extrabold text-xl tracking-tight text-emerald-950 flex items-center gap-1.5">
                Krishi-Queue
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
                  Farmer Portal
                </span>
              </span>
              <span className="text-[11px] text-zinc-500 hidden sm:inline-block">
                Kisan Slot Booking & Token Status
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-right hidden sm:flex">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs">
                {farmerName.charAt(0)}
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-zinc-900 leading-tight">
                  {farmerName}
                </div>
                <div className="text-[10px] text-zinc-500">{farmerLocation}</div>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-zinc-100 hover:bg-rose-50 text-zinc-700 hover:text-rose-700 border border-zinc-200 hover:border-rose-200 rounded-full text-xs font-bold transition cursor-pointer"
              title="Log out of farmer portal"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-[1280px] w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6">
        {/* Welcome greeting */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-zinc-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-zinc-900">
              Welcome back, {farmerName}!
            </h1>
            <p className="text-xs sm:text-sm text-zinc-600 mt-0.5">
              Registered Mandi: <strong className="text-zinc-800">{activeToken.mandi}</strong> • Contact: <strong className="text-zinc-800">{farmerPhone}</strong>
            </p>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold self-start sm:self-auto">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
            <span>Aadhaar & e-NAM Verified</span>
          </div>
        </div>

        {/* Section 1: Live Token & Queue Status Card */}
        <div className="bg-white rounded-3xl p-5 sm:p-7 border border-emerald-200/90 shadow-md shadow-emerald-900/5 relative overflow-hidden">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3 flex-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-900 border border-emerald-300">
                  Active Mandi Token
                </span>
                <span className="text-xs text-zinc-500 font-medium">
                  Gate Pass #GP-2026-9042
                </span>
              </div>

              <div className="flex items-baseline gap-3">
                <span className="text-4xl sm:text-5xl font-black text-emerald-950 font-mono tracking-tight">
                  #{activeToken.tokenId}
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-lime-100 text-lime-900 border border-lime-300">
                  <span className="w-2 h-2 rounded-full bg-lime-600 animate-pulse"></span>
                  {activeToken.status}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2 text-xs">
                <div className="p-3 bg-zinc-50 rounded-2xl border border-zinc-200">
                  <span className="text-zinc-500 block text-[11px]">Current Bay:</span>
                  <strong className="text-zinc-900 text-xs">{activeToken.bay}</strong>
                </div>
                <div className="p-3 bg-zinc-50 rounded-2xl border border-zinc-200">
                  <span className="text-zinc-500 block text-[11px]">Registered Load:</span>
                  <strong className="text-zinc-900 text-xs">{activeToken.crop}</strong>
                </div>
                <div className="p-3 bg-zinc-50 rounded-2xl border border-zinc-200">
                  <span className="text-zinc-500 block text-[11px]">Tractor / Vehicle:</span>
                  <strong className="text-zinc-900 text-xs">{activeToken.vehicle}</strong>
                </div>
              </div>
            </div>

            {/* QR Code & Fast Gate Pass box */}
            <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-200 flex flex-col items-center text-center justify-center shrink-0 w-full lg:w-48">
              <div className="w-20 h-20 bg-white rounded-xl border border-emerald-200 p-2 flex items-center justify-center shadow-xs">
                <QrCode className="w-16 h-16 text-emerald-900" />
              </div>
              <span className="text-[11px] font-bold text-emerald-900 mt-2">
                Scan at Gate 1-A Scanner
              </span>
              <span className="text-[10px] text-emerald-700">
                Show to Weighbridge Operator
              </span>
            </div>
          </div>
        </div>

        {/* Section 2: Book a New Mandi Slot Form */}
        <div className="bg-white rounded-3xl p-5 sm:p-7 border border-zinc-200/80 shadow-xs">
          <div className="pb-3 border-b border-zinc-100 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <PlusCircle className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-zinc-900">
                Book a New Mandi Time Slot
              </h2>
              <p className="text-xs text-zinc-500">
                Reserve an arrival slot to avoid gate queues and get priority weighbridge entry
              </p>
            </div>
          </div>

          <form onSubmit={handleBookSlotSubmit} className="mt-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                  Procurement Center
                </label>
                <select
                  value={bookCenter}
                  onChange={(e) => setBookCenter(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                >
                  <option>APMC Karnal Main Hub</option>
                  <option>Taraori Grain Yard</option>
                  <option>Nilokheri Grain Depot</option>
                  <option>Gharaunda Sub-Yard</option>
                  <option>Indri Silo Hub</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                  Crop Variety
                </label>
                <select
                  value={bookCrop}
                  onChange={(e) => setBookCrop(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                >
                  <option>Sharbati Wheat (Grade A)</option>
                  <option>Basmati Paddy 1121</option>
                  <option>Mustard Seeds</option>
                  <option>Gram / Chana</option>
                  <option>Maize Hybrid</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                  Estimated Load (Quintals)
                </label>
                <input
                  type="number"
                  value={bookQuantity}
                  onChange={(e) => setBookQuantity(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  min={5}
                  max={200}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                  Preferred Date
                </label>
                <input
                  type="date"
                  value={bookDate}
                  onChange={(e) => setBookDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                  Time Slot Window
                </label>
                <select
                  value={bookTime}
                  onChange={(e) => setBookTime(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                >
                  <option>08:00 AM - 09:00 AM</option>
                  <option>09:00 AM - 10:00 AM</option>
                  <option>10:00 AM - 11:00 AM</option>
                  <option>11:00 AM - 12:00 PM</option>
                  <option>01:00 PM - 02:00 PM</option>
                  <option>02:00 PM - 03:00 PM</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                  Tractor / Vehicle Plate
                </label>
                <input
                  type="text"
                  value={bookVehicle}
                  onChange={(e) => setBookVehicle(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="px-6 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-full shadow-xs transition cursor-pointer"
              >
                Confirm Slot & Generate Token
              </button>
            </div>
          </form>
        </div>

        {/* Section 3: Past Procurement & Direct Benefit Transfer History */}
        <div className="bg-white rounded-3xl p-5 sm:p-7 border border-zinc-200/80 shadow-xs">
          <div className="pb-3 border-b border-zinc-100 flex items-center justify-between">
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-zinc-900">
                Procurement & Payout History
              </h2>
              <p className="text-xs text-zinc-500">
                MSP payments processed via e-NAM Direct Benefit Transfer (DBT)
              </p>
            </div>
            <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              Bank A/C: •••• 4092 (PNB)
            </span>
          </div>

          <div className="overflow-x-auto mt-3">
            <table className="w-full text-left text-xs border-collapse min-w-[500px]">
              <thead>
                <tr className="border-b border-zinc-200 text-[11px] font-bold text-zinc-600 uppercase bg-zinc-50/50">
                  <th className="py-2.5 px-3">Token ID</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Crop Variety</th>
                  <th className="py-2.5 px-3">Net Weight</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Payment Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {history.map((item) => (
                  <tr key={item.id} className="hover:bg-zinc-50/70">
                    <td className="py-3 px-3 font-mono font-bold text-zinc-900">
                      {item.token}
                    </td>
                    <td className="py-3 px-3 text-zinc-600">{item.date}</td>
                    <td className="py-3 px-3 font-medium text-zinc-800">{item.crop}</td>
                    <td className="py-3 px-3 font-semibold text-zinc-900">{item.weight}</td>
                    <td className="py-3 px-3">
                      {item.status === "Completed" ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Completed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-lime-800">
                          <Clock className="w-3 h-3 text-lime-600" />
                          In Progress
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-emerald-900">
                      {item.payout}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
