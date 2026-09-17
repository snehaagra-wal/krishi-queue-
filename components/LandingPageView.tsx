"use client";

import React, { useState } from "react";
import {
  Wheat,
  MapPin,
  Clock,
  ShieldCheck,
  Building2,
  CheckCircle2,
  ArrowRight,
  Phone,
  HelpCircle,
  Sparkles,
  Users,
  ChevronDown,
  ChevronUp,
  FileText,
  Landmark,
  Zap,
  TrendingUp,
  Search,
  Menu,
  X,
  Truck,
  BadgeCheck,
} from "lucide-react";
import { PAN_INDIA_MANDI_CENTERS } from "@/lib/panIndiaLocations";

interface LandingPageViewProps {
  onOpenAuth: (role?: "farmer" | "manager") => void;
  showToast?: (msg: string) => void;
  totalCentersCount?: number;
  totalCheckinsCount?: number;
  totalGrainQuintals?: number;
  activeQueueCount?: number;
  registeredFarmersCount?: number;
}

export default function LandingPageView({
  onOpenAuth,
  showToast,
  totalCentersCount = PAN_INDIA_MANDI_CENTERS.length,
  totalCheckinsCount = 0,
  totalGrainQuintals = 0,
  activeQueueCount = 0,
  registeredFarmersCount = 0,
}: LandingPageViewProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [centerSearch, setCenterSearch] = useState("");
  const [selectedStateFilter, setSelectedStateFilter] = useState("All");



  const faqs = [
    {
      q: "Do I need a mobile number to register or book a Mandi slot?",
      a: "No! Krishi-Queue is built for simplicity. You can register and sign in with just your Farmer Full Name and Village. There are no mandatory mobile verification OTPs or complex phone barriers.",
    },
    {
      q: "How does the Digital Token & QR Pass work at the Mandi gate?",
      a: "When you book an arrival slot, Krishi-Queue generates a unique token (e.g. #TK-101) with a digital QR pass. Present this QR code on your phone or printed slip at the Mandi entrance for instant optical scanning and fast-track clearance.",
    },
    {
      q: "How do I receive my crop MSP payment?",
      a: "Your payment is deposited directly into your verified Bank Account or UPI ID via official government Direct Benefit Transfer (DBT). Zero middleman cuts or cash delays.",
    },
    {
      q: "What crops are currently procured under guaranteed MSP?",
      a: "All major government procurement crops are supported, including Sharbati Wheat, Mill Quality Wheat, Basmati Rice, Common Paddy, Mustard (Sarson), Gram (Chana), and Maize at official central MSP rates.",
    },
    {
      q: "Can I cancel or reschedule my arrival slot if weather changes?",
      a: "Yes! You can cancel or change your booked arrival date and time anytime directly inside your Farmer Portal dashboard before gate entry without any penalty.",
    },
    {
      q: "What should I do if I face any delay at the Mandi weighbridge?",
      a: "Every digital pass contains the contact details of the on-ground Center Superintendent. You can also dial our 24x7 Toll-Free Kisan Helpline at 1800-180-1551 (1551) for immediate grievance resolution.",
    },
  ];

  const filteredCenters = PAN_INDIA_MANDI_CENTERS.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(centerSearch.toLowerCase()) ||
      c.district.toLowerCase().includes(centerSearch.toLowerCase()) ||
      c.state.toLowerCase().includes(centerSearch.toLowerCase());
    const matchesState = selectedStateFilter === "All" || c.state === selectedStateFilter;
    return matchesSearch && matchesState;
  }).slice(0, 6);

  const statesList = ["All", "Madhya Pradesh", "Chhattisgarh", "Punjab", "Haryana", "Rajasthan", "Uttar Pradesh"];

  return (
    <div className="min-h-screen bg-[#f7f9f7] text-zinc-900 font-sans antialiased selection:bg-emerald-200 selection:text-emerald-950">
      {/* 1. PUBLIC TOP NAVIGATION BAR */}
      <header className="w-full bg-white/95 backdrop-blur-md border-b border-zinc-200/80 sticky top-0 z-50 transition-all">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
          {/* Brand Logo & Title */}
          <div className="flex items-center gap-3 shrink-0">
            <img
              src="/krishi logo.png"
              alt="Krishi-Queue Logo"
              className="w-10 h-10 object-contain drop-shadow-sm transition-transform hover:scale-105"
            />
            <div className="flex flex-col">
              <span className="font-extrabold text-xl tracking-tight text-emerald-950 flex items-center gap-1.5">
                Krishi-Queue
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Mandi Hub
                </span>
              </span>
              <span className="text-[11px] text-zinc-500 font-medium hidden sm:inline-block">
                National Agricultural Slot & Token Queue Network
              </span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 bg-zinc-100/80 p-1.5 rounded-full border border-zinc-200/70 shadow-inner">
            <a
              href="#hero"
              className="px-4 py-1.5 text-xs font-semibold text-zinc-700 hover:text-zinc-950 rounded-full hover:bg-white/80 transition"
            >
              Home
            </a>
            <a
              href="#about"
              className="px-4 py-1.5 text-xs font-semibold text-zinc-700 hover:text-zinc-950 rounded-full hover:bg-white/80 transition"
            >
              About Us
            </a>
            <a
              href="#how-it-works"
              className="px-4 py-1.5 text-xs font-semibold text-zinc-700 hover:text-zinc-950 rounded-full hover:bg-white/80 transition"
            >
              How It Works
            </a>
            <a
              href="#centers"
              className="px-4 py-1.5 text-xs font-semibold text-zinc-700 hover:text-zinc-950 rounded-full hover:bg-white/80 transition"
            >
              Mandi Centers
            </a>
            <a
              href="#faqs"
              className="px-4 py-1.5 text-xs font-semibold text-zinc-700 hover:text-zinc-950 rounded-full hover:bg-white/80 transition"
            >
              FAQs
            </a>
          </nav>

          {/* Right Action: Toll Free & Login Button */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-900 rounded-full border border-emerald-200/80 text-xs font-semibold">
              <Phone className="w-3.5 h-3.5 text-emerald-700" />
              <span>Toll-Free: <strong>1800-180-1551</strong></span>
            </div>

            <button
              onClick={() => onOpenAuth("farmer")}
              className="px-4 sm:px-5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white text-xs sm:text-sm font-bold rounded-full shadow-md shadow-emerald-950/20 hover:shadow-lg transition-all transform active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              <span>Sign In / Register</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl border border-zinc-200 text-zinc-700 hover:bg-zinc-100 transition cursor-pointer"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Slide-Down Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-zinc-200 bg-white px-4 py-4 space-y-2 animate-in slide-in-from-top-2 duration-200">
            <a
              href="#hero"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-100 rounded-xl"
            >
              Home (मुख्य पृष्ठ)
            </a>
            <a
              href="#about"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-100 rounded-xl"
            >
              About Us (हमारे बारे में)
            </a>
            <a
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-100 rounded-xl"
            >
              How It Works (कार्यप्रणाली)
            </a>
            <a
              href="#centers"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-100 rounded-xl"
            >
              Mandi Centers (मंडी केंद्र)
            </a>
            <a
              href="#faqs"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-100 rounded-xl"
            >
              FAQs (अक्सर पूछे जाने वाले सवाल)
            </a>
            <div className="pt-2 border-t border-zinc-100 flex flex-col gap-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAuth("farmer");
                }}
                className="w-full py-2.5 bg-emerald-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2"
              >
                <span>Farmer Sign In (किसान लॉगिन)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAuth("manager");
                }}
                className="w-full py-2.5 bg-zinc-900 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2"
              >
                <span>Mandi Officer Portal (अधिकारी प्रवेश)</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* 2. HERO SECTION WITH LUSH GREEN FARM BACKDROP & INSPIRING CROP CAPTION */}
      <section
        id="hero"
        className="relative min-h-[580px] lg:min-h-[640px] flex items-center justify-center bg-zinc-900 text-white overflow-hidden"
      >
        {/* Photographic Lush Green Farm Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 scale-105"
          style={{ backgroundImage: `url('/lush-farm-hero.jpg')` }}
        ></div>

        {/* Rich Gradient & Glass Overlay for Maximum Readability & Aesthetics */}
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/90 via-zinc-950/80 to-emerald-950/70 backdrop-blur-[1px]"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-transparent to-black/40"></div>

        <div className="relative max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 flex flex-col items-center text-center z-10">
          {/* Top Tagline Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 backdrop-blur-md text-emerald-200 text-xs sm:text-sm font-bold tracking-wide mb-6 shadow-lg animate-in fade-in duration-500">
            <Sparkles className="w-4 h-4 text-emerald-300" />
            <span>National Agricultural Queue & Slot Management System • e-NAM Integrated</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white max-w-4xl leading-[1.15] drop-shadow-md">
            From Bumper Harvest to Instant Fair MSP:{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-lime-200 to-amber-200">
              Seamless Digital Mandi Queues
            </span>{" "}
            for Every Indian Kisan.
          </h1>

          {/* Inspiring 1-Line English Crop Caption */}
          <p className="mt-5 text-sm sm:text-lg lg:text-xl text-zinc-200 max-w-3xl font-medium leading-relaxed drop-shadow">
            Nurturing India's golden wheat & paddy fields with zero-wait gate clearance, live digital queue tokens, and 100% direct-to-bank DBT payments.
          </p>

          {/* Hero Call to Action Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row items-center gap-3.5 w-full sm:w-auto">
            <button
              onClick={() => onOpenAuth("farmer")}
              className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-extrabold text-sm sm:text-base rounded-full shadow-xl shadow-emerald-950/40 hover:shadow-2xl transition transform active:scale-95 flex items-center justify-center gap-2.5 cursor-pointer border border-emerald-400/30"
            >
              <Users className="w-5 h-5" />
              <span>Enter Farmer Portal / किसान प्रवेश</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => onOpenAuth("manager")}
              className="w-full sm:w-auto px-6 py-3.5 bg-white/10 hover:bg-white/20 text-white font-bold text-sm sm:text-base rounded-full backdrop-blur-md border border-white/20 hover:border-white/40 transition transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Building2 className="w-5 h-5 text-emerald-300" />
              <span>Mandi Officer Portal (अधिकारी लॉगिन)</span>
            </button>
          </div>

          {/* 3 Floating Glassmorphism Hero Badges */}
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-4xl text-left">
            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center gap-3 shadow-lg">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0 border border-emerald-400/30">
                <Wheat className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs text-zinc-300 font-semibold block">MSP Guaranteed</span>
                <span className="text-sm font-bold text-white">₹2,275 Wheat • ₹2,300 Paddy</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center gap-3 shadow-lg">
              <div className="w-10 h-10 rounded-xl bg-lime-500/20 text-lime-300 flex items-center justify-center shrink-0 border border-lime-400/30">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs text-zinc-300 font-semibold block">Live Gate Queue</span>
                <span className="text-sm font-bold text-white">
                  {activeQueueCount > 0 ? `${activeQueueCount} Farmers in Queue` : "Zero Gate Queue • Express Entry"}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center gap-3 shadow-lg">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0 border border-amber-400/30">
                <Landmark className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs text-zinc-300 font-semibold block">Direct Bank DBT</span>
                <span className="text-sm font-bold text-white">100% Zero Middlemen Cuts</span>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* 4. ABOUT US SECTION */}
      <section id="about" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-[1280px] mx-auto">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          {/* Left Column: Story & Vision */}
          <div className="lg:w-1/2 space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
              <BadgeCheck className="w-4 h-4 text-emerald-700" />
              <span>About Krishi-Queue Network</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-zinc-900 tracking-tight leading-tight">
              Revolutionizing Indian Mandis with Transparency, Speed, and Respect for Farmers.
            </h2>
            <p className="text-sm sm:text-base text-zinc-600 leading-relaxed">
              For decades, hardworking Indian farmers spent up to 18–36 hours waiting in endless tractor queues outside Mandi gates, exposed to rain, heat, and price manipulation by unverified middlemen.
            </p>
            <p className="text-sm sm:text-base text-zinc-600 leading-relaxed">
              <strong>Krishi-Queue</strong> changes that reality completely. Built under the vision of Digital Agriculture and e-NAM, our platform enables every grower to book a guaranteed arrival slot from their phone or village CSC, enter the gate via digital QR token, weigh on tamper-proof electronic scales, and receive verified MSP payouts directly in their bank accounts.
            </p>

            <div className="pt-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="flex items-center gap-2.5 text-xs font-bold text-zinc-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Zero Middlemen / Direct MSP</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs font-bold text-zinc-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Real-Time Gate & Bay Tracking</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs font-bold text-zinc-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>No Mobile Numbers Required</span>
              </div>
            </div>
          </div>

          {/* Right Column: 4 Pillars Cards */}
          <div className="lg:w-1/2 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
            <div className="p-5 rounded-2xl bg-white border border-zinc-200/90 shadow-sm hover:border-emerald-300 transition">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center mb-3">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-zinc-900">Zero-Wait Gate Clearance</h3>
              <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                Pre-slotted arrival tokens prevent long highway traffic jams and allow farmers to unload their crop within minutes.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-zinc-200/90 shadow-sm hover:border-emerald-300 transition">
              <div className="w-10 h-10 rounded-xl bg-lime-50 text-lime-800 flex items-center justify-center mb-3">
                <Wheat className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-zinc-900">Guaranteed Fair MSP</h3>
              <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                Central benchmark prices strictly protected for wheat, paddy, chana, and oilseeds with digital grade slips.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-zinc-200/90 shadow-sm hover:border-emerald-300 transition">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center mb-3">
                <Landmark className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-zinc-900">Direct-to-Bank Settlement</h3>
              <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                Transparent DBT transfers directly to the farmer's verified bank account or UPI within 24 hours of weighbridge clearance.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-zinc-200/90 shadow-sm hover:border-emerald-300 transition">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center mb-3">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-zinc-900">Tamper-Proof Weighing</h3>
              <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                Electronic weighbridges linked directly to Cloud Firestore record exact gross and tare weight without manual slips.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. HOW IT WORKS (4 EASY STEPS) */}
      <section id="how-it-works" className="bg-[#edf2ee] py-16 sm:py-24 px-4 sm:px-6 lg:px-8 border-y border-zinc-200">
        <div className="max-w-[1280px] mx-auto text-center">
          <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider bg-emerald-100 px-3 py-1 rounded-full">
            Simple 4-Step Process (सरल प्रक्रिया)
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-zinc-900 tracking-tight mt-3">
            How Every Farmer Uses Krishi-Queue
          </h2>
          <p className="text-xs sm:text-sm text-zinc-600 max-w-2xl mx-auto mt-2">
            No complicated apps or paperwork. Book your token from your village in 60 seconds and enter the Mandi with confidence.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-10 text-left">
            {/* Step 1 */}
            <div className="p-6 rounded-3xl bg-white border border-zinc-200/90 shadow-xs flex flex-col justify-between">
              <div>
                <span className="w-8 h-8 rounded-full bg-emerald-800 text-white font-extrabold text-sm flex items-center justify-center mb-4">
                  1
                </span>
                <h3 className="font-bold text-base text-zinc-900">Register in 30 Seconds</h3>
                <p className="text-xs text-zinc-600 mt-2 leading-relaxed">
                  Enter your Full Name and Village. No phone number or passwords required. Select your nearest APMC center.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-zinc-100 text-[11px] font-semibold text-emerald-700">
                ✓ 100% Free & Open
              </div>
            </div>

            {/* Step 2 */}
            <div className="p-6 rounded-3xl bg-white border border-zinc-200/90 shadow-xs flex flex-col justify-between">
              <div>
                <span className="w-8 h-8 rounded-full bg-emerald-800 text-white font-extrabold text-sm flex items-center justify-center mb-4">
                  2
                </span>
                <h3 className="font-bold text-base text-zinc-900">Book Arrival Slot</h3>
                <p className="text-xs text-zinc-600 mt-2 leading-relaxed">
                  Pick your crop (Wheat, Paddy, etc.), estimated quintals, and arrival time. Get an instant token with a Digital QR Pass.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-zinc-100 text-[11px] font-semibold text-emerald-700">
                ✓ Instant QR Pass Generated
              </div>
            </div>

            {/* Step 3 */}
            <div className="p-6 rounded-3xl bg-white border border-zinc-200/90 shadow-xs flex flex-col justify-between">
              <div>
                <span className="w-8 h-8 rounded-full bg-emerald-800 text-white font-extrabold text-sm flex items-center justify-center mb-4">
                  3
                </span>
                <h3 className="font-bold text-base text-zinc-900">Express Gate Entry</h3>
                <p className="text-xs text-zinc-600 mt-2 leading-relaxed">
                  Arrive at the Mandi gate. Show your QR token for optical scan. Move directly to electronic weighbridge without lines.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-zinc-100 text-[11px] font-semibold text-emerald-700">
                ✓ Average 14 Mins In-and-Out
              </div>
            </div>

            {/* Step 4 */}
            <div className="p-6 rounded-3xl bg-white border border-zinc-200/90 shadow-xs flex flex-col justify-between">
              <div>
                <span className="w-8 h-8 rounded-full bg-emerald-800 text-white font-extrabold text-sm flex items-center justify-center mb-4">
                  4
                </span>
                <h3 className="font-bold text-base text-zinc-900">Direct Bank Payout</h3>
                <p className="text-xs text-zinc-600 mt-2 leading-relaxed">
                  Grain weight is automatically calculated against official MSP rate and sent straight to your Bank or UPI account via DBT.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-zinc-100 text-[11px] font-semibold text-emerald-700">
                ✓ Official Central MSP Rates
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. PAN-INDIA MANDI CENTERS HIGHLIGHTS */}
      <section id="centers" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-[1280px] mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider bg-emerald-100 px-3 py-1 rounded-full">
              Pan-India APMC Network
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-zinc-900 tracking-tight mt-2">
              Registered Procurement Centers
            </h2>
            <p className="text-xs sm:text-sm text-zinc-500 mt-1">
              Find an authorized e-NAM Mandi center near your village for fast-track slot bookings.
            </p>
          </div>

          {/* State Filter Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 no-scrollbar max-w-full">
            {statesList.map((st) => (
              <button
                key={st}
                onClick={() => setSelectedStateFilter(st)}
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  selectedStateFilter === st
                    ? "bg-zinc-900 text-white shadow-xs"
                    : "bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-100"
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Centers Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCenters.map((c, idx) => (
            <div
              key={`${c.id}-${c.district}-${idx}`}
              className="p-5 rounded-3xl bg-white border border-zinc-200/90 shadow-2xs hover:border-emerald-400 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] font-mono bg-zinc-100 text-zinc-700 px-2 py-0.5 rounded font-bold">
                    {c.id.toUpperCase()}
                  </span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                    e-Gate Active
                  </span>
                </div>
                <h3 className="font-bold text-sm text-zinc-900">{c.name}</h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  District {c.district}, {c.state}
                </p>

                <div className="mt-3 flex items-center gap-2 text-xs text-zinc-600">
                  <span className="font-semibold">Bays:</span> {c.baysCount} Electronic Weighbridges
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between">
                <span className="text-[11px] text-emerald-700 font-semibold">Wheat & Paddy Ready</span>
                <button
                  onClick={() => onOpenAuth("farmer")}
                  className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs rounded-full transition cursor-pointer"
                >
                  Book Slot &rarr;
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 7. FREQUENTLY ASKED QUESTIONS (FAQS) & KISAN CALL CENTRE SECTION */}
      <section id="faqs" className="bg-white py-16 sm:py-24 px-4 sm:px-6 lg:px-8 border-t border-zinc-200">
        <div className="max-w-[1280px] mx-auto">
          {/* Section Header */}
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider bg-emerald-100 px-3 py-1 rounded-full">
              Kisan Sahayata & Margdarshan
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-zinc-900 tracking-tight mt-3">
              Frequently Asked Questions (अक्सर पूछे जाने वाले सवाल)
            </h2>
            <p className="text-xs sm:text-sm text-zinc-500 mt-2">
              Clear answers to common questions about slot booking, token queueing, and direct MSP payments.
            </p>
          </div>

          {/* Official Kisan Call Centre Toll-Free Banner */}
          <div className="mb-10 p-6 rounded-3xl bg-gradient-to-br from-emerald-900 via-emerald-950 to-zinc-950 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 border border-emerald-800/40">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20 shrink-0">
                <Phone className="w-7 h-7 text-emerald-300" />
              </div>
              <div>
                <span className="text-xs text-emerald-300 font-bold uppercase tracking-wider block">
                  Ministry of Agriculture • Govt. of India Kisan Call Centre
                </span>
                <span className="text-2xl sm:text-3xl font-black text-white block mt-0.5">
                  1800-180-1551 (Toll-Free / निःशुल्क)
                </span>
                <p className="text-xs text-emerald-100/80 mt-1">
                  24x7 assistance in Hindi and regional Indian languages from official agricultural advisors.
                </p>
              </div>
            </div>
            <div className="p-3 rounded-2xl bg-white/10 border border-white/15 text-xs text-emerald-200 flex items-center gap-2 shrink-0">
              <Clock className="w-4 h-4 text-emerald-300" />
              <span>Available 24 Hours • 7 Days a Week</span>
            </div>
          </div>

          {/* Interactive FAQs Accordion */}
          <div className="max-w-4xl mx-auto space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className="border border-zinc-200 rounded-2xl overflow-hidden transition-all bg-[#fcfdfc] shadow-2xs"
                >
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full p-4.5 text-left flex items-center justify-between gap-3 text-xs sm:text-sm font-bold text-zinc-900 hover:text-emerald-900 transition cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-emerald-700 shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-zinc-400 shrink-0" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="px-4.5 pb-4.5 text-xs sm:text-sm text-zinc-600 leading-relaxed border-t border-zinc-100 pt-3 bg-white">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 8. GOVERNMENT & DIGITAL INDIA FOOTER */}
      <footer className="w-full bg-[#111913] text-zinc-400 py-12 px-4 sm:px-6 lg:px-8 border-t border-emerald-950">
        <div className="max-w-[1280px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-zinc-800">
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center gap-2.5">
              <img src="/krishi logo.png" alt="Logo" className="w-9 h-9 object-contain" />
              <span className="font-black text-lg text-white tracking-tight">Krishi-Queue Mandi Hub</span>
            </div>
            <p className="text-xs text-zinc-400 max-w-md leading-relaxed">
              India's premier digital queue & token management network for agricultural procurement centers. Empowering farmers with transparent gate clearance and direct MSP DBT bank settlements.
            </p>
            <div className="flex items-center gap-2 pt-1 text-[11px] text-emerald-400 font-semibold">
              <span>e-NAM Integrated</span> • <span>Digital India Initiative</span> • <span>PM Kisan Aligned</span>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Quick Navigation</h4>
            <ul className="space-y-2 text-xs">
              <li><a href="#hero" className="hover:text-white transition">Home</a></li>
              <li><a href="#about" className="hover:text-white transition">About Us</a></li>
              <li><a href="#how-it-works" className="hover:text-white transition">How It Works</a></li>
              <li><a href="#centers" className="hover:text-white transition">Pan-India Mandis</a></li>
              <li><a href="#help" className="hover:text-white transition">Kisan Helpdesk</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Access Portals</h4>
            <div className="space-y-2 text-xs">
              <button
                onClick={() => onOpenAuth("farmer")}
                className="w-full text-left px-3 py-1.5 rounded-lg bg-zinc-800/80 hover:bg-emerald-900 text-white font-medium transition cursor-pointer"
              >
                Farmer Portal Login &rarr;
              </button>
              <button
                onClick={() => onOpenAuth("manager")}
                className="w-full text-left px-3 py-1.5 rounded-lg bg-zinc-800/80 hover:bg-emerald-900 text-white font-medium transition cursor-pointer"
              >
                Mandi Officer Portal &rarr;
              </button>
              <div className="pt-2 text-[11px] text-zinc-500">
                Toll Free: 1800-180-1551<br />
                support@krishiqueue.gov.in
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-[1280px] mx-auto pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-zinc-500">
          <div>
            © {new Date().getFullYear()} Krishi-Queue Mandi Management System. Ministry of Agriculture & Farmers Welfare, Govt. of India.
          </div>
          <div className="flex items-center gap-4">
            <a href="#help" className="hover:text-zinc-300">Privacy Policy</a>
            <span>•</span>
            <a href="#help" className="hover:text-zinc-300">Terms of Service</a>
            <span>•</span>
            <a href="#help" className="hover:text-zinc-300">e-NAM Guidelines</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
