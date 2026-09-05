"use client";

import React, { useState } from "react";
import {
  Users,
  Building2,
  Lock,
  Phone,
  Mail,
  User,
  MapPin,
  Wheat,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";

export interface UserSession {
  role: "farmer" | "manager";
  name: string;
  identifier: string; // phone or email
  location?: string;
  center?: string;
}

interface AuthViewProps {
  onLogin: (session: UserSession) => void;
}

export default function AuthView({ onLogin }: AuthViewProps) {
  const [role, setRole] = useState<"farmer" | "manager">("farmer");
  const [isSignUp, setIsSignUp] = useState(false);

  // Login form fields
  const [loginPhone, setLoginPhone] = useState("");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Sign up form fields
  const [signupName, setSignupName] = useState("");
  const [signupPhone, setSignupPhone] = useState("");
  const [signupVillage, setSignupVillage] = useState("");
  const [signupCenter, setSignupCenter] = useState("APMC Karnal Main Hub");
  const [signupCrops, setSignupCrops] = useState("Wheat, Paddy");

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (role === "farmer") {
      onLogin({
        role: "farmer",
        name: "Gurpreet Singh",
        identifier: loginPhone || "+91 98123 45671",
        location: "Nilokheri",
        center: "APMC Karnal Main Hub",
      });
    } else {
      onLogin({
        role: "manager",
        name: "Rajesh Sharma",
        identifier: loginEmail || "rajesh.sharma@apmc-karnal.gov.in",
        center: "APMC Karnal Main Hub",
      });
    }
  };

  const handleSignUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (role === "farmer") {
      onLogin({
        role: "farmer",
        name: signupName || "New Farmer",
        identifier: signupPhone || "+91 98000 11111",
        location: signupVillage || "Karnal",
        center: signupCenter,
      });
    } else {
      onLogin({
        role: "manager",
        name: signupName || "New Officer",
        identifier: loginEmail || "officer@apmc.gov.in",
        center: signupCenter,
      });
    }
  };

  // One-click demo logins for viva / testing
  const handleQuickDemo = (demoRole: "farmer" | "manager") => {
    if (demoRole === "farmer") {
      onLogin({
        role: "farmer",
        name: "Gurpreet Singh",
        identifier: "+91 98123 45671",
        location: "Nilokheri, Karnal",
        center: "APMC Karnal Main Hub",
      });
    } else {
      onLogin({
        role: "manager",
        name: "Rajesh Sharma",
        identifier: "rajesh.sharma@apmc-karnal.gov.in",
        center: "APMC Karnal Main Hub",
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#edf1ed] flex flex-col items-center justify-center p-4 sm:p-6 select-none">
      <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 border border-zinc-200/90 shadow-2xl shadow-zinc-300/50 flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center p-2 mb-3 shadow-xs">
            <img
              src="/krishi logo.png"
              alt="Krishi-Queue Logo"
              className="w-10 h-10 object-contain"
            />
          </div>
          <h1 className="text-2xl font-black text-emerald-950 tracking-tight flex items-center gap-2">
            Krishi-Queue
          </h1>
          <p className="text-xs text-zinc-600 mt-1">
            Agricultural Mandi Slot & Token Queue Management System
          </p>
        </div>

        {/* 1. Role Selector Pills (Farmer vs Center Manager) */}
        <div>
          <label className="block text-center text-xs font-bold text-zinc-600 uppercase tracking-wider mb-2">
            Select Your Account Role
          </label>
          <div className="grid grid-cols-2 gap-2 p-1 bg-zinc-100/90 rounded-2xl border border-zinc-200/70">
            <button
              type="button"
              onClick={() => setRole("farmer")}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                role === "farmer"
                  ? "bg-white text-emerald-900 shadow-sm border border-zinc-200"
                  : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              <Users className="w-4 h-4 text-emerald-700" />
              <span>Farmer (किसान)</span>
            </button>
            <button
              type="button"
              onClick={() => setRole("manager")}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                role === "manager"
                  ? "bg-zinc-900 text-white shadow-sm"
                  : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              <Building2 className="w-4 h-4 text-emerald-400" />
              <span>Manager (अधिकारी)</span>
            </button>
          </div>
        </div>

        {/* 2. Login vs Sign Up Tab Switcher */}
        <div className="flex border-b border-zinc-100 text-xs">
          <button
            type="button"
            onClick={() => setIsSignUp(false)}
            className={`flex-1 pb-2.5 font-bold text-center border-b-2 transition cursor-pointer ${
              !isSignUp
                ? "border-emerald-700 text-emerald-900"
                : "border-transparent text-zinc-600 hover:text-zinc-800"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setIsSignUp(true)}
            className={`flex-1 pb-2.5 font-bold text-center border-b-2 transition cursor-pointer ${
              isSignUp
                ? "border-emerald-700 text-emerald-900"
                : "border-transparent text-zinc-600 hover:text-zinc-800"
            }`}
          >
            Create Account
          </button>
        </div>

        {/* 3. Form Handling */}
        {!isSignUp ? (
          // SIGN IN FORM
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            {role === "farmer" ? (
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Farmer Mobile Number
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    placeholder="+91 98123 45671"
                    value={loginPhone}
                    onChange={(e) => setLoginPhone(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Manager Email or Officer ID
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    placeholder="rajesh.sharma@apmc-karnal.gov.in"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Password / Mandi PIN
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-full shadow-xs transition flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              <span>Sign In to {role === "farmer" ? "Farmer Portal" : "Manager Dashboard"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        ) : (
          // SIGN UP FORM
          <form onSubmit={handleSignUpSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder={role === "farmer" ? "Balwinder Sandhu" : "Officer Name"}
                  value={signupName}
                  onChange={(e) => setSignupName(e.target.value)}
                  required
                  className="w-full pl-9 pr-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                />
              </div>
            </div>

            {role === "farmer" ? (
              <>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Village / Tehsil
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Gharaunda, Karnal"
                      value={signupVillage}
                      onChange={(e) => setSignupVillage(e.target.value)}
                      required
                      className="w-full pl-9 pr-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Mobile Phone (for Token SMS)
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      placeholder="+91 98123 00000"
                      value={signupPhone}
                      onChange={(e) => setSignupPhone(e.target.value)}
                      required
                      className="w-full pl-9 pr-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Primary Crops
                  </label>
                  <div className="relative">
                    <Wheat className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Wheat, Mustard, Paddy"
                      value={signupCrops}
                      onChange={(e) => setSignupCrops(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Mandi Center Affiliation
                  </label>
                  <input
                    type="text"
                    value={signupCenter}
                    onChange={(e) => setSignupCenter(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Official Email
                  </label>
                  <input
                    type="email"
                    placeholder="officer@apmc.gov.in"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl"
                  />
                </div>
              </>
            )}

            <button
              type="submit"
              className="w-full py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-full shadow-xs transition flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              <span>Register & Enter Krishi-Queue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        )}

        {/* 4. One-Click Quick Demo Login Box (For College Presentation / Testing) */}
        <div className="pt-4 border-t border-zinc-100">
          <div className="text-[11px] font-bold text-zinc-500 text-center uppercase tracking-wider mb-2.5 flex items-center justify-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Instant Demo Logins (No Typing Needed)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickDemo("farmer")}
              className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-left transition cursor-pointer flex flex-col"
            >
              <span className="text-xs font-bold text-emerald-900 flex items-center gap-1">
                <Users className="w-3 h-3" /> Farmer Login
              </span>
              <span className="text-[10px] text-emerald-700 font-medium">
                Gurpreet Singh (Token #TK-108)
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemo("manager")}
              className="px-3 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-left transition cursor-pointer flex flex-col"
            >
              <span className="text-xs font-bold flex items-center gap-1">
                <Building2 className="w-3 h-3 text-emerald-400" /> Manager Login
              </span>
              <span className="text-[10px] text-zinc-400">
                Rajesh Sharma (APMC Karnal)
              </span>
            </button>
          </div>
        </div>
      </div>

      <div className="mt-4 text-center text-xs text-zinc-600">
        Krishi-Queue Mandi Management • e-NAM Integrated e-Gate System
      </div>
    </div>
  );
}
