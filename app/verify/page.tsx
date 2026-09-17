"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  ShieldCheck,
  Building2,
  Calendar,
  Clock,
  Truck,
  Wheat,
  User,
  Phone,
  QrCode,
  Lock,
  ArrowLeft,
  Printer,
  BadgeCheck,
} from "lucide-react";
import Link from "next/link";

function VerifyContent() {
  const searchParams = useSearchParams();

  const tokenId = searchParams.get("token") || "TK-1";
  const farmerName = searchParams.get("name") || "Verified Kisan";
  const farmerPhone = searchParams.get("phone") || "•••• ••••••";
  const center = searchParams.get("center") || "Krishi Upaj Mandi Hub";
  const bay = searchParams.get("bay") || "Gate 1-A";
  const crop = searchParams.get("crop") || "Wheat (Grade A)";
  const qty = searchParams.get("qty") || "35 Quintals";
  const status = searchParams.get("status") || "Waiting";
  const sessionKey = searchParams.get("key") || `PASS-${tokenId}-SECURE`;

  const verificationDate = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const verificationTime = new Date().toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="min-h-screen bg-[#edf1ed] text-zinc-900 flex flex-col items-center justify-center p-4 sm:p-6 select-none font-sans">
      <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 border border-zinc-200 shadow-2xl relative overflow-hidden flex flex-col gap-5 animate-in fade-in zoom-in-95 duration-200">
        {/* Top Government tricolor stripe */}
        <div className="h-2.5 w-full bg-linear-to-r from-orange-500 via-white to-emerald-600 absolute top-0 left-0 right-0 border-b border-zinc-100"></div>

        {/* Official Header */}
        <div className="flex items-center justify-between pt-2 border-b border-zinc-100 pb-3">
          <div className="flex items-center gap-2.5">
            <img
              src="/krishi logo.png"
              alt="Krishi-Queue Logo"
              className="w-10 h-10 object-contain"
            />
            <div>
              <div className="flex items-center gap-1">
                <span className="text-xs font-black text-emerald-950 uppercase tracking-wider">
                  Krishi-Queue e-Gate Pass
                </span>
                <BadgeCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              </div>
              <p className="text-[10px] text-zinc-500 font-medium">
                National Agriculture Market (e-NAM) • Govt. of India
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[9px] uppercase font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
              Verified
            </span>
          </div>
        </div>

        {/* Main Status Callout */}
        <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center gap-3.5 shadow-xs">
          <div className="w-11 h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[10px] font-black uppercase text-emerald-800 tracking-wider block">
              Official Digital Verification Pass
            </span>
            <span className="text-sm font-black text-emerald-950 block">
              ENTRY VALID & APPROVED
            </span>
            <span className="text-[11px] text-emerald-700">
              Gate pass authenticated via Mandi Security Protocol
            </span>
          </div>
        </div>

        {/* Live Token ID Highlight */}
        <div className="p-4 bg-zinc-900 text-white rounded-2xl flex flex-col items-center justify-center text-center shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl pointer-events-none"></div>
          <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-widest">
            Assigned Inflow Token Number
          </span>
          <span className="text-4xl font-black text-white font-mono tracking-tight my-1">
            #{tokenId}
          </span>
          <span className="text-xs font-bold text-zinc-300">
            Assigned Queue: <strong className="text-emerald-400">{bay}</strong>
          </span>
        </div>

        {/* Pass Details Table */}
        <div className="bg-zinc-50 rounded-2xl p-4 border border-zinc-200/90 space-y-2.5 text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-200">
            <span className="text-zinc-500 flex items-center gap-1.5 font-medium">
              <User className="w-3.5 h-3.5 text-zinc-400" />
              Farmer Legal Name
            </span>
            <strong className="text-zinc-900 font-bold text-sm">{farmerName}</strong>
          </div>

          {farmerPhone && farmerPhone !== "•••• ••••••" && !farmerPhone.startsWith("FARMER-") && /^\+?91?\d{10}$/.test(farmerPhone.replace(/[\s-]/g, "")) && (
            <div className="flex items-center justify-between pb-2 border-b border-zinc-200">
              <span className="text-zinc-500 flex items-center gap-1.5 font-medium">
                <Phone className="w-3.5 h-3.5 text-zinc-400" />
                Registered Contact
              </span>
              <strong className="text-zinc-800 font-mono font-semibold">{farmerPhone}</strong>
            </div>
          )}

          <div className="flex items-center justify-between pb-2 border-b border-zinc-200">
            <span className="text-zinc-500 flex items-center gap-1.5 font-medium">
              <Building2 className="w-3.5 h-3.5 text-zinc-400" />
              Procurement Center
            </span>
            <strong className="text-zinc-900 font-semibold">{center}</strong>
          </div>

          <div className="flex items-center justify-between pb-2 border-b border-zinc-200">
            <span className="text-zinc-500 flex items-center gap-1.5 font-medium">
              <Wheat className="w-3.5 h-3.5 text-zinc-400" />
              Commodity / Crop
            </span>
            <strong className="text-zinc-900 font-semibold">{crop}</strong>
          </div>

          <div className="flex items-center justify-between pb-2 border-b border-zinc-200">
            <span className="text-zinc-500 flex items-center gap-1.5 font-medium">
              <Truck className="w-3.5 h-3.5 text-zinc-400" />
              Declared Inflow Qty
            </span>
            <strong className="text-zinc-900 font-semibold">{qty}</strong>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-zinc-500 flex items-center gap-1.5 font-medium">
              <Clock className="w-3.5 h-3.5 text-zinc-400" />
              Scan Timestamp
            </span>
            <span className="text-zinc-700 font-mono text-[11px]">
              {verificationDate}, {verificationTime}
            </span>
          </div>
        </div>

        {/* Security Session Key Badge */}
        <div className="p-3 bg-zinc-100 rounded-xl border border-zinc-200 flex items-center justify-between text-[10px] font-mono text-zinc-600">
          <div className="flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
            <span>SECURE HASH:</span>
          </div>
          <span className="font-bold text-zinc-900">{sessionKey}</span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-1">
          <Link
            href="/"
            className="flex-1 py-2.5 px-3 rounded-xl border border-zinc-300 text-zinc-700 hover:bg-zinc-100 text-xs font-bold transition flex items-center justify-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Portal</span>
          </Link>
          <button
            type="button"
            onClick={() => window.print()}
            className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Pass</span>
          </button>
        </div>

        <p className="text-[10px] text-zinc-400 text-center">
          Krishi-Queue Official e-Gate Inflow Security System • Verified via UIDAI & APMC Mandi Registry
        </p>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#edf1ed] flex items-center justify-center p-4">
          <div className="p-6 bg-white rounded-3xl shadow-xl border border-zinc-200 text-center">
            <span className="text-sm font-bold text-emerald-800">
              Loading Verified e-Pass...
            </span>
          </div>
        </div>
      }
    >
      <VerifyContent />
    </Suspense>
  );
}
